/**
 * Registry de ferramentas MCP do Sinesys
 *
 * Registra todas as Server Actions como ferramentas MCP
 */

import { z } from 'zod';
import { registerMcpTool, getMcpServerManager } from './server';
import { actionResultToMcp } from './utils';
import { jsonResult, errorResult, textResult } from './types';
import type { ActionResult } from '@/lib/safe-action';

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

// Contratos
import {
  actionCriarContrato,
  actionListarContratos,
  actionBuscarContrato,
  actionAtualizarContrato,
  tipoContratoSchema,
  tipoCobrancaSchema,
  statusContratoSchema,
  poloProcessualSchema,
} from '@/features/contratos';

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
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
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
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
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
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
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
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
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
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente');
      }
    },
  });

  // =========================================================================
  // CONTRATOS
  // =========================================================================

  // Criar contrato
  registerMcpTool({
    name: 'criar_contrato',
    description: 'Cria um novo contrato jurídico no sistema',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      tipoContrato: tipoContratoSchema.describe('Tipo do contrato (ajuizamento, defesa, assessoria, etc.)'),
      tipoCobranca: tipoCobrancaSchema.describe('Tipo de cobrança (pro_exito, pro_labore)'),
      clienteId: z.number().int().positive().describe('ID do cliente contratante'),
      poloCliente: poloProcessualSchema.describe('Polo processual do cliente (autor ou re)'),
      segmentoId: z.number().int().positive().optional().describe('ID do segmento jurídico'),
      parteContrariaId: z.number().int().positive().optional().describe('ID da parte contrária'),
      status: statusContratoSchema.optional().describe('Status inicial do contrato'),
      observacoes: z.string().max(5000).optional().describe('Observações sobre o contrato'),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        const typedArgs = args as Record<string, unknown>;
        for (const [key, value] of Object.entries(typedArgs)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
        const result = await actionCriarContrato(null, formData);
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar contrato');
      }
    },
  });

  // Listar contratos
  registerMcpTool({
    name: 'listar_contratos',
    description: 'Lista contratos do sistema com filtros opcionais',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe('Número da página'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de contratos'),
      status: statusContratoSchema.optional().describe('Filtrar por status'),
      tipoContrato: tipoContratoSchema.optional().describe('Filtrar por tipo de contrato'),
      tipoCobranca: tipoCobrancaSchema.optional().describe('Filtrar por tipo de cobrança'),
      clienteId: z.number().optional().describe('Filtrar por ID do cliente'),
      responsavelId: z.number().optional().describe('Filtrar por ID do responsável'),
      busca: z.string().optional().describe('Busca textual em observações'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarContratos(args as Parameters<typeof actionListarContratos>[0]);
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contratos');
      }
    },
  });

  // Buscar contrato por ID
  registerMcpTool({
    name: 'buscar_contrato',
    description: 'Busca um contrato específico por ID, retornando todos os detalhes',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do contrato'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarContrato(id);
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar contrato');
      }
    },
  });

  // Atualizar contrato
  registerMcpTool({
    name: 'atualizar_contrato',
    description: 'Atualiza um contrato existente',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID do contrato a atualizar'),
      tipoContrato: tipoContratoSchema.optional().describe('Novo tipo de contrato'),
      tipoCobranca: tipoCobrancaSchema.optional().describe('Novo tipo de cobrança'),
      status: statusContratoSchema.optional().describe('Novo status'),
      observacoes: z.string().max(5000).optional().describe('Novas observações'),
    }),
    handler: async (args) => {
      try {
        const { id, ...rest } = args as { id: number } & Record<string, unknown>;
        const formData = new FormData();
        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
        const result = await actionAtualizarContrato(id, null, formData);
        // Guard para garantir tipagem correta de ActionResult
        if ('success' in result && typeof result.success === 'boolean') {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult('Resultado inválido da ação');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar contrato');
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
