/**
 * Registry MCP do Sinesys
 *
 * Registra todas as ferramentas MCP disponíveis para agentes de IA.
 * Organizado por features seguindo arquitetura FSD.
 *
 * Total de tools: ~96
 * Módulos: 19 (Processos, Partes, Contratos, Financeiro, etc.)
 */

import { z } from 'zod';
import { registerMcpTool } from './server';
import { actionResultToMcp } from './utils';
import { jsonResult, errorResult } from './types';
import type { ActionResult } from '@/lib/safe-action';

// Flag para controlar registro único
let toolsRegistered = false;

/**
 * Registra todas as ferramentas MCP
 */
export async function registerAllTools(): Promise<void> {
  if (toolsRegistered) {
    console.log('[MCP Registry] Ferramentas já registradas');
    return;
  }

  console.log('[MCP Registry] Iniciando registro...');

  // Registrar tools por módulo
  await registerProcessosTools();
  await registerPartesTools();
  await registerContratosTools();
  await registerFinanceiroTools();
  await registerChatTools();
  await registerDocumentosTools();
  await registerExpedientesTools();
  await registerAudienciasTools();
  await registerObrigacoesTools();
  await registerRHTools();
  await registerDashboardTools();
  await registerBuscaSemanticaTools();
  await registerCapturaTools();
  await registerUsuariosTools();
  await registerAcervoTools();
  await registerAssistentesTools();
  await registerCargosTools();
  await registerAssinaturaDigitalTools();

  toolsRegistered = true;
  console.log('[MCP Registry] Registro concluído');
}

/**
 * Reseta o registry (para testes)
 */
export function resetToolsRegistry(): void {
  toolsRegistered = false;
}

/**
 * Verifica se tools foram registradas
 */
export function areToolsRegistered(): boolean {
  return toolsRegistered;
}

/**
 * =========================================================================
 * MÓDULO: PROCESSOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_processos: Lista com filtros (TRT, status, grau, advogado)
 * - buscar_processos_por_cpf: Busca por CPF do cliente
 * - buscar_processos_por_cnpj: Busca por CNPJ do cliente
 * - buscar_processo_por_numero: Busca por número processual (CNJ)
 *
 * Imports necessários:
 * - actionListarProcessos
 * - actionBuscarProcessosPorCPF
 * - actionBuscarProcessosPorCNPJ
 * - actionBuscarProcessoPorNumero
 * - actionBuscarTimeline
 */
