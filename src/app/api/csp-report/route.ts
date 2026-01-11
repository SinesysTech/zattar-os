/**
 * CSP Report Endpoint
 *
 * Recebe relatórios de violação da Content Security Policy.
 * Esses relatórios são enviados automaticamente pelo navegador quando
 * uma violação CSP é detectada.
 *
 * Este endpoint:
 * 1. Recebe o relatório no formato JSON
 * 2. Aplica rate limiting básico para evitar spam
 * 3. Loga a violação para análise
 * 4. Retorna 204 No Content
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/mcp/rate-limit";
import { supabaseLogger } from "@/lib/supabase/logger";
import { getCorsHeaders, getPreflightCorsHeaders } from "@/lib/cors/config";
import { getClientIp } from "@/lib/utils/get-client-ip";

/**
 * Interface para o relatório de violação CSP
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */
interface CSPViolationReport {
  "csp-report"?: {
    "document-uri"?: string;
    referrer?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    disposition?: "enforce" | "report";
    "blocked-uri"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "source-file"?: string;
    "status-code"?: number;
    "script-sample"?: string;
  };
}

/**
 * Interface para o formato Report-To API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API
 */
interface ReportToBody {
  type?: string;
  age?: number;
  url?: string;
  user_agent?: string;
  body?: {
    documentURL?: string;
    referrer?: string;
    violatedDirective?: string;
    effectiveDirective?: string;
    originalPolicy?: string;
    disposition?: "enforce" | "report";
    blockedURL?: string;
    lineNumber?: number;
    columnNumber?: number;
    sourceFile?: string;
    statusCode?: number;
    sample?: string;
  };
}

/**
 * Processa relatório no formato CSP Report
 */
function processCSPReport(report: CSPViolationReport["csp-report"]) {
  if (!report) return null;

  return {
    documentUri: report["document-uri"],
    violatedDirective: report["violated-directive"],
    effectiveDirective: report["effective-directive"],
    blockedUri: report["blocked-uri"],
    sourceFile: report["source-file"],
    lineNumber: report["line-number"],
    columnNumber: report["column-number"],
    disposition: report.disposition,
    sample: report["script-sample"],
  };
}

/**
 * Processa relatório no formato Report-To API
 */
function processReportToBody(body: ReportToBody["body"]) {
  if (!body) return null;

  return {
    documentUri: body.documentURL,
    violatedDirective: body.violatedDirective,
    effectiveDirective: body.effectiveDirective,
    blockedUri: body.blockedURL,
    sourceFile: body.sourceFile,
    lineNumber: body.lineNumber,
    columnNumber: body.columnNumber,
    disposition: body.disposition,
    sample: body.sample,
  };
}

/**
 * Verifica se a violação deve ser ignorada (falso positivo comum)
 */
function shouldIgnoreViolation(violation: ReturnType<typeof processCSPReport>): boolean {
  if (!violation) return true;

  // Ignorar violações de extensões de navegador
  const ignoredSources = [
    "chrome-extension://",
    "moz-extension://",
    "safari-extension://",
    "ms-browser-extension://",
  ];

  const blockedUri = violation.blockedUri || "";
  const sourceFile = violation.sourceFile || "";

  for (const prefix of ignoredSources) {
    if (blockedUri.startsWith(prefix) || sourceFile.startsWith(prefix)) {
      return true;
    }
  }

  // Ignorar violações de inline (geralmente causadas por extensões)
  if (blockedUri === "inline" && !violation.sourceFile) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  // Obter origem para CORS
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Obter IP do cliente para rate limiting
  const ip = getClientIp(request);

  // Verificar rate limit
  const rateLimit = await checkRateLimit(`csp-report:${ip}`, "anonymous");
  if (!rateLimit.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: { ...getRateLimitHeaders(rateLimit), ...corsHeaders },
    });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let violation: ReturnType<typeof processCSPReport> = null;

    // Parse do corpo baseado no content-type
    if (
      contentType.includes("application/csp-report") ||
      contentType.includes("application/json")
    ) {
      const body = await request.json();

      // Formato CSP Report (legado)
      if (body["csp-report"]) {
        violation = processCSPReport(body["csp-report"]);
      }
      // Formato Report-To API
      else if (body.type === "csp-violation" && body.body) {
        violation = processReportToBody(body.body);
      }
      // Array de relatórios (Report-To pode enviar múltiplos)
      else if (Array.isArray(body)) {
        for (const report of body) {
          if (report.type === "csp-violation" && report.body) {
            violation = processReportToBody(report.body);
            if (violation && !shouldIgnoreViolation(violation)) {
              logViolation(violation);
            }
          }
        }
        return new NextResponse(null, { status: 204, headers: corsHeaders });
      }
    }

    // Ignorar violações de falso positivo
    if (shouldIgnoreViolation(violation)) {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // Logar violação
    if (violation) {
      logViolation(violation);
    }

    return new NextResponse(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    // Logar erro mas não falhar
    supabaseLogger.error("[CSP Report] Erro ao processar relatório", error);
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }
}

/**
 * Loga uma violação CSP
 */
function logViolation(violation: ReturnType<typeof processCSPReport>) {
  if (!violation) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "CSP_VIOLATION",
    data: {
      documentUri: violation.documentUri,
      violatedDirective: violation.violatedDirective,
      effectiveDirective: violation.effectiveDirective,
      blockedUri: violation.blockedUri,
      sourceFile: violation.sourceFile,
      lineNumber: violation.lineNumber,
      columnNumber: violation.columnNumber,
      disposition: violation.disposition,
    },
  };

  supabaseLogger.warn("[CSP Violation]", logEntry);
}

// Suporte a OPTIONS para CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getPreflightCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
