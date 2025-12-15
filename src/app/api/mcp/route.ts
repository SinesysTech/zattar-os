/**
 * Endpoint MCP Principal do Sinesys
 *
 * Implementa comunicação Server-Sent Events (SSE) para o protocolo MCP
 */

import { NextRequest, NextResponse } from 'next/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { getMcpServerManager } from '@/lib/mcp/server';
import { registerAllTools, areToolsRegistered } from '@/lib/mcp/registry';
import { authenticateRequest } from '@/lib/auth/session';

// Armazena conexões ativas
const activeConnections = new Map<string, {
  transport: SSEServerTransport;
  userId: number | null;
  connectedAt: Date;
}>();

/**
 * GET /api/mcp - Inicia conexão SSE com o servidor MCP
 */
export async function GET(request: NextRequest): Promise<Response> {
  console.log('[MCP API] Nova conexão SSE recebida');

  // Verificar autenticação (opcional - permite conexões anônimas com acesso limitado)
  const user = await authenticateRequest();
  const userId = user?.id || null;

  if (!userId) {
    console.log('[MCP API] Conexão anônima - acesso limitado');
  } else {
    console.log(`[MCP API] Conexão autenticada - usuário ${userId}`);
  }

  // Garantir que as ferramentas estão registradas
  if (!areToolsRegistered()) {
    console.log('[MCP API] Registrando ferramentas...');
    await registerAllTools();
  }

  // Gerar ID único para esta conexão
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Criar resposta SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Enviar evento de conexão estabelecida
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        connectionId,
        server: getMcpServerManager().getServerInfo(),
        authenticated: !!userId,
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Configurar ping para manter conexão viva
      const pingInterval = setInterval(() => {
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping a cada 30 segundos

      // Cleanup quando a conexão for fechada
      request.signal.addEventListener('abort', () => {
        console.log(`[MCP API] Conexão ${connectionId} encerrada`);
        clearInterval(pingInterval);
        activeConnections.delete(connectionId);
        controller.close();
      });

      // Armazenar conexão
      activeConnections.set(connectionId, {
        transport: null as unknown as SSEServerTransport, // Será configurado via POST
        userId,
        connectedAt: new Date(),
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilita buffering no nginx
      'X-Connection-Id': connectionId,
    },
  });
}

/**
 * POST /api/mcp - Recebe mensagens MCP e executa ferramentas
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[MCP API] Mensagem POST recebida');

  try {
    // Verificar autenticação
    const user = await authenticateRequest();
    const userId = user?.id || null;

    // Parsear corpo da requisição
    const body = await request.json();
    const { method, params, id } = body;

    console.log(`[MCP API] Método: ${method}, ID: ${id}`);

    // Garantir que as ferramentas estão registradas
    if (!areToolsRegistered()) {
      await registerAllTools();
    }

    const manager = getMcpServerManager();

    // Roteamento de métodos MCP
    switch (method) {
      case 'initialize': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: manager.getServerInfo(),
          },
        });
      }

      case 'tools/list': {
        const tools = manager.listTools().map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: {}, // Simplificado
          },
        }));

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { tools },
        });
      }

      case 'tools/call': {
        const { name, arguments: args } = params || {};

        // Verificar se a ferramenta requer autenticação
        const tool = manager.getTool(name);
        if (!tool) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Ferramenta não encontrada: ${name}`,
            },
          });
        }

        if (tool.requiresAuth && !userId) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32600,
              message: 'Autenticação necessária para esta ferramenta',
            },
          });
        }

        // Executar ferramenta
        const result = await manager.executeTool(name, args);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result,
        });
      }

      case 'notifications/initialized': {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      default: {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Método não suportado: ${method}`,
          },
        });
      }
    }
  } catch (error) {
    console.error('[MCP API] Erro ao processar mensagem:', error);

    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
    }, { status: 500 });
  }
}

/**
 * OPTIONS /api/mcp - Suporte a CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
