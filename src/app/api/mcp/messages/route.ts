/**
 * Endpoint de Mensagens MCP do Sinesys
 *
 * Endpoint alternativo para comunicação MCP via requisições individuais
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMcpServerManager } from '@/lib/mcp/server';
import { registerAllTools, areToolsRegistered } from '@/lib/mcp/registry';
import { authenticateRequest } from '@/lib/auth/session';

/**
 * POST /api/mcp/messages - Processa uma mensagem MCP individual
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticação
    const user = await authenticateRequest();
    const userId = user?.id || null;

    // Parsear corpo
    const body = await request.json();

    // Suporte a batch de mensagens
    const messages = Array.isArray(body) ? body : [body];
    const results: unknown[] = [];

    // Garantir que as ferramentas estão registradas
    if (!areToolsRegistered()) {
      await registerAllTools();
    }

    const manager = getMcpServerManager();

    for (const message of messages) {
      const { method, params, id } = message;

      try {
        let result: unknown;

        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: manager.getServerInfo(),
            };
            break;

          case 'tools/list':
            result = {
              tools: manager.listTools().map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: { type: 'object', properties: {} },
              })),
            };
            break;

          case 'tools/call': {
            const { name, arguments: args } = params || {};
            const tool = manager.getTool(name);

            if (!tool) {
              results.push({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32601,
                  message: `Ferramenta não encontrada: ${name}`,
                },
              });
              continue;
            }

            if (tool.requiresAuth && !userId) {
              results.push({
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32600,
                  message: 'Autenticação necessária',
                },
              });
              continue;
            }

            result = await manager.executeTool(name, args);
            break;
          }

          case 'ping':
            result = { pong: true, timestamp: Date.now() };
            break;

          default:
            results.push({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Método não suportado: ${method}`,
              },
            });
            continue;
        }

        results.push({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (error) {
        results.push({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Erro interno',
          },
        });
      }
    }

    // Retorna array se batch, objeto único caso contrário
    return NextResponse.json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    console.error('[MCP Messages] Erro:', error);

    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Erro ao processar mensagem',
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/mcp/messages - Retorna informações do servidor
 */
export async function GET(): Promise<NextResponse> {
  const manager = getMcpServerManager();

  return NextResponse.json({
    server: manager.getServerInfo(),
    tools: manager.listTools().length,
    status: 'online',
  });
}
