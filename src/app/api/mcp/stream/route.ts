/**
 * Endpoint MCP com HTTP Streamable (Recomendado para N8N)
 *
 * Implementa streaming HTTP bidirecional para compatibilidade com N8N
 * e outros clientes MCP modernos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMcpServerManager } from '@/lib/mcp/server';
import { registerAllTools, areToolsRegistered } from '@/lib/mcp/registry';
import { authenticateRequest } from '@/lib/auth/session';
import { checkRateLimit, checkToolRateLimit, getRateLimitHeaders, type RateLimitTier } from '@/lib/mcp/rate-limit';

/**
 * POST /api/mcp/stream - HTTP Streamable endpoint
 *
 * Processa requisições MCP usando HTTP streaming ao invés de SSE
 */
export async function POST(request: NextRequest): Promise<Response> {
  console.log('[MCP Stream] Nova requisição HTTP Streamable recebida');

  try {
    // Verificar autenticação
    const user = await authenticateRequest();
    const userId = user?.id || null;
    const tier: RateLimitTier = userId ? 'authenticated' : 'anonymous';

    // Obter identificador para rate limit
    const identifier = userId?.toString() || request.headers.get('x-forwarded-for') || 'unknown';

    // Verificar rate limit geral
    const rateLimitResult = await checkRateLimit(identifier, tier);
    if (!rateLimitResult.allowed) {
      console.log(`[MCP Stream] Rate limit excedido para ${identifier}`);
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: 'Rate limit exceeded',
            data: { retryAfter: rateLimitResult.resetAt.toISOString() },
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    // Parsear corpo da requisição
    const body = await request.json();
    const { method, params, id } = body;

    console.log(`[MCP Stream] Método: ${method}, ID: ${id}`);

    // Garantir que as ferramentas estão registradas
    if (!areToolsRegistered()) {
      await registerAllTools();
    }

    const manager = getMcpServerManager();

    // Criar encoder para streaming
    const encoder = new TextEncoder();

    // Para métodos que não precisam de streaming, retornar JSON direto
    if (method === 'initialize' || method === 'tools/list') {
      return handleNonStreamingMethod(method, id, manager);
    }

    // Para tools/call, usar streaming se necessário
    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};

      // Verificar se a ferramenta existe
      const tool = manager.getTool(name);
      if (!tool) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Ferramenta não encontrada: ${name}`,
            },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Verificar autenticação
      if (tool.requiresAuth && !userId) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32600,
              message: 'Autenticação necessária para esta ferramenta',
            },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Verificar rate limit específico da ferramenta
      const toolRateLimit = await checkToolRateLimit(identifier, name, tier);
      if (!toolRateLimit.allowed) {
        console.log(`[MCP Stream] Rate limit de ferramenta excedido: ${name}`);
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
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
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(toolRateLimit),
            },
          }
        );
      }

      // Executar ferramenta (sem streaming por enquanto, retorna resultado completo)
      const result = await manager.executeTool(name, args);

      // Retornar como JSON (N8N processa isso como streaming)
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked', // Indica que é streamable
          },
        }
      );
    }

    // Método não suportado
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Método não suportado: ${method}`,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[MCP Stream] Erro ao processar requisição:', error);

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Processa métodos que não precisam de streaming
 */
function handleNonStreamingMethod(
  method: string,
  id: unknown,
  manager: ReturnType<typeof getMcpServerManager>
): Response {
  if (method === 'initialize') {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: manager.getServerInfo(),
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (method === 'tools/list') {
    const tools = manager.listTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: {},
      },
    }));

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: { tools },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Método não suportado: ${method}`,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * OPTIONS /api/mcp/stream - CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-service-api-key',
    },
  });
}
