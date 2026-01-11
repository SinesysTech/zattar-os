/**
 * Endpoint MCP com HTTP Streamable (Recomendado para N8N)
 *
 * Implementa streaming HTTP bidirecional para compatibilidade com N8N
 * e outros clientes MCP modernos.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMcpServerManager } from "@/lib/mcp/server";
import { registerAllTools, areToolsRegistered } from "@/lib/mcp/registry";
import { registerAllResources } from "@/lib/mcp/resources-registry";
import { registerAllPrompts } from "@/lib/mcp/prompts-registry";
import { authenticateRequest as authenticateApiRequest } from "@/lib/auth/api-auth";
import {
  checkEndpointRateLimit,
  checkToolRateLimit,
  getRateLimitHeaders,
  type RateLimitTier,
} from "@/lib/mcp/rate-limit";
import { getClientIp } from "@/lib/utils/get-client-ip";
import { recordSuspiciousActivity } from "@/lib/security/ip-blocking";
import {
  getCachedSchema,
  setCachedSchema,
  getCachedToolList,
  setCachedToolList,
} from "@/lib/mcp/cache";
import { checkQuota, incrementQuota } from "@/lib/mcp/quotas";
import { getCorsHeaders, getPreflightCorsHeaders } from "@/lib/cors/config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * POST /api/mcp/stream - HTTP Streamable endpoint
 *
 * Processa requisições MCP usando HTTP streaming ao invés de SSE
 */
