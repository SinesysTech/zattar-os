#!/usr/bin/env node

// Nota: Os imports do SDK MCP usam paths com extensão .js porque:
// 1. A configuração moduleResolution: "Node16" requer extensões explícitas para ESM
// 2. O SDK não define subpath exports no package.json que permitam omitir a extensão
// 3. Testado em 2025-11-27: imports sem .js falham com TS2307
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SinesysApiClient, loadConfig } from './client/index.js';
import { allTools } from './tools/index.js';
import { ToolDefinition } from './types/index.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Inicialização do cliente API
let apiClient: SinesysApiClient;
try {
  const config = loadConfig();
  apiClient = new SinesysApiClient(config);
} catch (error) {
  console.error('Erro ao inicializar cliente API:', error);
  process.exit(1);
}

// Criação do servidor MCP
// Este servidor expõe todas as tools do array allTools
const server = new Server(
  {
    name: 'sinesys-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler para ListToolsRequestSchema
// Este handler responde a requisições tools/list do cliente MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((tool: ToolDefinition) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  };
});

// Handler para CallToolRequestSchema
// Este handler responde a requisições tools/call do cliente MCP
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, arguments: args } = request.params;

  const tool = allTools.find((t: ToolDefinition) => t.name === toolName);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Tool não encontrada: ${toolName}` }],
      isError: true,
    };
  }

  try {
    const validatedArgs = tool.inputSchema.parse(args);
    const result = await tool.handler(validatedArgs, apiClient);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: `Erro de validação: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        ],
        isError: true,
      };
    } else {
      // Log detalhado para erros inesperados (não-Zod) no stderr para facilitar diagnóstico
      const err = error as Error;
      console.error('[MCP Server] Erro inesperado na execução da tool:', {
        toolName,
        args: JSON.stringify(args, null, 2),
        errorMessage: err.message,
        errorName: err.name,
        stack: err.stack || 'Stack trace não disponível',
      });

      return {
        content: [{ type: 'text', text: err.message }],
        isError: true,
      };
    }
  }
});

// Função main e inicialização
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr é usado para logs (não interfere com JSON-RPC no stdout)
  console.error('Sinesys MCP Server running on stdio');
}

// Erros fatais na inicialização terminam o processo com código 1
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Tratamento de erros global
// Estes handlers previnem crashes silenciosos
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});