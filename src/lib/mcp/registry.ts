/**
 * Registry de ferramentas MCP do Sinesys
 *
 * Registra todas as Server Actions como ferramentas MCP
 */

import { z } from 'zod';
import { registerMcpTool, getMcpServerManager } from './server';
import { actionResultToMcp } from './utils';
import { jsonResult, errorResult, textResult } from './types';

// Import das actions das features
// Processos
import {
  actionListarProcessos,
  actionBuscarProcesso,
  actionBuscarTimeline,
} from '@/features/processos/actions';

// Partes
import {
  actionListarClientes,
  actionBuscarCliente,
} from '@/features/partes';

// Busca semântica
import { buscaSemantica } from '@/lib/ai/retrieval';

/**
 * Flag para controlar se as ferramentas já foram registradas
 */
let toolsRegistered = false;

/**
 * Registra todas as ferramentas MCP das features do Sinesys
 */
export async function registerAllTools(): Promise<void> {
  if (toolsRegistered) {
    console.log('[MCP Registry] Ferramentas já registradas, pulando...');
    return;
  }

  console.log('[MCP Registry] Iniciando registro de ferramentas...');

  // =========================================================================
  // PROCESSOS
  // =========================================================================

  // Listar processos
  registerMcpTool({
    name: 'listar_processos',
    description: 'Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, etc.)',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de processos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      status: z.string().optional().describe('Filtrar por status (ex: "ativo", "arquivado")'),
      trt: z.string().optional().describe('Filtrar por TRT (ex: "TRT1", "TRT15")'),
      grau: z.enum(['primeiro', 'segundo', 'superior']).optional().describe('Filtrar por grau'),
      advogadoId: z.number().optional().describe('Filtrar por ID do advogado responsável'),
      busca: z.string().optional().describe('Busca textual por número do processo ou partes'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarProcessos(args as Parameters<typeof actionListarProcessos>[0]);
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar processos');
      }
    },
  });

  // Buscar processo por ID
  registerMcpTool({
    name: 'buscar_processo',
    description: 'Busca um processo específico por ID, retornando todos os detalhes',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do processo'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarProcesso(id);
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processo');
      }
    },
  });

  // Buscar timeline do processo
  registerMcpTool({
    name: 'buscar_timeline_processo',
    description: 'Busca a timeline/movimentações de um processo',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      processoId: z.number().int().positive().describe('ID do processo'),
    }),
    handler: async (args) => {
      try {
        const { processoId } = args as { processoId: number };
        const result = await actionBuscarTimeline(processoId);
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar timeline');
      }
    },
  });

  // =========================================================================
  // PARTES (CLIENTES)
  // =========================================================================

  // Listar clientes
  registerMcpTool({
    name: 'listar_clientes',
    description: 'Lista clientes/partes do sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de clientes'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou CPF/CNPJ'),
      tipo: z.enum(['fisica', 'juridica']).optional().describe('Tipo de pessoa'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarClientes(args as Parameters<typeof actionListarClientes>[0]);
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar clientes');
      }
    },
  });

  // Buscar cliente por ID
  registerMcpTool({
    name: 'buscar_cliente',
    description: 'Busca um cliente específico por ID',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do cliente'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarCliente(id);
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente');
      }
    },
  });

  // =========================================================================
  // BUSCA SEMÂNTICA (AI/RAG)
  // =========================================================================

  registerMcpTool({
    name: 'busca_semantica',
    description: 'Busca semântica no conhecimento do sistema (processos, documentos, audiências). Usa IA para encontrar informações relevantes mesmo com termos diferentes.',
    feature: 'ai',
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe('Texto da busca (pergunta ou termos)'),
      tipo: z.enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro']).optional().describe('Filtrar por tipo de documento'),
      limite: z.number().min(1).max(50).default(10).describe('Número máximo de resultados'),
    }),
    handler: async (args) => {
      try {
        const { query, tipo, limite } = args as { query: string; tipo?: string; limite?: number };

        const filtros = tipo ? { tipo } : {};
        const resultados = await buscaSemantica(query, {
          limite: limite || 10,
          filtros: filtros as { tipo?: 'processo' | 'documento' | 'audiencia' | 'expediente' | 'cliente' | 'lancamento' | 'outro' },
        });

        if (resultados.length === 0) {
          return textResult('Nenhum resultado encontrado para a busca.');
        }

        const formatted = resultados.map((r, i) =>
          `${i + 1}. [${r.metadata.tipo.toUpperCase()}] (${(r.similaridade * 100).toFixed(1)}% similar)\n   ${r.texto.substring(0, 200)}${r.texto.length > 200 ? '...' : ''}`
        ).join('\n\n');

        return textResult(`Encontrados ${resultados.length} resultados:\n\n${formatted}`);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro na busca semântica');
      }
    },
  });

  // =========================================================================
  // FERRAMENTAS UTILITÁRIAS
  // =========================================================================

  // Status do sistema
  registerMcpTool({
    name: 'status_sistema',
    description: 'Retorna o status atual do sistema Sinesys',
    feature: 'sistema',
    requiresAuth: false,
    schema: z.object({}),
    handler: async () => {
      const manager = getMcpServerManager();
      const tools = manager.listTools();

      return jsonResult({
        sistema: 'Sinesys',
        versao: '2.0.0',
        status: 'online',
        ferramentas_disponiveis: tools.length,
        features: [...new Set(tools.map(t => t.feature))],
      });
    },
  });

  // Listar ferramentas disponíveis
  registerMcpTool({
    name: 'listar_ferramentas',
    description: 'Lista todas as ferramentas MCP disponíveis no Sinesys',
    feature: 'sistema',
    requiresAuth: false,
    schema: z.object({
      feature: z.string().optional().describe('Filtrar por feature específica'),
    }),
    handler: async (args) => {
      const manager = getMcpServerManager();
      let tools = manager.listTools();

      const { feature } = args as { feature?: string };
      if (feature) {
        tools = tools.filter(t => t.feature === feature);
      }

      const grouped: Record<string, { name: string; description: string }[]> = {};
      for (const tool of tools) {
        if (!grouped[tool.feature]) {
          grouped[tool.feature] = [];
        }
        grouped[tool.feature].push({
          name: tool.name,
          description: tool.description,
        });
      }

      return jsonResult({
        total: tools.length,
        ferramentas_por_feature: grouped,
      });
    },
  });

  toolsRegistered = true;
  console.log(`[MCP Registry] ${getMcpServerManager().listTools().length} ferramentas registradas`);
}

/**
 * Reseta o registro (útil para testes)
 */
export function resetToolsRegistry(): void {
  toolsRegistered = false;
}

/**
 * Verifica se as ferramentas estão registradas
 */
export function areToolsRegistered(): boolean {
  return toolsRegistered;
}