async function registerProcessosTools(): Promise<void> {
  const {
    actionListarProcessos,
    actionBuscarTimeline,
    actionBuscarProcessosPorCPF,
    actionBuscarProcessosPorCNPJ,
    actionBuscarProcessoPorNumero,
  } = await import('@/features/processos/actions');

  // Tool: listar_processos
  registerMcpTool({
    name: 'listar_processos',
    description: 'Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, período, busca textual)',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de processos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      status: z.string().optional().describe('Filtrar por status (ex: "ativo", "arquivado")'),
      trt: z.string().optional().describe('Filtrar por TRT (ex: "TRT1", "TRT15")'),
      grau: z.enum(['primeiro', 'segundo', 'superior']).optional().describe('Filtrar por grau'),
      advogadoId: z.number().optional().describe('Filtrar por ID do advogado responsável'),
      dataInicio: z.string().optional().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim do período (YYYY-MM-DD)'),
      busca: z.string().optional().describe('Busca textual por número do processo ou partes'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarProcessos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar processos');
      }
    },
  });

  // Tool: buscar_processos_por_cpf
  registerMcpTool({
    name: 'buscar_processos_por_cpf',
    description: 'Busca todos os processos vinculados a um cliente por CPF',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(50).optional().describe('Número máximo de processos'),
    }),
    handler: async (args) => {
      try {
        const { cpf, limite } = args as { cpf: string; limite?: number };

        // Usar action específica
        const result = await actionBuscarProcessosPorCPF(cpf, limite);

        if (!result.success) {
          return actionResultToMcp(result as ActionResult<unknown>);
        }

        // Enriquecer com timeline
        const processos = (result.data as Array<{ id?: number }>) ?? [];
        const enriquecidos = await Promise.all(
          processos.map(async (p) => {
            if (!p?.id) return { processo: p, timeline: [] };
            const timelineResult = await actionBuscarTimeline(p.id);
            const timeline = timelineResult?.success ? timelineResult.data : [];
            return { processo: p, timeline };
          })
        );

        return jsonResult({
          message: `${enriquecidos.length} processo(s) encontrado(s)`,
          cpf,
          total: enriquecidos.length,
          processos: enriquecidos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processos por CPF');
      }
    },
  });

  // Tool: buscar_processos_por_cnpj
  registerMcpTool({
    name: 'buscar_processos_por_cnpj',
    description: 'Busca todos os processos vinculados a um cliente por CNPJ',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(50).optional().describe('Número máximo de processos'),
    }),
    handler: async (args) => {
      try {
        const { cnpj, limite } = args as { cnpj: string; limite?: number };

        // Usar action específica
        const result = await actionBuscarProcessosPorCNPJ(cnpj, limite);

        if (!result.success) {
          return actionResultToMcp(result as ActionResult<unknown>);
        }

        // Enriquecer com timeline
        const processos = (result.data as Array<{ id?: number }>) ?? [];
        const enriquecidos = await Promise.all(
          processos.map(async (p) => {
            if (!p?.id) return { processo: p, timeline: [] };
            const timelineResult = await actionBuscarTimeline(p.id);
            const timeline = timelineResult?.success ? timelineResult.data : [];
            return { processo: p, timeline };
          })
        );

        return jsonResult({
          message: `${enriquecidos.length} processo(s) encontrado(s)`,
          cnpj,
          total: enriquecidos.length,
          processos: enriquecidos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processos por CNPJ');
      }
    },
  });

  // Tool: buscar_processo_por_numero
  registerMcpTool({
    name: 'buscar_processo_por_numero',
    description: 'Busca processo pelo número processual (formato CNJ ou simplificado)',
    feature: 'processos',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(7).describe('Número do processo (com ou sem formatação CNJ)'),
    }),
    handler: async (args) => {
      try {
        const { numeroProcesso } = args as { numeroProcesso: string };

        // Usar action dedicada para busca por número
        const result = await actionBuscarProcessoPorNumero(numeroProcesso);

        if (!result.success) {
          return actionResultToMcp(result as ActionResult<unknown>);
        }

        const processo = result.data as { id?: number };

        if (!processo) {
          return errorResult('Processo não encontrado');
        }

        // Enriquecer com timeline
        const timeline = processo?.id ? await actionBuscarTimeline(processo.id) : null;

        return jsonResult({
          message: 'Processo encontrado',
          numeroProcesso,
          processo,
          timeline: timeline?.success ? timeline.data : [],
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar processo por número');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: PARTES
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_clientes: Lista clientes com filtros
 * - buscar_cliente_por_cpf: Busca cliente por CPF
 * - buscar_cliente_por_cnpj: Busca cliente por CNPJ
 * - listar_partes_contrarias: Lista partes contrárias
 * - listar_terceiros: Lista terceiros
 * - listar_representantes: Lista representantes (advogados)
 */
async function registerPartesTools(): Promise<void> {
  const {
    actionListarClientes,
    actionBuscarClientePorCPF,
    actionBuscarClientePorCNPJ,
    actionListarPartesContrarias,
    actionListarTerceiros,
    actionListarRepresentantes,
  } = await import('@/features/partes');

  // Tool: listar_clientes
  registerMcpTool({
    name: 'listar_clientes',
    description: 'Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de clientes'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou CPF/CNPJ'),
      tipo_pessoa: z.enum(['pf', 'pj']).optional().describe('Tipo de pessoa (pf=física, pj=jurídica)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarClientes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar clientes');
      }
    },
  });

  // Tool: buscar_cliente_por_cpf
  registerMcpTool({
    name: 'buscar_cliente_por_cpf',
    description: 'Busca cliente por CPF com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cpf } = args as { cpf: string };

        // Usar action específica que retorna cliente com endereço e processos
        const result = await actionBuscarClientePorCPF(cpf);

        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CPF');
      }
    },
  });

  // Tool: buscar_cliente_por_cnpj
  registerMcpTool({
    name: 'buscar_cliente_por_cnpj',
    description: 'Busca cliente por CNPJ com endereço e processos relacionados',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
    }),
    handler: async (args) => {
      try {
        const { cnpj } = args as { cnpj: string };

        // Usar action específica que retorna cliente com endereço e processos
        const result = await actionBuscarClientePorCNPJ(cnpj);

        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar cliente por CNPJ');
      }
    },
  });

  // Tool: listar_partes_contrarias
  registerMcpTool({
    name: 'listar_partes_contrarias',
    description: 'Lista partes contrárias cadastradas no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        // Convert offset to pagina (1-indexed page number)
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarPartesContrarias({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar partes contrárias');
      }
    },
  });

  // Tool: listar_terceiros
  registerMcpTool({
    name: 'listar_terceiros',
    description: 'Lista terceiros cadastrados no sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou documento'),
    }),
    handler: async (args) => {
      try {
        const { limite, offset, busca } = args as { limite: number; offset: number; busca?: string };
        // Convert offset to pagina (1-indexed page number)
        const pagina = Math.floor(offset / limite) + 1;

        const result = await actionListarTerceiros({ limite, pagina, busca });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar terceiros');
      }
    },
  });

  // Tool: listar_representantes
  registerMcpTool({
    name: 'listar_representantes',
    description: 'Lista representantes (advogados, procuradores) do sistema',
    feature: 'partes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome ou OAB'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarRepresentantes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar representantes');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: CONTRATOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_contratos: Lista contratos com filtros
 * - criar_contrato: Cria novo contrato
 * - atualizar_contrato: Atualiza contrato existente
 * - buscar_contrato_por_cliente: Busca contratos de um cliente
 */
async function registerContratosTools(): Promise<void> {
  const {
    actionCriarContrato,
    actionListarContratos,
    actionAtualizarContrato,
    tipoContratoSchema,
    tipoCobrancaSchema,
    statusContratoSchema,
    papelContratualSchema,
  } = await import('@/features/contratos');

  // Tool: listar_contratos
  registerMcpTool({
    name: 'listar_contratos',
    description: 'Lista contratos do sistema com filtros por tipo, status, cliente',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de contratos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      tipo: tipoContratoSchema.optional().describe('Filtrar por tipo de contrato'),
      status: statusContratoSchema.optional().describe('Filtrar por status'),
      clienteId: z.number().optional().describe('Filtrar por ID do cliente'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarContratos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contratos');
      }
    },
  });

  // Tool: criar_contrato
  registerMcpTool({
    name: 'criar_contrato',
    description: 'Cria novo contrato no sistema',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      titulo: z.string().min(3).describe('Título do contrato'),
      tipo: tipoContratoSchema.describe('Tipo de contrato'),
      tipoCobranca: tipoCobrancaSchema.describe('Tipo de cobrança'),
      valor: z.number().positive().describe('Valor do contrato'),
      dataInicio: z.string().describe('Data de início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data de término (YYYY-MM-DD)'),
      descricao: z.string().optional().describe('Descrição detalhada'),
      partes: z.array(z.object({
        parteId: z.number().describe('ID da parte'),
        papel: papelContratualSchema.describe('Papel da parte'),
      })).min(1).describe('Partes envolvidas no contrato'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarContrato(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar contrato');
      }
    },
  });

  // Tool: atualizar_contrato
  registerMcpTool({
    name: 'atualizar_contrato',
    description: 'Atualiza contrato existente',
    feature: 'contratos',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do contrato'),
      titulo: z.string().min(3).optional().describe('Título do contrato'),
      status: statusContratoSchema.optional().describe('Status do contrato'),
      valor: z.number().positive().optional().describe('Valor do contrato'),
      dataFim: z.string().optional().describe('Data de término (YYYY-MM-DD)'),
      descricao: z.string().optional().describe('Descrição detalhada'),
    }),
    handler: async (args) => {
      try {
        const result = await actionAtualizarContrato(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar contrato');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: FINANCEIRO
 * =========================================================================
 *
 * Tools disponíveis:
 * PLANO DE CONTAS:
 * - listar_plano_contas: Lista plano de contas
 * - criar_conta: Cria nova conta contábil
 * - atualizar_conta: Atualiza conta existente
 * - excluir_conta: Remove conta
 *
 * LANÇAMENTOS:
 * - listar_lancamentos: Lista lançamentos com filtros
 * - criar_lancamento: Cria novo lançamento
 * - atualizar_lancamento: Atualiza lançamento
 * - excluir_lancamento: Remove lançamento
 * - confirmar_lancamento: Confirma lançamento pendente
 * - cancelar_lancamento: Cancela lançamento
 * - estornar_lancamento: Estorna lançamento
 *
 * DRE:
 * - gerar_dre: Gera Demonstração de Resultado
 * - obter_evolucao_dre: Evolução temporal da DRE
 * - exportar_dre_csv: Exporta DRE em CSV
 *
 * FLUXO DE CAIXA:
 * - obter_fluxo_caixa_unificado: Fluxo de caixa consolidado
 * - obter_fluxo_caixa_diario: Fluxo de caixa diário
 * - obter_fluxo_caixa_por_periodo: Fluxo por período
 * - obter_indicadores_saude: Indicadores de saúde financeira
 * - obter_alertas_caixa: Alertas de fluxo de caixa
 *
 * CONCILIAÇÃO:
 * - listar_transacoes: Lista transações bancárias
 * - conciliar_manual: Concilia transação manualmente
 * - obter_sugestoes: Obtém sugestões de conciliação
 * - desconciliar: Desfaz conciliação
 */
async function registerFinanceiroTools(): Promise<void> {
  // Plano de Contas
  const {
    actionListarPlanoContas,
    actionCriarConta,
    actionAtualizarConta,
    actionExcluirConta,
  } = await import('@/features/financeiro/actions/plano-contas');

  // Lançamentos
  const {
    actionListarLancamentos,
    actionCriarLancamento,
    actionAtualizarLancamento,
    actionExcluirLancamento,
    actionConfirmarLancamento,
    actionCancelarLancamento,
    actionEstornarLancamento,
  } = await import('@/features/financeiro/actions/lancamentos');

  // DRE
  const {
    actionGerarDRE,
    actionObterEvolucaoDRE,
    actionExportarDRECSV,
    actionExportarDREPDF,
  } = await import('@/features/financeiro/actions/dre');

  // Fluxo de Caixa
  const {
    actionObterFluxoCaixaUnificado,
    actionObterFluxoCaixaDiario,
    actionObterFluxoCaixaPorPeriodo,
    actionObterIndicadoresSaude,
    actionObterAlertasCaixa,
    actionObterResumoDashboard,
    actionObterSaldoInicial,
    actionListarContasBancarias,
    actionListarCentrosCusto,
  } = await import('@/features/financeiro/actions/fluxo-caixa');

  // Conciliação
  const {
    actionListarTransacoes,
    actionConciliarManual,
    actionObterSugestoes,
    actionDesconciliar,
    actionBuscarLancamentosManuais,
  } = await import('@/features/financeiro/actions/conciliacao');

  // ===== PLANO DE CONTAS =====

  registerMcpTool({
    name: 'listar_plano_contas',
    description: 'Lista plano de contas do sistema com hierarquia',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(['receita', 'despesa']).optional().describe('Filtrar por tipo de conta'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPlanoContas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar plano de contas');
      }
    },
  });

  registerMcpTool({
    name: 'criar_conta',
    description: 'Cria nova conta no plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      codigo: z.string().describe('Código da conta'),
      nome: z.string().describe('Nome da conta'),
      tipo: z.enum(['receita', 'despesa']).describe('Tipo da conta'),
      nivel: z.number().describe('Nível hierárquico'),
      contaPaiId: z.number().optional().describe('ID da conta pai (para subconta)'),
      descricao: z.string().optional().describe('Descrição da conta'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarConta(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar conta');
      }
    },
  });

  registerMcpTool({
    name: 'atualizar_conta',
    description: 'Atualiza conta existente no plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da conta'),
      nome: z.string().optional().describe('Nome da conta'),
      descricao: z.string().optional().describe('Descrição da conta'),
      ativa: z.boolean().optional().describe('Status ativo/inativo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionAtualizarConta(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar conta');
      }
    },
  });

  registerMcpTool({
    name: 'excluir_conta',
    description: 'Remove conta do plano de contas',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da conta'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExcluirConta(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir conta');
      }
    },
  });

  // ===== LANÇAMENTOS =====

  registerMcpTool({
    name: 'listar_lancamentos',
    description: 'Lista lançamentos financeiros com filtros por período, tipo, status, busca textual',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de lançamentos'),
      pagina: z.number().min(1).default(1).describe('Número da página'),
      dataVencimentoInicio: z.string().optional().describe('Data início vencimento (YYYY-MM-DD)'),
      dataVencimentoFim: z.string().optional().describe('Data fim vencimento (YYYY-MM-DD)'),
      dataCompetenciaInicio: z.string().optional().describe('Data início competência (YYYY-MM-DD)'),
      dataCompetenciaFim: z.string().optional().describe('Data fim competência (YYYY-MM-DD)'),
      tipo: z.enum(['receita', 'despesa']).optional().describe('Tipo de lançamento'),
      status: z.enum(['pendente', 'confirmado', 'cancelado', 'estornado']).optional().describe('Status'),
      busca: z.string().optional().describe('Busca textual por descrição'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      contaContabilId: z.number().optional().describe('ID da conta contábil'),
      centroCustoId: z.number().optional().describe('ID do centro de custo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarLancamentos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar lançamentos');
      }
    },
  });

  registerMcpTool({
    name: 'criar_lancamento',
    description: 'Cria novo lançamento financeiro',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(['receita', 'despesa']).describe('Tipo de lançamento'),
      valor: z.number().positive().describe('Valor do lançamento'),
      data: z.string().describe('Data do lançamento (YYYY-MM-DD)'),
      descricao: z.string().describe('Descrição do lançamento'),
      contaId: z.number().describe('ID da conta contábil'),
      categoriaId: z.number().optional().describe('ID da categoria'),
      processoId: z.number().optional().describe('ID do processo relacionado'),
      clienteId: z.number().optional().describe('ID do cliente relacionado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarLancamento(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'atualizar_lancamento',
    description: 'Atualiza lançamento financeiro existente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
      valor: z.number().positive().optional().describe('Valor do lançamento'),
      dataLancamento: z.string().optional().describe('Data do lançamento (YYYY-MM-DD)'),
      dataCompetencia: z.string().optional().describe('Data de competência (YYYY-MM-DD)'),
      dataVencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
      descricao: z.string().optional().describe('Descrição do lançamento'),
      contaContabilId: z.number().optional().describe('ID da conta contábil'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      centroCustoId: z.number().optional().describe('ID do centro de custo'),
    }),
    handler: async (args) => {
      try {
        const { id, ...dados } = args;
        const result = await actionAtualizarLancamento(id, dados);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'excluir_lancamento',
    description: 'Remove lançamento financeiro',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExcluirLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao excluir lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'confirmar_lancamento',
    description: 'Confirma lançamento pendente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionConfirmarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao confirmar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'cancelar_lancamento',
    description: 'Cancela lançamento',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCancelarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao cancelar lançamento');
      }
    },
  });

  registerMcpTool({
    name: 'estornar_lancamento',
    description: 'Estorna lançamento confirmado',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do lançamento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionEstornarLancamento(args.id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao estornar lançamento');
      }
    },
  });

  // ===== DRE =====

  registerMcpTool({
    name: 'gerar_dre',
    description: 'Gera Demonstração de Resultado do Exercício para um período',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      tipo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().describe('Tipo de período'),
      incluirComparativo: z.boolean().optional().describe('Incluir comparativo com período anterior'),
      incluirOrcado: z.boolean().optional().describe('Incluir comparativo com orçado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionGerarDRE(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao gerar DRE');
      }
    },
  });

  registerMcpTool({
    name: 'obter_evolucao_dre',
    description: 'Obtém evolução mensal da DRE para um ano específico',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      ano: z.number().min(2020).max(2100).describe('Ano para análise (ex: 2024)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterEvolucaoDRE(args.ano);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter evolução DRE');
      }
    },
  });

  registerMcpTool({
    name: 'exportar_dre_csv',
    description: 'Exporta DRE em formato CSV',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExportarDRECSV(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao exportar DRE CSV');
      }
    },
  });

  registerMcpTool({
    name: 'exportar_dre_pdf',
    description: 'Exporta DRE em formato PDF (retorna Base64)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      tipo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().describe('Tipo de período'),
    }),
    handler: async (args) => {
      try {
        const result = await actionExportarDREPDF(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao exportar DRE PDF');
      }
    },
  });

  // ===== FLUXO DE CAIXA =====

  registerMcpTool({
    name: 'obter_fluxo_caixa_unificado',
    description: 'Obtém fluxo de caixa consolidado com entradas, saídas e saldo',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterFluxoCaixaUnificado(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa');
      }
    },
  });

  registerMcpTool({
    name: 'obter_fluxo_caixa_diario',
    description: 'Obtém fluxo de caixa diário para análise detalhada de uma conta bancária',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number().describe('ID da conta bancária'),
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterFluxoCaixaDiario(
          args.contaBancariaId,
          args.dataInicio,
          args.dataFim
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa diário');
      }
    },
  });

  registerMcpTool({
    name: 'obter_fluxo_caixa_por_periodo',
    description: 'Obtém fluxo de caixa agrupado por período (dia/semana/mês)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      agrupamento: z.enum(['dia', 'semana', 'mes']).default('mes').describe('Tipo de agrupamento'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
      incluirProjetado: z.boolean().optional().describe('Incluir valores projetados'),
    }),
    handler: async (args) => {
      try {
        const { agrupamento, ...filtros } = args;
        const result = await actionObterFluxoCaixaPorPeriodo(filtros, agrupamento);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter fluxo de caixa por período');
      }
    },
  });

  registerMcpTool({
    name: 'obter_indicadores_saude',
    description: 'Obtém indicadores de saúde financeira (liquidez, cobertura, tendência)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterIndicadoresSaude(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter indicadores de saúde');
      }
    },
  });

  registerMcpTool({
    name: 'obter_alertas_caixa',
    description: 'Obtém alertas de fluxo de caixa (saldo baixo, vencimentos, variações)',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterAlertasCaixa(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter alertas de caixa');
      }
    },
  });

  registerMcpTool({
    name: 'obter_resumo_dashboard',
    description: 'Obtém resumo consolidado para dashboard de fluxo de caixa',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária (opcional)'),
      centroCustoId: z.number().optional().describe('ID do centro de custo (opcional)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterResumoDashboard(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter resumo dashboard');
      }
    },
  });

  registerMcpTool({
    name: 'obter_saldo_inicial',
    description: 'Obtém saldo inicial de uma conta bancária em uma data específica',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number().describe('ID da conta bancária'),
      data: z.string().describe('Data de referência (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterSaldoInicial(args.contaBancariaId, args.data);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter saldo inicial');
      }
    },
  });

  registerMcpTool({
    name: 'listar_contas_bancarias',
    description: 'Lista todas as contas bancárias disponíveis no sistema',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarContasBancarias();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar contas bancárias');
      }
    },
  });

  registerMcpTool({
    name: 'listar_centros_custo',
    description: 'Lista todos os centros de custo disponíveis no sistema',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarCentrosCusto();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar centros de custo');
      }
    },
  });

  // ===== CONCILIAÇÃO =====

  registerMcpTool({
    name: 'listar_transacoes',
    description: 'Lista transações bancárias importadas para conciliação',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de transações'),
      pagina: z.number().min(1).default(1).describe('Número da página'),
      statusConciliacao: z.enum(['pendente', 'conciliado', 'divergente', 'ignorado']).optional().describe('Status da conciliação'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
      dataInicio: z.string().optional().describe('Data início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim (YYYY-MM-DD)'),
      tipoTransacao: z.enum(['credito', 'debito']).optional().describe('Tipo da transação'),
      busca: z.string().optional().describe('Busca por descrição ou documento'),
      ordenarPor: z.string().optional().describe('Campo para ordenação'),
      ordem: z.enum(['asc', 'desc']).optional().describe('Ordem da ordenação'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTransacoes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar transações');
      }
    },
  });

  registerMcpTool({
    name: 'conciliar_manual',
    description: 'Concilia transação bancária com lançamento manualmente',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoImportadaId: z.number().describe('ID da transação bancária importada'),
      lancamentoFinanceiroId: z.number().nullable().describe('ID do lançamento financeiro (null para ignorar ou criar novo)'),
      criarNovoLancamento: z.boolean().optional().describe('Se deve criar um novo lançamento'),
      dadosNovoLancamento: z.object({}).passthrough().optional().describe('Dados do novo lançamento a ser criado'),
    }),
    handler: async (args) => {
      try {
        const result = await actionConciliarManual(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao conciliar transação');
      }
    },
  });

  registerMcpTool({
    name: 'obter_sugestoes',
    description: 'Obtém sugestões de conciliação automática',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number().describe('ID da transação bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterSugestoes(args.transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter sugestões');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_lancamentos_candidatos',
    description: 'Busca lançamentos candidatos para conciliação manual com uma transação bancária',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      valor: z.number().describe('Valor da transação'),
      dataInicio: z.string().describe('Data início da busca (YYYY-MM-DD)'),
      dataFim: z.string().describe('Data fim da busca (YYYY-MM-DD)'),
      tipo: z.enum(['receita', 'despesa']).describe('Tipo de lançamento'),
      contaBancariaId: z.number().optional().describe('ID da conta bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarLancamentosManuais(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar lançamentos candidatos');
      }
    },
  });

  registerMcpTool({
    name: 'desconciliar',
    description: 'Desfaz conciliação de transação',
    feature: 'financeiro',
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number().describe('ID da transação bancária'),
    }),
    handler: async (args) => {
      try {
        const result = await actionDesconciliar(args.transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao desconciliar');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: CHAT
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_salas: Lista salas de chat
 * - enviar_mensagem: Envia mensagem
 * - buscar_historico: Busca histórico de mensagens
 * - criar_grupo: Cria grupo de chat
 * - iniciar_chamada: Inicia chamada de vídeo
 * - buscar_historico_chamadas: Busca histórico de chamadas
 */
async function registerChatTools(): Promise<void> {
  const {
    actionListarSalas,
    actionEnviarMensagem,
    actionBuscarHistorico,
    actionCriarGrupo,
    actionIniciarChamada,
    actionBuscarHistoricoChamadas,
  } = await import('@/features/chat/actions/chat-actions');

  registerMcpTool({
    name: 'listar_salas',
    description: 'Lista salas de chat disponíveis para o usuário',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de salas'),
      tipo: z.enum(['individual', 'grupo']).optional().describe('Tipo de sala'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarSalas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar salas');
      }
    },
  });

  registerMcpTool({
    name: 'enviar_mensagem',
    description: 'Envia mensagem em uma sala de chat',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      conteudo: z.string().min(1).describe('Conteúdo da mensagem'),
    }),
    handler: async (args) => {
      try {
        const result = await actionEnviarMensagem(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_historico',
    description: 'Busca histórico de mensagens de uma sala',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      limite: z.number().min(1).max(100).default(50).describe('Número máximo de mensagens'),
      antes: z.string().optional().describe('Buscar mensagens antes desta data (ISO)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarHistorico(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar histórico');
      }
    },
  });

  registerMcpTool({
    name: 'criar_grupo',
    description: 'Cria novo grupo de chat',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      nome: z.string().min(1).describe('Nome do grupo'),
      descricao: z.string().optional().describe('Descrição do grupo'),
      membros: z.array(z.number()).min(1).describe('IDs dos membros iniciais'),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarGrupo(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar grupo');
      }
    },
  });

  registerMcpTool({
    name: 'iniciar_chamada',
    description: 'Inicia chamada de vídeo/áudio',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().describe('ID da sala de chat'),
      tipo: z.enum(['video', 'audio']).describe('Tipo de chamada'),
    }),
    handler: async (args) => {
      try {
        const result = await actionIniciarChamada(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao iniciar chamada');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_historico_chamadas',
    description: 'Busca histórico de chamadas',
    feature: 'chat',
    requiresAuth: true,
    schema: z.object({
      salaId: z.number().optional().describe('ID da sala de chat (opcional)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de chamadas'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarHistoricoChamadas(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar histórico de chamadas');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: DOCUMENTOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_documentos: Lista documentos com filtros (pasta, tags, busca)
 * - buscar_documento_por_tags: Busca documentos por tags específicas
 * - listar_templates: Lista templates disponíveis com filtros
 * - usar_template: Cria documento a partir de template
 * - listar_categorias_templates: Lista categorias de templates
 * - listar_templates_mais_usados: Lista templates mais populares
 */
async function registerDocumentosTools(): Promise<void> {
  // Documentos
  const { actionListarDocumentos } = await import('@/features/documentos/actions/documentos-actions');

  // Templates
  const {
    actionListarTemplates,
    actionUsarTemplate,
    actionListarCategorias,
    actionListarTemplatesMaisUsados,
  } = await import('@/features/documentos/actions/templates-actions');

  // Lista documentos do sistema com filtros.
  // Útil para agentes descobrirem documentos existentes por pasta, tags ou busca textual.
  registerMcpTool({
    name: 'listar_documentos',
    description: 'Lista documentos do sistema com filtros por pasta, tags e busca textual',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de documentos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      pasta_id: z.number().optional().describe('Filtrar por pasta'),
      tags: z.array(z.string()).optional().describe('Filtrar por tags'),
      busca: z.string().optional().describe('Busca textual por título ou conteúdo'),
    }),
    handler: async (args) => {
      try {
        // Mapear 'limite' para 'limit' conforme esperado pela action
        const { limite, ...rest } = args;
        const result = await actionListarDocumentos({ ...rest, limit: limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar documentos');
      }
    },
  });

  // Busca documentos por tags específicas.
  // Útil para encontrar documentos relacionados a temas ou categorias.
  registerMcpTool({
    name: 'buscar_documento_por_tags',
    description: 'Busca documentos por tags específicas',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      tags: z.array(z.string()).min(1).describe('Tags para buscar'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de documentos'),
    }),
    handler: async (args) => {
      try {
        // Mapear 'limite' para 'limit' conforme esperado pela action
        const result = await actionListarDocumentos({ tags: args.tags, limit: args.limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar documentos por tags');
      }
    },
  });

  // Lista templates de documentos com filtros por categoria e visibilidade.
  // Útil para agentes descobrirem templates disponíveis antes de criar documentos.
  registerMcpTool({
    name: 'listar_templates',
    description: 'Lista templates de documentos disponíveis com filtros por categoria e visibilidade',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de templates'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      categoria: z.string().optional().describe('Filtrar por categoria'),
      visibilidade: z.enum(['publico', 'privado']).optional().describe('Filtrar por visibilidade'),
      busca: z.string().optional().describe('Busca textual por título'),
    }),
    handler: async (args) => {
      try {
        // Mapear 'limite' para 'limit' conforme esperado pela action
        const { limite, ...rest } = args;
        const result = await actionListarTemplates({ ...rest, limit: limite });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates');
      }
    },
  });

  // Cria novo documento a partir de um template existente.
  // Útil para agentes criarem documentos baseados em modelos pré-definidos.
  registerMcpTool({
    name: 'usar_template',
    description: 'Cria novo documento a partir de um template existente',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      template_id: z.number().describe('ID do template a usar'),
      titulo: z.string().optional().describe('Título do novo documento (opcional)'),
      pasta_id: z.number().nullable().optional().describe('ID da pasta destino (null para raiz)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionUsarTemplate(args.template_id, {
          titulo: args.titulo,
          pasta_id: args.pasta_id,
        });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao usar template');
      }
    },
  });

  // Lista todas as categorias de templates disponíveis.
  // Útil para agentes explorarem as categorias antes de listar templates.
  registerMcpTool({
    name: 'listar_categorias_templates',
    description: 'Lista todas as categorias de templates disponíveis',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarCategorias();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar categorias');
      }
    },
  });

  // Lista os templates mais utilizados no sistema.
  // Útil para agentes descobrirem templates populares rapidamente.
  registerMcpTool({
    name: 'listar_templates_mais_usados',
    description: 'Lista os templates mais utilizados no sistema',
    feature: 'documentos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(50).default(10).describe('Número de templates a retornar'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTemplatesMaisUsados(args.limite);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates mais usados');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: EXPEDIENTES
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_expedientes: Lista expedientes com filtros
 * - criar_expediente: Cria novo expediente
 * - baixar_expediente: Baixa/finaliza expediente
 * - reverter_baixa_expediente: Reverte baixa de expediente
 * - listar_expedientes_pendentes: Lista apenas pendentes
 * - transferir_responsavel_expediente: Transfere responsável (bulk)
 * - baixar_expedientes_em_massa: Baixa múltiplos expedientes (bulk)
 */
async function registerExpedientesTools(): Promise<void> {
  const {
    actionListarExpedientes,
    actionCriarExpediente,
    actionBaixarExpediente,
    actionReverterBaixa,
  } = await import('@/features/expedientes/actions');

  const {
    actionBulkTransferirResponsavel,
    actionBulkBaixar,
  } = await import('@/features/expedientes/actions-bulk');

  registerMcpTool({
    name: 'listar_expedientes',
    description: 'Lista expedientes do sistema com filtros por responsável, prazo, tipo, processo',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de expedientes'),
      pagina: z.number().min(1).default(1).describe('Página para paginação'),
      processoId: z.number().optional().describe('Filtrar por processo'),
      busca: z.string().optional().describe('Busca textual por descrição'),
      responsavelId: z.number().optional().describe('Filtrar por responsável (ID do usuário)'),
      semResponsavel: z.boolean().optional().describe('Filtrar expedientes sem responsável atribuído'),
      prazoVencido: z.boolean().optional().describe('Filtrar expedientes com prazo vencido'),
      dataPrazoLegalInicio: z.string().optional().describe('Data início do período de prazo legal (YYYY-MM-DD)'),
      dataPrazoLegalFim: z.string().optional().describe('Data fim do período de prazo legal (YYYY-MM-DD)'),
      semPrazo: z.boolean().optional().describe('Filtrar expedientes sem prazo definido'),
      baixado: z.boolean().optional().describe('Filtrar por expedientes baixados (true) ou não baixados (false)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarExpedientes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar expedientes');
      }
    },
  });

  registerMcpTool({
    name: 'criar_expediente',
    description: 'Cria novo expediente no sistema',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(1).describe('Número do processo (formato CNJ)'),
      trt: z.enum(['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24']).describe('Tribunal Regional do Trabalho'),
      grau: z.enum(['primeiro_grau', 'segundo_grau', 'tribunal_superior']).describe('Grau do tribunal'),
      dataPrazoLegalParte: z.string().describe('Data do prazo legal (YYYY-MM-DD)'),
      origem: z.enum(['captura', 'manual', 'comunica_cnj']).default('manual').describe('Origem do expediente'),
      processoId: z.number().optional().describe('ID do processo vinculado'),
      responsavelId: z.number().optional().describe('ID do responsável'),
      tipoExpedienteId: z.number().optional().describe('ID do tipo de expediente'),
      observacoes: z.string().optional().describe('Observações adicionais'),
    }),
    handler: async (args) => {
      try {
        // Converter objeto para FormData
        const formData = new FormData();
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const result = await actionCriarExpediente(null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar expediente');
      }
    },
  });

  registerMcpTool({
    name: 'baixar_expediente',
    description: 'Baixa/finaliza expediente',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do expediente'),
      protocoloId: z.string().optional().describe('ID do protocolo de baixa'),
      justificativaBaixa: z.string().optional().describe('Justificativa para baixa sem protocolo'),
      dataBaixa: z.string().optional().describe('Data da baixa (YYYY-MM-DD)'),
    }).refine(data => data.protocoloId || data.justificativaBaixa, {
      message: 'É necessário fornecer protocoloId ou justificativaBaixa',
    }),
    handler: async (args) => {
      try {
        const { id, protocoloId, justificativaBaixa, dataBaixa } = args;

        // Converter para FormData
        const formData = new FormData();
        if (protocoloId) formData.append('protocoloId', protocoloId);
        if (justificativaBaixa) formData.append('justificativaBaixa', justificativaBaixa);
        if (dataBaixa) formData.append('dataBaixa', dataBaixa);

        const result = await actionBaixarExpediente(id, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao baixar expediente');
      }
    },
  });

  registerMcpTool({
    name: 'reverter_baixa_expediente',
    description: 'Reverte a baixa/finalização de um expediente, retornando-o ao status pendente',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do expediente a reverter'),
    }),
    handler: async (args) => {
      try {
        const { actionReverterBaixa } = await import('@/features/expedientes/actions');
        const result = await actionReverterBaixa(args.id, null, new FormData());
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao reverter baixa do expediente');
      }
    },
  });

  registerMcpTool({
    name: 'transferir_responsavel_expediente',
    description: 'Transfere a responsabilidade de um ou mais expedientes para outro usuário',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      expedienteIds: z.array(z.number()).min(1).describe('IDs dos expedientes a transferir'),
      responsavelId: z.number().nullable().describe('ID do novo responsável (null para remover responsável)'),
    }),
    handler: async (args) => {
      try {
        const { actionBulkTransferirResponsavel } = await import('@/features/expedientes/actions-bulk');

        const formData = new FormData();
        formData.append('responsavelId', args.responsavelId === null ? 'null' : String(args.responsavelId));

        const result = await actionBulkTransferirResponsavel(args.expedienteIds, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao transferir responsável');
      }
    },
  });

  registerMcpTool({
    name: 'baixar_expedientes_em_massa',
    description: 'Baixa/finaliza múltiplos expedientes de uma vez com a mesma justificativa',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      expedienteIds: z.array(z.number()).min(1).describe('IDs dos expedientes a baixar'),
      justificativaBaixa: z.string().min(1).describe('Justificativa para a baixa em massa'),
    }),
    handler: async (args) => {
      try {
        const { actionBulkBaixar } = await import('@/features/expedientes/actions-bulk');

        const formData = new FormData();
        formData.append('justificativaBaixa', args.justificativaBaixa);

        const result = await actionBulkBaixar(args.expedienteIds, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao baixar expedientes em massa');
      }
    },
  });

  registerMcpTool({
    name: 'listar_expedientes_pendentes',
    description: 'Lista apenas expedientes pendentes',
    feature: 'expedientes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de expedientes'),
      processoId: z.number().optional().describe('Filtrar por processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarExpedientes({ ...args, status: 'pendente' });
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar expedientes pendentes');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: AUDIÊNCIAS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_audiencias: Lista audiências com filtros
 * - atualizar_status_audiencia: Atualiza status
 * - listar_tipos_audiencia: Lista tipos disponíveis
 * - buscar_audiencias_por_cpf: Busca por CPF do cliente
 * - buscar_audiencias_por_cnpj: Busca por CNPJ do cliente
 * - buscar_audiencias_por_numero_processo: Busca por número processual
 */
async function registerAudienciasTools(): Promise<void> {
  const {
    actionListarAudiencias,
    actionAtualizarStatusAudiencia,
    actionListarTiposAudiencia,
    actionBuscarAudienciasPorNumeroProcesso,
  } = await import('@/features/audiencias/actions');

  registerMcpTool({
    name: 'listar_audiencias',
    description: 'Lista audiências do sistema com filtros por data, tipo, status, processo',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      dataInicio: z.string().optional().describe('Data início do período (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data fim do período (YYYY-MM-DD)'),
      tipo: z.string().optional().describe('Tipo de audiência'),
      status: z.enum(['agendada', 'realizada', 'cancelada', 'adiada']).optional().describe('Status'),
      processoId: z.number().optional().describe('Filtrar por processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAudiencias(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar audiências');
      }
    },
  });

  registerMcpTool({
    name: 'atualizar_status_audiencia',
    description: 'Atualiza status de uma audiência',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da audiência'),
      status: z.enum(['M', 'F', 'C']).describe('Novo status (M=Marcada, F=Finalizada, C=Cancelada)'),
      statusDescricao: z.string().optional().describe('Descrição sobre a mudança de status'),
    }),
    handler: async (args) => {
      try {
        const { id, status, statusDescricao } = args;
        const result = await actionAtualizarStatusAudiencia(id, status, statusDescricao);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao atualizar status da audiência');
      }
    },
  });

  registerMcpTool({
    name: 'listar_tipos_audiencia',
    description: 'Lista tipos de audiências disponíveis no sistema',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarTiposAudiencia();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tipos de audiência');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_audiencias_por_cpf',
    description: 'Busca audiências vinculadas a um cliente por CPF',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
    }),
    handler: async (args) => {
      try {
        // Buscar cliente por CPF e depois suas audiências
        const { actionListarClientes } = await import('@/features/partes');
        const clienteResult = await actionListarClientes({ busca: args.cpf, limite: 1 });

        if (!clienteResult.success) {
          return actionResultToMcp(clienteResult as ActionResult<unknown>);
        }

        const clientes = clienteResult.data as Array<{ id?: number }>;
        const cliente = clientes?.[0];

        if (!cliente?.id) {
          return errorResult('Cliente não encontrado com este CPF');
        }

        // Buscar processos do cliente
        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cpf });

        if (!processosResult.success) {
          return jsonResult({ audiencias: [] });
        }

        const processos = processosResult.data as Array<{ id?: number }>;

        // Buscar audiências de todos os processos
        const todasAudiencias = [];
        for (const processo of processos) {
          if (!processo?.id) continue;
          const audienciasResult = await actionListarAudiencias({ processoId: processo.id, limite: args.limite });
          if (audienciasResult.success) {
            todasAudiencias.push(...(audienciasResult.data as Array<unknown>));
          }
        }

        return jsonResult({
          message: `${todasAudiencias.length} audiência(s) encontrada(s)`,
          cpf: args.cpf,
          total: todasAudiencias.length,
          audiencias: todasAudiencias,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por CPF');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_audiencias_por_cnpj',
    description: 'Busca audiências vinculadas a um cliente por CNPJ',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de audiências'),
    }),
    handler: async (args) => {
      try {
        // Buscar cliente por CNPJ e depois suas audiências
        const { actionListarClientes } = await import('@/features/partes');
        const clienteResult = await actionListarClientes({ busca: args.cnpj, limite: 1 });

        if (!clienteResult.success) {
          return actionResultToMcp(clienteResult as ActionResult<unknown>);
        }

        const clientes = clienteResult.data as Array<{ id?: number }>;
        const cliente = clientes?.[0];

        if (!cliente?.id) {
          return errorResult('Cliente não encontrado com este CNPJ');
        }

        // Buscar processos do cliente
        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cnpj });

        if (!processosResult.success) {
          return jsonResult({ audiencias: [] });
        }

        const processos = processosResult.data as Array<{ id?: number }>;

        // Buscar audiências de todos os processos
        const todasAudiencias = [];
        for (const processo of processos) {
          if (!processo?.id) continue;
          const audienciasResult = await actionListarAudiencias({ processoId: processo.id, limite: args.limite });
          if (audienciasResult.success) {
            todasAudiencias.push(...(audienciasResult.data as Array<unknown>));
          }
        }

        return jsonResult({
          message: `${todasAudiencias.length} audiência(s) encontrada(s)`,
          cnpj: args.cnpj,
          total: todasAudiencias.length,
          audiencias: todasAudiencias,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por CNPJ');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_audiencias_por_numero_processo',
    description: 'Busca audiências de um processo específico pelo número processual (formato CNJ)',
    feature: 'audiencias',
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(1).describe('Número do processo (formato CNJ: 0000000-00.0000.0.00.0000)'),
      status: z.enum(['M', 'F', 'C']).optional().describe('Filtrar por status: M=Marcada, F=Finalizada, C=Cancelada'),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAudienciasPorNumeroProcesso } = await import('@/features/audiencias/actions');
        const result = await actionBuscarAudienciasPorNumeroProcesso(args.numeroProcesso, args.status);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar audiências por número de processo');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: OBRIGAÇÕES/ACORDOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_acordos: Lista acordos
 * - buscar_acordos_por_cpf: Busca por CPF
 * - buscar_acordos_por_cnpj: Busca por CNPJ
 * - listar_repasses_pendentes: Lista repasses pendentes
 */
async function registerObrigacoesTools(): Promise<void> {
  const {
    actionListarAcordos,
  } = await import('@/features/obrigacoes/actions/acordos');

  const {
    actionListarRepassesPendentes,
  } = await import('@/features/obrigacoes/actions/repasses');

  registerMcpTool({
    name: 'listar_acordos',
    description: 'Lista acordos/condenações do sistema com filtros',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de acordos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      status: z.string().optional().describe('Filtrar por status'),
      processoId: z.number().optional().describe('Filtrar por processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAcordos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar acordos');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_acordos_por_cpf',
    description: 'Busca acordos vinculados a um cliente por CPF',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe('CPF do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de acordos'),
    }),
    handler: async (args) => {
      try {
        // Buscar processos do cliente e depois acordos
        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cpf });

        if (!processosResult.success) {
          return jsonResult({ acordos: [] });
        }

        const processos = processosResult.data as Array<{ id?: number }>;

        // Buscar acordos de todos os processos
        const todosAcordos = [];
        for (const processo of processos) {
          if (!processo?.id) continue;
          const acordosResult = await actionListarAcordos({ processoId: processo.id, limite: args.limite });
          if (acordosResult.success) {
            todosAcordos.push(...(acordosResult.data as Array<unknown>));
          }
        }

        return jsonResult({
          message: `${todosAcordos.length} acordo(s) encontrado(s)`,
          cpf: args.cpf,
          total: todosAcordos.length,
          acordos: todosAcordos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar acordos por CPF');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_acordos_por_cnpj',
    description: 'Busca acordos vinculados a um cliente por CNPJ',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe('CNPJ do cliente (apenas números)'),
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de acordos'),
    }),
    handler: async (args) => {
      try {
        // Buscar processos do cliente e depois acordos
        const { actionListarProcessos } = await import('@/features/processos/actions');
        const processosResult = await actionListarProcessos({ busca: args.cnpj });

        if (!processosResult.success) {
          return jsonResult({ acordos: [] });
        }

        const processos = processosResult.data as Array<{ id?: number }>;

        // Buscar acordos de todos os processos
        const todosAcordos = [];
        for (const processo of processos) {
          if (!processo?.id) continue;
          const acordosResult = await actionListarAcordos({ processoId: processo.id, limite: args.limite });
          if (acordosResult.success) {
            todosAcordos.push(...(acordosResult.data as Array<unknown>));
          }
        }

        return jsonResult({
          message: `${todosAcordos.length} acordo(s) encontrado(s)`,
          cnpj: args.cnpj,
          total: todosAcordos.length,
          acordos: todosAcordos,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar acordos por CNPJ');
      }
    },
  });

  registerMcpTool({
    name: 'listar_repasses_pendentes',
    description: 'Lista repasses pendentes de pagamento',
    feature: 'obrigacoes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de repasses'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarRepassesPendentes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar repasses pendentes');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: RH
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_salarios: Lista salários
 * - listar_folhas_pagamento: Lista folhas de pagamento
 */
async function registerRHTools(): Promise<void> {
  const {
    actionListarSalarios,
  } = await import('@/features/rh/actions/salarios-actions');

  const {
    actionListarFolhasPagamento,
  } = await import('@/features/rh/actions/folhas-pagamento-actions');

  registerMcpTool({
    name: 'listar_salarios',
    description: 'Lista salários de funcionários',
    feature: 'rh',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      funcionarioId: z.number().optional().describe('Filtrar por funcionário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarSalarios(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar salários');
      }
    },
  });

  registerMcpTool({
    name: 'listar_folhas_pagamento',
    description: 'Lista folhas de pagamento',
    feature: 'rh',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      mesAno: z.string().optional().describe('Filtrar por mês/ano (YYYY-MM)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarFolhasPagamento(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar folhas de pagamento');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: DASHBOARD
 * =========================================================================
 *
 * Tools disponíveis:
 * - obter_metricas_escritorio: Métricas gerais
 * - obter_dashboard_usuario: Dashboard personalizado
 */
async function registerDashboardTools(): Promise<void> {
  const {
    actionObterMetricasEscritorio,
  } = await import('@/features/dashboard/actions/metricas-actions');

  const {
    actionObterDashboardUsuario,
  } = await import('@/features/dashboard/actions/dashboard-actions');

  registerMcpTool({
    name: 'obter_metricas_escritorio',
    description: 'Obtém métricas gerais do escritório (processos, receitas, despesas)',
    feature: 'dashboard',
    requiresAuth: true,
    schema: z.object({
      periodo: z.enum(['mes', 'trimestre', 'ano']).optional().describe('Período das métricas'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterMetricasEscritorio(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter métricas do escritório');
      }
    },
  });

  registerMcpTool({
    name: 'obter_dashboard_usuario',
    description: 'Obtém dashboard personalizado do usuário autenticado',
    feature: 'dashboard',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionObterDashboardUsuario();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter dashboard do usuário');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: BUSCA SEMÂNTICA
 * =========================================================================
 *
 * Tools disponíveis:
 * - buscar_semantica: Busca semântica com IA (RAG)
 */
async function registerBuscaSemanticaTools(): Promise<void> {
  const {
    retrieveContextForQuery,
  } = await import('@/lib/ai/retrieval');

  registerMcpTool({
    name: 'buscar_semantica',
    description: 'Realiza busca semântica com IA em documentos, processos e conhecimento do escritório',
    feature: 'busca',
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe('Pergunta ou termo de busca'),
      limite: z.number().min(1).max(20).default(5).describe('Número máximo de resultados'),
      contextos: z.array(z.enum(['processos', 'documentos', 'contratos', 'clientes'])).optional().describe('Tipos de contexto para buscar'),
    }),
    handler: async (args) => {
      try {
        const result = await retrieveContextForQuery(args.query, args.limite);
        return jsonResult({
          message: 'Busca semântica concluída',
          query: args.query,
          resultados: result,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro na busca semântica');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: CAPTURA
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_capturas_cnj: Lista capturas do Comunica CNJ
 * - obter_timeline_captura: Timeline de captura
 */
async function registerCapturaTools(): Promise<void> {
  const {
    actionListarCapturasCNJ,
  } = await import('@/features/captura/actions/comunica-cnj-actions');

  const {
    actionObterTimelineCaptura,
  } = await import('@/features/captura/actions/timeline-actions');

  registerMcpTool({
    name: 'listar_capturas_cnj',
    description: 'Lista capturas do sistema Comunica CNJ',
    feature: 'captura',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de capturas'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      processoId: z.number().optional().describe('Filtrar por processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarCapturasCNJ(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar capturas CNJ');
      }
    },
  });

  registerMcpTool({
    name: 'obter_timeline_captura',
    description: 'Obtém timeline de captura de um processo',
    feature: 'captura',
    requiresAuth: true,
    schema: z.object({
      processoId: z.number().describe('ID do processo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterTimelineCaptura(args.processoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter timeline de captura');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: USUÁRIOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_usuarios: Lista usuários com filtros (busca, ativo, cargo)
 * - buscar_usuario_por_email: Busca usuário por email corporativo
 * - buscar_usuario_por_cpf: Busca usuário por CPF
 * - listar_permissoes_usuario: Lista permissões de um usuário
 */
async function registerUsuariosTools(): Promise<void> {
  const {
    actionListarUsuarios,
    actionBuscarPorEmail,
    actionBuscarPorCpf,
  } = await import('@/features/usuarios/actions/usuarios-actions');

  const {
    actionListarPermissoes,
  } = await import('@/features/usuarios/actions/permissoes-actions');

  // Lista usuários do sistema com filtros.
  // Útil para agentes descobrirem usuários disponíveis no sistema.
  registerMcpTool({
    name: 'listar_usuarios',
    description: 'Lista usuários do sistema com filtros por busca, status ativo e cargo',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de usuários'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      busca: z.string().optional().describe('Busca por nome, email ou CPF'),
      ativo: z.boolean().optional().describe('Filtrar por status ativo/inativo'),
      cargoId: z.number().optional().describe('Filtrar por cargo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarUsuarios(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar usuários');
      }
    },
  });

  // Busca usuário específico por email corporativo.
  // Útil para agentes encontrarem usuários por endereço de email.
  registerMcpTool({
    name: 'buscar_usuario_por_email',
    description: 'Busca usuário específico por endereço de email corporativo',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      email: z.string().email().describe('Email corporativo do usuário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarPorEmail(args.email);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar usuário por email');
      }
    },
  });

  // Busca usuário específico por CPF.
  // Útil para agentes encontrarem usuários por documento de identificação.
  registerMcpTool({
    name: 'buscar_usuario_por_cpf',
    description: 'Busca usuário específico por CPF (apenas números)',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().regex(/^\d{11}$/).describe('CPF do usuário (11 dígitos, apenas números)'),
    }),
    handler: async (args) => {
      try {
        const result = await actionBuscarPorCpf(args.cpf);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao buscar usuário por CPF');
      }
    },
  });

  // Lista todas as permissões de um usuário específico.
  // Útil para agentes verificarem recursos e operações autorizadas.
  registerMcpTool({
    name: 'listar_permissoes_usuario',
    description: 'Lista todas as permissões de um usuário específico (recursos e operações)',
    feature: 'usuarios',
    requiresAuth: true,
    schema: z.object({
      usuarioId: z.number().describe('ID do usuário'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPermissoes(args.usuarioId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar permissões do usuário');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: ACERVO
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_acervo: Lista processos do acervo
 */
async function registerAcervoTools(): Promise<void> {
  const {
    actionListarAcervo,
  } = await import('@/features/acervo/actions/acervo-actions');

  registerMcpTool({
    name: 'listar_acervo',
    description: 'Lista processos do acervo com filtros',
    feature: 'acervo',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de processos'),
      offset: z.number().min(0).default(0).describe('Offset para paginação'),
      status: z.string().optional().describe('Filtrar por status'),
      busca: z.string().optional().describe('Busca textual'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAcervo(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar acervo');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: ASSISTENTES
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_assistentes: Lista assistentes de IA
 */
async function registerAssistentesTools(): Promise<void> {
  const {
    actionListarAssistentes,
  } = await import('@/features/assistentes/actions/assistentes-actions');

  registerMcpTool({
    name: 'listar_assistentes',
    description: 'Lista assistentes de IA disponíveis no sistema',
    feature: 'assistentes',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de assistentes'),
      busca: z.string().optional().describe('Busca textual por nome'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAssistentes(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar assistentes');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: CARGOS
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_cargos: Lista cargos disponíveis
 */
async function registerCargosTools(): Promise<void> {
  const {
    actionListarCargos,
  } = await import('@/features/cargos/actions/cargos-actions');

  registerMcpTool({
    name: 'listar_cargos',
    description: 'Lista cargos disponíveis no sistema',
    feature: 'cargos',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de cargos'),
      busca: z.string().optional().describe('Busca textual por nome do cargo'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarCargos(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar cargos');
      }
    },
  });
}

/**
 * =========================================================================
 * MÓDULO: ASSINATURA DIGITAL
 * =========================================================================
 *
 * Tools disponíveis:
 * - listar_templates_assinatura: Lista templates de assinatura
 */
async function registerAssinaturaDigitalTools(): Promise<void> {
  const {
    actionListarTemplatesAssinatura,
  } = await import('@/features/assinatura-digital/actions');

  registerMcpTool({
    name: 'listar_templates_assinatura',
    description: 'Lista templates de assinatura digital disponíveis',
    feature: 'assinatura-digital',
    requiresAuth: true,
    schema: z.object({
      limite: z.number().min(1).max(100).default(20).describe('Número máximo de templates'),
      segmento: z.string().optional().describe('Filtrar por segmento'),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTemplatesAssinatura(args);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar templates de assinatura');
      }
    },
  });
}
