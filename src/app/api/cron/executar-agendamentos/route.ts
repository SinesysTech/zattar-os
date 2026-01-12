/**
 * API Route: Executar Agendamentos de Captura
 *
 * Esta rota executa o scheduler de agendamentos de captura.
 * Busca todos os agendamentos com proxima_execucao <= NOW() e os executa.
 *
 * Deve ser chamada periodicamente via cron job externo (ex: cron-job.org, CapRover cron, etc.)
 *
 * Autenticação: Requer secret token via header Authorization
 *
 * Exemplo de chamada:
 * curl -X POST https://seu-dominio.com/api/cron/executar-agendamentos \
 *   -H "Authorization: Bearer SEU_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { executarScheduler } from "@/features/captura/services/scheduler/agendamento-scheduler.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Aumentar timeout para capturas longas (máximo permitido)
export const maxDuration = 300; // 5 minutos

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autenticação via secret token
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      console.warn(
        "[Cron Agendamentos] CRON_SECRET não configurado. Configure a variável de ambiente."
      );
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[Cron Agendamentos] Tentativa de acesso não autorizado", {
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length,
        expectedLength: `Bearer ${expectedToken}`.length,
        // NÃO logar o token completo por segurança
        authHeaderStart: authHeader?.substring(0, 10),
        expectedStart: `Bearer ${expectedToken}`.substring(0, 10),
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Agendamentos] Iniciando execução do scheduler...");

    // Executar o scheduler
    await executarScheduler();

    const duration = Date.now() - startTime;

    console.log(`[Cron Agendamentos] Execução concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Scheduler executado com sucesso",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Agendamentos] Erro ao executar scheduler:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao executar scheduler",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Permitir GET para facilitar testes e health checks (mesma autenticação)
export async function GET(request: NextRequest) {
  return POST(request);
}
