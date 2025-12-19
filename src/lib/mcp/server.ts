/**
 * Servidor MCP do Sinesys
 *
 * Configuração singleton do McpServer para exposição de ferramentas
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type { MCPToolConfig, MCPServerConfig, MCPToolResult } from './types';

/**
 * Configuração do servidor MCP Sinesys
 */
const SERVER_CONFIG: MCPServerConfig = {
  info: {
    name: 'sinesys-api',
    version: '2.0.0',
    description: 'API MCP do Sinesys - Sistema de Gestão Jurídica',
  },
  capabilities: {
    tools: true,
    resources: false,
    prompts: false,
  },
};

/**
 * Classe para gerenciar o servidor MCP
 */
class MCPServerManager {
  private server: Server | null = null;
  private tools: Map<string, MCPToolConfig> = new Map();
  private isInitialized: boolean = false;

  /**
   * Obtém ou cria a instância do servidor
   */
  getServer(): Server {
    if (!this.server) {
      this.server = new Server(
        {
          name: SERVER_CONFIG.info.name,
          version: SERVER_CONFIG.info.version,
        },
        {
          capabilities: {
            tools: SERVER_CONFIG.capabilities.tools ? {} : undefined,
            resources: SERVER_CONFIG.capabilities.resources ? {} : undefined,
            prompts: SERVER_CONFIG.capabilities.prompts ? {} : undefined,
          },
        }
      );

      this.setupHandlers();
    }

    return this.server;
  }

  /**
   * Configura os handlers do servidor
   */
  private setupHandlers(): void {
    if (!this.server) return;

    // Handler para listar ferramentas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList: Tool[] = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: this.zodToJsonSchema(tool.schema),
      }));

      return { tools: toolsList };
    });

    // Handler para chamar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);
      if (!tool) {
        return {
          content: [{ type: 'text', text: `Ferramenta não encontrada: ${name}` }],
          isError: true,
        };
      }

      try {
        // Validar argumentos com Zod
        const validatedArgs = tool.schema.parse(args);

        // Executar handler
        const result = await tool.handler(validatedArgs);

        return result;
      } catch (error) {
        console.error(`[MCP] Erro ao executar ferramenta ${name}:`, error);

        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Converte schema Zod para JSON Schema (simplificado)
   */
  private zodToJsonSchema(schema: MCPToolConfig['schema']): Record<string, unknown> {
    // Usa o método _def do Zod para extrair informações
    const def = (schema as { _def?: { typeName?: string; shape?: () => Record<string, unknown> } })._def;

    if (def?.typeName === 'ZodObject' && def.shape) {
      const shape = def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldDef = (value as { _def?: { typeName?: string; description?: string; defaultValue?: () => unknown } })._def;
        const isOptional = fieldDef?.typeName === 'ZodOptional' || fieldDef?.defaultValue !== undefined;

        properties[key] = {
          type: this.zodTypeToJsonType(fieldDef?.typeName),
          description: fieldDef?.description || key,
        };

        if (!isOptional) {
          required.push(key);
        }
      }

      return {
        type: 'object' as const,
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    // Fallback genérico
    return { type: 'object', properties: {} };
  }

  /**
   * Mapeia tipo Zod para tipo JSON Schema
   */
  private zodTypeToJsonType(zodType?: string): string {
    const typeMap: Record<string, string> = {
      ZodString: 'string',
      ZodNumber: 'number',
      ZodBoolean: 'boolean',
      ZodArray: 'array',
      ZodObject: 'object',
      ZodOptional: 'string', // Simplificação
      ZodDefault: 'string', // Simplificação
    };

    return typeMap[zodType || ''] || 'string';
  }

  /**
   * Registra uma ferramenta no servidor
   */
  registerTool(config: MCPToolConfig): void {
    this.tools.set(config.name, config);
    console.log(`[MCP] Ferramenta registrada: ${config.name}`);
  }

  /**
   * Remove uma ferramenta do servidor
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
    console.log(`[MCP] Ferramenta removida: ${name}`);
  }

  /**
   * Lista todas as ferramentas registradas
   */
  listTools(): MCPToolConfig[] {
    return Array.from(this.tools.values());
  }

  /**
   * Obtém uma ferramenta pelo nome
   */
  getTool(name: string): MCPToolConfig | undefined {
    return this.tools.get(name);
  }

  /**
   * Verifica se o servidor está inicializado
   */
  isServerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Marca o servidor como inicializado
   */
  setInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Obtém informações do servidor
   */
  getServerInfo(): MCPServerConfig['info'] {
    return SERVER_CONFIG.info;
  }

  /**
   * Executa uma ferramenta diretamente (para uso interno)
   */
  async executeTool(name: string, args: unknown): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Ferramenta não encontrada: ${name}` }],
        isError: true,
      };
    }

    try {
      const validatedArgs = tool.schema.parse(args);
      return await tool.handler(validatedArgs);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          },
        ],
        isError: true,
      };
    }
  }
}

// Instância singleton
const mcpServerManager = new MCPServerManager();

/**
 * Obtém a instância do servidor MCP
 */
export function getMcpServer(): Server {
  return mcpServerManager.getServer();
}

/**
 * Obtém o gerenciador do servidor MCP
 */
export function getMcpServerManager(): MCPServerManager {
  return mcpServerManager;
}

/**
 * Registra uma ferramenta no servidor MCP
 */
export function registerMcpTool(config: MCPToolConfig): void {
  mcpServerManager.registerTool(config);
}

/**
 * Executa uma ferramenta MCP
 */
export async function executeMcpTool(name: string, args: unknown): Promise<MCPToolResult> {
  return mcpServerManager.executeTool(name, args);
}

/**
 * Lista todas as ferramentas MCP registradas
 */
export function listMcpTools(): MCPToolConfig[] {
  return mcpServerManager.listTools();
}

/**
 * Inicia o servidor MCP via stdio (para CLI)
 */
export async function startMcpServerStdio(): Promise<void> {
  const server = getMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.log(`[MCP] Servidor ${SERVER_CONFIG.info.name} v${SERVER_CONFIG.info.version} iniciado via stdio`);
}

export { mcpServerManager };