export async function POST(request: NextRequest): Promise<Response> {
  console.log("[MCP Stream] Nova requisição HTTP Streamable recebida");

  // Obter origem para CORS
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Verificar autenticação (suporta x-service-api-key, Bearer JWT e cookies)
    const authResult = await authenticateApiRequest(request);
    const userId = authResult.usuarioId || null;

    // Determinar tier baseado na fonte de autenticação
    let tier: RateLimitTier = "anonymous";
    if (authResult.source === "service") {
      tier = "service";
    } else if (authResult.authenticated && userId) {
      tier = "authenticated";
    }

    // Obter identificador para rate limit
    const identifier = userId?.toString() || getClientIp(request);

    // Verificar rate limit geral
    const rateLimitResult = await checkEndpointRateLimit(identifier, "/api/mcp/stream", tier);
    if (!rateLimitResult.allowed) {
      console.log(`[MCP Stream] Rate limit excedido para ${identifier}`);

      // Record suspicious activity for rate limit abuse
      await recordSuspiciousActivity(getClientIp(request), "rate_limit_abuse", "/api/mcp/stream");

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32000,
            message: "Rate limit exceeded",
            data: { retryAfter: rateLimitResult.resetAt.toISOString() },
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
            ...corsHeaders,
          },
        }
      );
    }

    // Parsear corpo da requisição (precisa ser resiliente: alguns clientes podem enviar body vazio)
    const rawBody = await request.text();
    if (!rawBody || rawBody.trim().length === 0) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
            data: { reason: "Empty request body" },
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
            data: { reason: "Invalid JSON" },
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!isRecord(body)) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32600,
            message: "Invalid Request",
            data: { reason: "Request body must be a JSON object" },
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const method = typeof body.method === "string" ? body.method : undefined;
    const params = isRecord(body.params) ? body.params : body.params;
    const id = body.id ?? null;

    if (!method) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32600,
            message: "Invalid Request",
            data: { reason: "Missing or invalid 'method'" },
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[MCP Stream] Método: ${method}, ID: ${id}`);

    // Garantir que as ferramentas, resources e prompts estão registrados
    if (!areToolsRegistered()) {
      await registerAllTools();
      await registerAllResources();
      await registerAllPrompts();
    }

    const manager = getMcpServerManager();

    // Criar encoder para streaming
    // const encoder = new TextEncoder();

    // Para métodos que não precisam de streaming, retornar JSON direto
    if (method === "initialize" || method === "tools/list") {
      return await handleNonStreamingMethod(method, id, manager, corsHeaders);
    }

    // Para tools/call, usar streaming se necessário
    if (method === "tools/call") {
      const paramsObj = isRecord(params) ? params : undefined;
      const name = typeof paramsObj?.name === "string" ? paramsObj.name : undefined;
      const args = paramsObj && "arguments" in paramsObj ? paramsObj.arguments : undefined;

      if (!name) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32600,
              message: "Invalid Request",
              data: { reason: "Missing or invalid 'params.name' for tools/call" },
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Verificar se a ferramenta existe
      const tool = manager.getTool(name);
      if (!tool) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Ferramenta não encontrada: ${name}`,
            },
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Verificar autenticação
      // Service tier (userId = 'system') é permitido para ferramentas que requerem auth
      const isAuthenticated = authResult.authenticated && (userId || authResult.source === 'service');

      if (tool.requiresAuth && !isAuthenticated) {
        const errorMessage = authResult.error || "Autenticação necessária para esta ferramenta";
        console.error(`[MCP Stream] Ferramenta ${name} requer autenticação, mas não foi autenticado`);
        console.error(`[MCP Stream] Motivo: ${errorMessage}`);
        console.error(`[MCP Stream] Auth status: authenticated=${authResult.authenticated}, source=${authResult.source}, userId=${userId}`);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32600,
              message: errorMessage,
              data: {
                tool: name,
                requiresAuth: true,
                authSource: authResult.source || null,
              },
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Verificar quota antes da execução
      const quotaCheck = await checkQuota(userId, tier);
      if (!quotaCheck.allowed) {
        console.log(`[MCP Stream] Quota excedida para usuário ${userId}`);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: quotaCheck.reason || "Quota excedida",
              data: {
                retryAfter: quotaCheck.resetAt?.toISOString(),
                remaining: quotaCheck.remaining,
              },
            },
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Verificar rate limit específico da ferramenta
      const toolRateLimit = await checkToolRateLimit(identifier, name, tier);
      if (!toolRateLimit.allowed) {
        console.log(`[MCP Stream] Rate limit de ferramenta excedido: ${name}`);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: `Rate limit exceeded for tool: ${name}`,
              data: { retryAfter: toolRateLimit.resetAt.toISOString() },
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...getRateLimitHeaders(toolRateLimit),
              ...corsHeaders,
            },
          }
        );
      }

      // Executar ferramenta (sem streaming por enquanto, retorna resultado completo)
      const result = await manager.executeTool(name, args);

      // Incrementar quota após execução bem-sucedida
      if (!result.isError) {
        await incrementQuota(userId, tier);
      }

      // Retornar como JSON (N8N processa isso como streaming)
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Transfer-Encoding": "chunked", // Indica que é streamable
            ...corsHeaders,
          },
        }
      );
    }

    // Método não suportado
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Método não suportado: ${method}`,
        },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("[MCP Stream] Erro ao processar requisição:", error);

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message:
            error instanceof Error ? error.message : "Erro interno do servidor",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Processa métodos que não precisam de streaming
 */
async function handleNonStreamingMethod(
  method: string,
  id: unknown,
  manager: ReturnType<typeof getMcpServerManager>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (method === "initialize") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: manager.getServerInfo(),
        },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  if (method === "tools/list") {
    // Tentar buscar do cache primeiro
    const cachedTools = await getCachedToolList();
    if (cachedTools) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: { tools: cachedTools },
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Converter schemas Zod para JSON Schema com cache
    const tools = await Promise.all(
      manager.listTools().map(async (tool) => {
        // Tentar buscar schema do cache
        let inputSchema = await getCachedSchema(tool.name);

        if (!inputSchema) {
          // Converter Zod para JSON Schema
          const jsonSchema = manager.zodToJsonSchema(tool.schema);
          inputSchema = {
            type: "object" as const,
            properties: jsonSchema.properties,
            required: jsonSchema.required,
          };

          // Armazenar no cache
          await setCachedSchema(tool.name, inputSchema);
        }

        return {
          name: tool.name,
          description: tool.description,
          inputSchema,
        };
      })
    );

    // Armazenar lista completa no cache
    await setCachedToolList(tools);

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: { tools },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Método não suportado: ${method}`,
      },
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

/**
 * OPTIONS /api/mcp/stream - CORS (Preflight Request)
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  const corsHeaders = getPreflightCorsHeaders(origin);

  return new NextResponse(null, {
    headers: corsHeaders,
  });
}
