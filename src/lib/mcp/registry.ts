/**
 * Registry de ferramentas MCP do Sinesys
 *
 * Registra todas as Server Actions como ferramentas MCP
 * Cobertura atual: ~29% das 331 Server Actions disponíveis (96 ferramentas)
 *
 * Última atualização: 2025-12-31
 *
 * REFATORAÇÃO CONCLUÍDA:
 * - Removidas 9 ferramentas de busca por ID (inúteis para uso prático)
 * - Adicionada documentação detalhada para cada módulo existente
 * - Reorganização com seções comentadas por módulo
 * - Implementados 11 novos módulos com ferramentas textuais
 * - Melhorada busca textual em Financeiro (lançamentos agora suportam busca por descrição)
 * - Foco em buscas textuais e por propriedades categorizadoras (CPF, CNPJ, nome, número, email, OAB)
 *
 * ESTRATÉGIA:
 * - Ferramentas de listagem com filtros textuais robustos
 * - Buscas específicas por propriedades úteis (CPF, CNPJ, número processual, email, OAB)
 * - Eliminação de poluição de ferramentas que exigem conhecimento prévio de IDs
 *
 * MÓDULOS COM MCP IMPLEMENTADO:
 * ✅ Processos (6 ferramentas) - Busca por CPF/CNPJ/número, listagem com filtros
 * ✅ Partes/Clientes (5 ferramentas) - Busca por CPF/CNPJ, listagem
 * ✅ Contratos (3 ferramentas) - Criar, listar, atualizar
 * ✅ Financeiro (28 ferramentas) - Plano de contas, lançamentos com busca textual, DRE, fluxo de caixa, conciliação
 * ✅ Chat (9 ferramentas) - Salas, mensagens, chamadas, resumos IA
 * ✅ Documentos (4 ferramentas) - CRUD completo com busca textual
 * ✅ Expedientes (3 ferramentas) - Listagem, criar, baixar
 * ✅ Audiências (6 ferramentas) - Busca por CPF/CNPJ/número, listagem, atualização
 * ✅ Acordos/Condenações (3 ferramentas) - Busca por CPF/CNPJ/número
 * ✅ Busca Semântica (1 ferramenta) - RAG com IA
 * ✅ Captura (3 ferramentas) - Comunicações CNJ, tribunais disponíveis, captura de timeline
 * ✅ Usuários (4 ferramentas) - Busca por email/CPF, listagem, permissões
 * ✅ Advogados (3 ferramentas) - Busca por OAB, listagem, credenciais
 * ✅ RH (3 ferramentas) - Folhas de pagamento, salários
 * ✅ Tipos de Expedientes (2 ferramentas) - Listagem, busca por nome
 * ✅ Acervo (2 ferramentas - NOVO) - Listagem com filtros, busca por CPF do cliente
 * ✅ Dashboard (2 ferramentas - NOVO) - Dashboard usuário, métricas escritório (admin)
 * ✅ Assinatura Digital (3 ferramentas - NOVO) - Segmentos, templates, formulários
 * ✅ Cargos (1 ferramenta - NOVO) - Listagem com busca textual
 * ✅ Assistentes (1 ferramenta - NOVO) - Listagem com busca textual
 * ✅ Repasses (1 ferramenta - NOVO) - Listagem de pendentes com filtros
 * ✅ Sistema (2 ferramentas) - Status, listar ferramentas
 *
 * MÓDULOS PENDENTES (sem Server Actions apropriadas):
 * ⏳ Endereços - Requer criação de Server Actions
 * ⏳ Tasks - Requer criação de Server Actions
 * ⏳ Portal Cliente - Actions são login-focused, não MCP-appropriate
 */

import { z } from "zod";
import { registerMcpTool, getMcpServerManager } from "./server";
import { actionResultToMcp } from "./utils";
import { jsonResult, errorResult, textResult } from "./types";
import type { ActionResult } from "@/lib/safe-action";

// =============================================================================
// IMPORTS - PROCESSOS
// =============================================================================
import {
  actionListarProcessos,
  actionBuscarTimeline,
} from "@/features/processos/actions";

// =============================================================================
// IMPORTS - PARTES (CLIENTES)
// =============================================================================
import {
  actionListarClientes,
  actionListarPartesContrarias,
  actionListarTerceiros,
  actionListarRepresentantes,
} from "@/features/partes";

// =============================================================================
// IMPORTS - CONTRATOS
// =============================================================================
import {
  actionCriarContrato,
  actionListarContratos,
  actionAtualizarContrato,
  tipoContratoSchema,
  tipoCobrancaSchema,
  statusContratoSchema,
  papelContratualSchema,
} from "@/features/contratos";

// =============================================================================
// IMPORTS - FINANCEIRO
// =============================================================================
import {
  // Plano de Contas
  actionListarPlanoContas,
  actionCriarConta,
  actionAtualizarConta,
  actionExcluirConta,
  // Lançamentos
  actionListarLancamentos,
  actionCriarLancamento,
  actionAtualizarLancamento,
  actionExcluirLancamento,
  actionConfirmarLancamento,
  actionCancelarLancamento,
  actionEstornarLancamento,
  // DRE
  actionGerarDRE,
  actionObterEvolucaoDRE,
  actionExportarDRECSV,
  // Fluxo de Caixa
  actionObterFluxoCaixaUnificado,
  actionObterFluxoCaixaDiario,
  actionObterFluxoCaixaPorPeriodo,
  actionObterIndicadoresSaude,
  actionObterAlertasCaixa,
  actionObterResumoDashboard,
  actionListarContasBancarias,
  actionListarCentrosCusto,
  // Conciliação
  actionListarTransacoes,
  actionConciliarManual,
  actionObterSugestoes,
  actionDesconciliar,
} from "@/features/financeiro/actions";

// =============================================================================
// IMPORTS - CHAT
// =============================================================================
import {
  actionListarSalas,
  actionEnviarMensagem,
  actionBuscarHistorico,
  actionCriarGrupo,
  actionArquivarSala,
  actionDesarquivarSala,
  actionIniciarChamada,
  actionBuscarHistoricoChamadas,
  actionGerarResumo,
} from "@/features/chat";

// =============================================================================
// IMPORTS - DOCUMENTOS
// =============================================================================
import {
  actionListarDocumentos,
  actionCriarDocumento,
  actionAtualizarDocumento,
  actionDeletarDocumento,
} from "@/features/documentos";

// =============================================================================
// IMPORTS - EXPEDIENTES
// =============================================================================
import {
  actionListarExpedientes,
  actionCriarExpediente,
  actionBaixarExpediente,
} from "@/features/expedientes/actions";

// =============================================================================
// IMPORTS - AUDIÊNCIAS
// =============================================================================
import {
  actionListarAudiencias,
  actionAtualizarStatusAudiencia,
  actionListarTiposAudiencia,
} from "@/features/audiencias/actions";

// =============================================================================
// IMPORTS - BUSCA SEMÂNTICA
// =============================================================================
import { buscaSemantica } from "@/lib/ai/retrieval";

/**
 * Flag para controlar se as ferramentas já foram registradas
 */
let toolsRegistered = false;

/**
 * Registra todas as ferramentas MCP das features do Sinesys
 */
export async function registerAllTools(): Promise<void> {
  if (toolsRegistered) {
    console.log("[MCP Registry] Ferramentas já registradas, pulando...");
    return;
  }

  console.log("[MCP Registry] Iniciando registro de ferramentas...");

  // =========================================================================
  // PROCESSOS (6 tools: 3 originais + 3 novas buscas)
  // =========================================================================

  /**
   * MÓDULO: PROCESSOS
   *
   * Ferramentas disponíveis:
   * - listar_processos: Lista com filtros textuais (número, partes, status, TRT, grau, advogado)
   * - buscar_processos_por_cpf: Busca por CPF do cliente
   * - buscar_processos_por_cnpj: Busca por CNPJ do cliente
   * - buscar_processo_por_numero: Busca por número processual
   *
   * Propriedades de busca suportadas:
   * - Busca textual: número do processo, nome das partes
   * - Filtros: status, TRT, grau, advogadoId
   * - CPF/CNPJ: documentos dos clientes
   */
  registerMcpTool({
    name: "listar_processos",
    description:
      "Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, etc.)",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de processos"),
      offset: z.number().min(0).default(0).describe("Offset para paginação"),
      status: z
        .string()
        .optional()
        .describe('Filtrar por status (ex: "ativo", "arquivado")'),
      trt: z
        .string()
        .optional()
        .describe('Filtrar por TRT (ex: "TRT1", "TRT15")'),
      grau: z
        .enum(["primeiro", "segundo", "superior"])
        .optional()
        .describe("Filtrar por grau"),
      advogadoId: z
        .number()
        .optional()
        .describe("Filtrar por ID do advogado responsável"),
      busca: z
        .string()
        .optional()
        .describe("Busca textual por número do processo ou partes"),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarProcessos(
          args as Parameters<typeof actionListarProcessos>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar processos"
        );
      }
    },
  });

  // FASE 1: Buscas por CPF/CNPJ

  registerMcpTool({
    name: "buscar_processos_por_cpf",
    description: "Busca todos os processos vinculados a um cliente por CPF",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe("CPF do cliente"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .optional()
        .describe("Número máximo de processos"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarProcessosPorCPF } = await import(
          "@/features/processos/actions"
        );
        const { cpf, limite } = args as { cpf: string; limite?: number };
        const result = await actionBuscarProcessosPorCPF(cpf, limite);
        if (!("success" in result) || typeof result.success !== "boolean") {
          return errorResult("Resultado inválido da ação");
        }

        if (!result.success) {
          return actionResultToMcp(result as ActionResult<unknown>);
        }

        const processos = (result.data as Array<{ id?: number }> | undefined) ?? [];
        const enriquecidos = await Promise.all(
          processos.map(async (p) => {
            const processoId = p?.id;
            if (!processoId) {
              return { processo: p, timeline: [] };
            }
            const timelineResult = await actionBuscarTimeline(processoId);
            const timeline =
              timelineResult && (timelineResult as { success?: boolean; data?: unknown }).success
                ? ((timelineResult as { data?: unknown }).data as unknown[])
                : [];
            return { processo: p, timeline };
          })
        );

        return jsonResult({
          message: `Processos encontrados: ${enriquecidos.length}`,
          cpf,
          total: enriquecidos.length,
          processos: enriquecidos,
        });
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar processos por CPF"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_processos_por_cnpj",
    description: "Busca todos os processos vinculados a um cliente por CNPJ",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe("CNPJ do cliente"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .optional()
        .describe("Número máximo de processos"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarProcessosPorCNPJ } = await import(
          "@/features/processos/actions"
        );
        const { cnpj, limite } = args as { cnpj: string; limite?: number };
        const result = await actionBuscarProcessosPorCNPJ(cnpj, limite);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar processos por CNPJ"
        );
      }
    },
  });

  // FASE 2: Buscas por número de processo

  registerMcpTool({
    name: "buscar_processo_por_numero",
    description:
      "Busca processo pelo número processual (formato CNJ ou simplificado)",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z
        .string()
        .min(7)
        .describe("Número do processo (com ou sem formatação)"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarProcessoPorNumero } = await import(
          "@/features/processos/actions"
        );
        const { numeroProcesso } = args as { numeroProcesso: string };
        const result = await actionBuscarProcessoPorNumero(numeroProcesso);
        if (!("success" in result) || typeof result.success !== "boolean") {
          return errorResult("Resultado inválido da ação");
        }

        if (!result.success) {
          return actionResultToMcp(result as ActionResult<unknown>);
        }

        const processo = result.data as { id?: number };
        const processoId = processo?.id;
        const timelineResult = processoId
          ? await actionBuscarTimeline(processoId)
          : null;
        const timeline =
          timelineResult && (timelineResult as { success?: boolean; data?: unknown }).success
            ? ((timelineResult as { data?: unknown }).data as unknown[])
            : [];

        return jsonResult({
          message: "Processo encontrado",
          numeroProcesso,
          processo,
          timeline,
        });
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar processo por número"
        );
      }
    },
  });

  // =========================================================================
  // PARTES - CLIENTES
  // =========================================================================

  /**
   * MÓDULO: PARTES/CLIENTES
   *
   * Ferramentas disponíveis:
   * - listar_clientes: Lista com filtros textuais (nome, CPF/CNPJ, tipo de pessoa)
   * - listar_partes_contrarias: Lista partes contrárias
   * - listar_terceiros: Lista terceiros cadastrados
   * - listar_representantes: Lista representantes (advogados, procuradores)
   * - buscar_cliente_por_cpf: Busca específica por CPF
   * - buscar_cliente_por_cnpj: Busca específica por CNPJ
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome, CPF, CNPJ
   * - Filtros: tipo (física/jurídica)
   */
  registerMcpTool({
    name: "listar_clientes",
    description: "Lista clientes/partes do sistema com filtros",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de clientes"),
      offset: z.number().min(0).default(0).describe("Offset para paginação"),
      busca: z.string().optional().describe("Busca por nome ou CPF/CNPJ"),
      tipo: z
        .enum(["fisica", "juridica"])
        .optional()
        .describe("Tipo de pessoa"),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarClientes(
          args as Parameters<typeof actionListarClientes>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar clientes"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_partes_contrarias",
    description: "Lista partes contrárias cadastradas no sistema",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de resultados"),
      offset: z.number().min(0).default(0).describe("Offset para paginação"),
      busca: z.string().optional().describe("Busca por nome ou documento"),
    }),
    handler: async (_args) => {
      try {
        const result = await actionListarPartesContrarias();
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao listar partes contrárias"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_terceiros",
    description: "Lista terceiros cadastrados no sistema",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de resultados"),
      offset: z.number().min(0).default(0).describe("Offset para paginação"),
    }),
    handler: async (_args) => {
      try {
        const result = await actionListarTerceiros();
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar terceiros"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_representantes",
    description: "Lista representantes (advogados, procuradores) do sistema",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Número máximo de resultados"),
      offset: z.number().min(0).default(0).describe("Offset para paginação"),
      busca: z.string().optional().describe("Busca por nome ou OAB"),
    }),
    handler: async (args) => {
      try {
        const { limite, busca } = args as { limite?: number; busca?: string };
        const result = await actionListarRepresentantes({ limite, busca });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao listar representantes"
        );
      }
    },
  });

  // FASE 1: Buscas por CPF/CNPJ (PRIORIDADE MÁXIMA para agente WhatsApp)

  registerMcpTool({
    name: "buscar_cliente_por_cpf",
    description:
      "Busca cliente por número de CPF (com ou sem formatação) com endereço e processos relacionados",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      cpf: z
        .string()
        .min(11)
        .describe("CPF do cliente (apenas números ou formatado)"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarClientePorCPF } = await import(
          "@/features/partes/actions/clientes-actions"
        );
        const { cpf } = args as { cpf: string };
        const result = await actionBuscarClientePorCPF(cpf);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar cliente por CPF"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_cliente_por_cnpj",
    description:
      "Busca cliente por número de CNPJ (com ou sem formatação) com endereço e processos relacionados",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      cnpj: z
        .string()
        .min(14)
        .describe("CNPJ do cliente (apenas números ou formatado)"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarClientePorCNPJ } = await import(
          "@/features/partes/actions/clientes-actions"
        );
        const { cnpj } = args as { cnpj: string };
        const result = await actionBuscarClientePorCNPJ(cnpj);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar cliente por CNPJ"
        );
      }
    },
  });

  // =========================================================================
  // CONTRATOS
  // =========================================================================

  /**
   * MÓDULO: CONTRATOS
   *
   * Ferramentas disponíveis:
   * - criar_contrato: Cria um novo contrato jurídico
   * - listar_contratos: Lista com filtros (status, tipo, cobrança, cliente, busca textual)
   * - atualizar_contrato: Atualiza contrato existente
   *
   * Propriedades de busca suportadas:
   * - Busca textual: informações do contrato
   * - Filtros: status, tipoContrato, tipoCobranca, clienteId
   */
  registerMcpTool({
    name: "criar_contrato",
    description: "Cria um novo contrato jurídico no sistema",
    feature: "contratos",
    requiresAuth: true,
    schema: z.object({
      tipoContrato: tipoContratoSchema.describe("Tipo do contrato"),
      tipoCobranca: tipoCobrancaSchema.describe("Tipo de cobrança"),
      clienteId: z
        .number()
        .int()
        .positive()
        .describe("ID do cliente contratante"),
      papelClienteNoContrato: papelContratualSchema.describe("Polo processual do cliente"),
      segmentoId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("ID do segmento jurídico"),
      parteContrariaId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("ID da parte contrária"),
      status: statusContratoSchema
        .optional()
        .describe("Status inicial do contrato"),
      observacoes: z.string().max(5000).optional().describe("Observações"),
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
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar contrato"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_contratos",
    description: "Lista contratos do sistema com filtros opcionais",
    feature: "contratos",
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).default(1).describe("Número da página"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de contratos"),
      status: statusContratoSchema.optional().describe("Filtrar por status"),
      tipoContrato: tipoContratoSchema.optional().describe("Filtrar por tipo"),
      tipoCobranca: tipoCobrancaSchema
        .optional()
        .describe("Filtrar por cobrança"),
      clienteId: z.number().optional().describe("Filtrar por cliente"),
      busca: z.string().optional().describe("Busca textual"),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarContratos(
          args as Parameters<typeof actionListarContratos>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar contratos"
        );
      }
    },
  });

  registerMcpTool({
    name: "atualizar_contrato",
    description: "Atualiza um contrato existente",
    feature: "contratos",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID do contrato"),
      tipoContrato: tipoContratoSchema.optional(),
      tipoCobranca: tipoCobrancaSchema.optional(),
      status: statusContratoSchema.optional(),
      observacoes: z.string().max(5000).optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...rest } = args as { id: number } & Record<
          string,
          unknown
        >;
        const formData = new FormData();
        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
        const result = await actionAtualizarContrato(id, null, formData);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao atualizar contrato"
        );
      }
    },
  });

  // =========================================================================
  // FINANCEIRO - PLANO DE CONTAS
  // =========================================================================

  /**
   * MÓDULO: FINANCEIRO - PLANO DE CONTAS
   *
   * Ferramentas disponíveis:
   * - listar_plano_contas: Lista com filtros (tipo, nível, ativo, busca textual)
   * - criar_conta_contabil: Cria nova conta no plano
   * - atualizar_conta_contabil: Atualiza conta existente
   * - excluir_conta_contabil: Exclui conta do plano
   *
   * Propriedades de busca suportadas:
   * - Busca textual: código, nome, descrição
   * - Filtros: tipoConta, nivel (sintética/analítica), ativo
   */
  registerMcpTool({
    name: "listar_plano_contas",
    description: "Lista contas do plano de contas contábil com filtros",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Limite de resultados"),
      pagina: z.number().min(1).default(1).describe("Página"),
      tipoConta: z
        .enum(["ativo", "passivo", "receita", "despesa", "patrimonio_liquido"])
        .optional(),
      nivel: z.enum(["sintetica", "analitica"]).optional(),
      ativo: z.boolean().optional(),
      busca: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarPlanoContas(
          args as Parameters<typeof actionListarPlanoContas>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao listar plano de contas"
        );
      }
    },
  });

  registerMcpTool({
    name: "criar_conta_contabil",
    description: "Cria uma nova conta no plano de contas",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      codigo: z.string().describe("Código da conta (ex: 1.1.1)"),
      nome: z.string().describe("Nome da conta"),
      descricao: z.string().optional(),
      tipoConta: z.enum([
        "ativo",
        "passivo",
        "receita",
        "despesa",
        "patrimonio_liquido",
      ]),
      natureza: z.enum(["devedora", "credora"]),
      nivel: z.enum(["sintetica", "analitica"]),
      contaPaiId: z.number().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarConta(
          args as Parameters<typeof actionCriarConta>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar conta"
        );
      }
    },
  });

  registerMcpTool({
    name: "atualizar_conta_contabil",
    description: "Atualiza uma conta existente",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID da conta"),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      ativo: z.boolean().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await actionAtualizarConta(
          args as Parameters<typeof actionAtualizarConta>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao atualizar conta"
        );
      }
    },
  });

  registerMcpTool({
    name: "excluir_conta_contabil",
    description: "Exclui uma conta do plano de contas",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID da conta"),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionExcluirConta(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao excluir conta"
        );
      }
    },
  });

  // =========================================================================
  // FINANCEIRO - LANÇAMENTOS
  // =========================================================================

  /**
   * MÓDULO: FINANCEIRO - LANÇAMENTOS
   *
   * Ferramentas disponíveis:
   * - listar_lancamentos: Lista com filtros (busca textual, tipo, status, datas, conta)
   * - criar_lancamento: Cria novo lançamento financeiro
   * - atualizar_lancamento: Atualiza lançamento existente
   * - confirmar_lancamento: Confirma lançamento pendente
   * - cancelar_lancamento: Cancela lançamento pendente
   * - estornar_lancamento: Estorna lançamento confirmado
   * - excluir_lancamento: Exclui lançamento
   *
   * Propriedades de busca suportadas:
   * - Busca textual: descrição, observações
   * - Filtros: tipo (receita/despesa), status, dataInicio, dataFim, contaId, processoId
   */
  registerMcpTool({
    name: "listar_lancamentos",
    description: "Lista lançamentos financeiros com filtros e busca textual",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      busca: z
        .string()
        .optional()
        .describe("Busca textual por descrição ou observações"),
      tipo: z.enum(["receita", "despesa"]).optional(),
      status: z
        .enum(["pendente", "confirmado", "cancelado", "estornado"])
        .optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      contaId: z.number().optional(),
      processoId: z.number().optional(),
      limite: z.number().min(1).max(100).default(50),
      pagina: z.number().min(1).default(1),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarLancamentos(
          args as Parameters<typeof actionListarLancamentos>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar lançamentos"
        );
      }
    },
  });

  registerMcpTool({
    name: "criar_lancamento",
    description: "Cria um novo lançamento financeiro",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(["receita", "despesa"]),
      valor: z.number().positive(),
      dataVencimento: z.string(),
      contaId: z.number().optional(),
      descricao: z.string(),
      parceiroId: z.number().optional(),
      processoId: z.number().optional(),
      observacoes: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await actionCriarLancamento(
          args as Parameters<typeof actionCriarLancamento>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar lançamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "atualizar_lancamento",
    description: "Atualiza um lançamento existente",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
      valor: z.number().positive().optional(),
      dataVencimento: z.string().optional(),
      descricao: z.string().optional(),
      observacoes: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...dados } = args as { id: number } & Record<
          string,
          unknown
        >;
        const result = await actionAtualizarLancamento(id, dados);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao atualizar lançamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "confirmar_lancamento",
    description: "Confirma um lançamento pendente",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionConfirmarLancamento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao confirmar lançamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "cancelar_lancamento",
    description: "Cancela um lançamento pendente",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionCancelarLancamento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao cancelar lançamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "estornar_lancamento",
    description: "Estorna um lançamento confirmado",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionEstornarLancamento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao estornar lançamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "excluir_lancamento",
    description: "Exclui um lançamento",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionExcluirLancamento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao excluir lançamento"
        );
      }
    },
  });

  // =========================================================================
  // FINANCEIRO - DRE
  // =========================================================================

  /**
   * MÓDULO: FINANCEIRO - DRE (Demonstração de Resultado do Exercício)
   *
   * Ferramentas disponíveis:
   * - gerar_dre: Gera DRE para período específico
   * - obter_evolucao_dre: Evolução mensal do DRE por ano
   * - exportar_dre_csv: Exporta DRE em formato CSV
   *
   * Propriedades de busca suportadas:
   * - Período: dataInicio, dataFim, ano
   * - Opções: tipo (mensal/trimestral/semestral/anual), incluirComparativo, incluirOrcado
   */
  registerMcpTool({
    name: "gerar_dre",
    description: "Gera Demonstração de Resultado do Exercício",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe("Data inicial (YYYY-MM-DD)"),
      dataFim: z.string().describe("Data final (YYYY-MM-DD)"),
      tipo: z.enum(["mensal", "trimestral", "semestral", "anual"]).optional(),
      incluirComparativo: z.boolean().optional(),
      incluirOrcado: z.boolean().optional(),
    }),
    handler: async (args) => {
      try {
        const result = await actionGerarDRE(
          args as Parameters<typeof actionGerarDRE>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao gerar DRE"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_evolucao_dre",
    description: "Obtém evolução mensal do DRE para um ano",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      ano: z.number().min(2020).max(2100),
    }),
    handler: async (args) => {
      try {
        const { ano } = args as { ano: number };
        const result = await actionObterEvolucaoDRE(ano);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter evolução DRE"
        );
      }
    },
  });

  registerMcpTool({
    name: "exportar_dre_csv",
    description: "Exporta DRE em formato CSV",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }),
    handler: async (args) => {
      try {
        const result = await actionExportarDRECSV(
          args as Parameters<typeof actionExportarDRECSV>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao exportar DRE"
        );
      }
    },
  });

  // =========================================================================
  // FINANCEIRO - FLUXO DE CAIXA
  // =========================================================================

  /**
   * MÓDULO: FINANCEIRO - FLUXO DE CAIXA
   *
   * Ferramentas disponíveis:
   * - obter_fluxo_caixa: Fluxo de caixa unificado com projeções
   * - obter_fluxo_caixa_diario: Fluxo diário de uma conta específica
   * - obter_fluxo_caixa_periodo: Fluxo agrupado por período (dia/semana/mês)
   * - obter_indicadores_saude_financeira: Indicadores de saúde financeira
   * - obter_alertas_caixa: Alertas de fluxo de caixa
   * - obter_resumo_dashboard_financeiro: Resumo para dashboard
   * - listar_contas_bancarias: Lista contas bancárias cadastradas
   * - listar_centros_custo: Lista centros de custo
   *
   * Propriedades de busca suportadas:
   * - Período: dataInicio, dataFim
   * - Filtros: contaBancariaId, centroCustoId, agrupamento, incluirProjetado
   */
  registerMcpTool({
    name: "obter_fluxo_caixa",
    description: "Obtém fluxo de caixa unificado",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
      contaBancariaId: z.number().optional(),
      centroCustoId: z.number().optional(),
      incluirProjetado: z.boolean().default(true),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterFluxoCaixaUnificado(
          args as Parameters<typeof actionObterFluxoCaixaUnificado>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao obter fluxo de caixa"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_fluxo_caixa_diario",
    description: "Obtém fluxo de caixa diário de uma conta",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number(),
      dataInicio: z.string(),
      dataFim: z.string(),
    }),
    handler: async (args) => {
      try {
        const { contaBancariaId, dataInicio, dataFim } = args as {
          contaBancariaId: number;
          dataInicio: string;
          dataFim: string;
        };
        const result = await actionObterFluxoCaixaDiario(
          contaBancariaId,
          dataInicio,
          dataFim
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter fluxo diário"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_fluxo_caixa_periodo",
    description: "Obtém fluxo de caixa agrupado por período",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
      agrupamento: z.enum(["dia", "semana", "mes"]).default("mes"),
      contaBancariaId: z.number().optional(),
    }),
    handler: async (args) => {
      try {
        const { agrupamento, ...filtros } = args as {
          agrupamento: "dia" | "semana" | "mes";
        } & Record<string, unknown>;
        const result = await actionObterFluxoCaixaPorPeriodo(
          filtros as Parameters<typeof actionObterFluxoCaixaPorPeriodo>[0],
          agrupamento
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao obter fluxo por período"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_indicadores_saude_financeira",
    description: "Obtém indicadores de saúde financeira",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterIndicadoresSaude(
          args as Parameters<typeof actionObterIndicadoresSaude>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter indicadores"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_alertas_caixa",
    description: "Obtém alertas de fluxo de caixa",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterAlertasCaixa(
          args as Parameters<typeof actionObterAlertasCaixa>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter alertas"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_resumo_dashboard_financeiro",
    description: "Obtém resumo para dashboard financeiro",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }),
    handler: async (args) => {
      try {
        const result = await actionObterResumoDashboard(
          args as Parameters<typeof actionObterResumoDashboard>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter resumo"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_contas_bancarias",
    description: "Lista contas bancárias cadastradas",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarContasBancarias();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar contas"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_centros_custo",
    description: "Lista centros de custo cadastrados",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionListarCentrosCusto();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar centros"
        );
      }
    },
  });

  // =========================================================================
  // FINANCEIRO - CONCILIAÇÃO
  // =========================================================================

  /**
   * MÓDULO: FINANCEIRO - CONCILIAÇÃO BANCÁRIA
   *
   * Ferramentas disponíveis:
   * - listar_transacoes_bancarias: Lista transações para conciliação
   * - conciliar_transacao: Concilia transação com lançamento
   * - obter_sugestoes_conciliacao: Sugestões de lançamentos para conciliar
   * - desconciliar_transacao: Remove conciliação de transação
   *
   * Propriedades de busca suportadas:
   * - Filtros: contaBancariaId, status (pendente/conciliado/ignorado), dataInicio, dataFim
   */
  registerMcpTool({
    name: "listar_transacoes_bancarias",
    description: "Lista transações bancárias para conciliação",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      contaBancariaId: z.number().optional(),
      status: z.enum(["pendente", "conciliado", "ignorado"]).optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      limite: z.number().min(1).max(100).default(50),
      pagina: z.number().min(1).default(1),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTransacoes(
          args as Parameters<typeof actionListarTransacoes>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar transações"
        );
      }
    },
  });

  registerMcpTool({
    name: "conciliar_transacao",
    description: "Concilia uma transação com um lançamento",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number(),
      lancamentoId: z.number(),
    }),
    handler: async (args) => {
      try {
        const result = await actionConciliarManual(
          args as Parameters<typeof actionConciliarManual>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao conciliar"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_sugestoes_conciliacao",
    description: "Obtém sugestões de lançamentos para conciliar",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { transacaoId } = args as { transacaoId: number };
        const result = await actionObterSugestoes(transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter sugestões"
        );
      }
    },
  });

  registerMcpTool({
    name: "desconciliar_transacao",
    description: "Remove conciliação de uma transação",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { transacaoId } = args as { transacaoId: number };
        const result = await actionDesconciliar(transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao desconciliar"
        );
      }
    },
  });

  // =========================================================================
  // CHAT
  // =========================================================================

  /**
   * MÓDULO: CHAT
   *
   * Ferramentas disponíveis:
   * - listar_salas_chat: Lista salas de chat (direto, grupo, documento)
   * - enviar_mensagem_chat: Envia mensagem em uma sala
   * - buscar_historico_chat: Busca histórico de mensagens
   * - criar_grupo_chat: Cria novo grupo de chat
   * - arquivar_sala_chat: Arquiva sala de chat
   * - desarquivar_sala_chat: Desarquiva sala de chat
   * - iniciar_chamada: Inicia chamada de áudio/vídeo
   * - buscar_historico_chamadas: Histórico de chamadas de uma sala
   * - gerar_resumo_chamada: Gera resumo de chamada usando IA
   *
   * Propriedades de busca suportadas:
   * - Filtros: tipo (direto/grupo/documento), incluirArquivadas
   */
  registerMcpTool({
    name: "listar_salas_chat",
    description: "Lista salas de chat do usuário",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(["direto", "grupo", "documento"]).optional(),
      limite: z.number().min(1).max(100).default(50),
      incluirArquivadas: z.boolean().default(false),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarSalas(
          args as Parameters<typeof actionListarSalas>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar salas"
        );
      }
    },
  });

  registerMcpTool({
    name: "enviar_mensagem_chat",
    description: "Envia mensagem em uma sala de chat",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
      conteudo: z.string(),
      tipo: z
        .enum(["texto", "arquivo", "imagem", "audio", "video"])
        .default("texto"),
    }),
    handler: async (args) => {
      try {
        const { salaId, conteudo, tipo } = args as {
          salaId: number;
          conteudo: string;
          tipo?: string;
        };
        const result = await actionEnviarMensagem(
          salaId,
          conteudo,
          tipo || "texto"
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao enviar mensagem"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_historico_chat",
    description: "Busca histórico de mensagens de uma sala",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
      limite: z.number().min(1).max(100).default(50),
      antesDe: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const { salaId, limite, antesDe } = args as {
          salaId: number;
          limite?: number;
          antesDe?: string;
        };
        const result = await actionBuscarHistorico(salaId, limite, antesDe);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar histórico"
        );
      }
    },
  });

  registerMcpTool({
    name: "criar_grupo_chat",
    description: "Cria um novo grupo de chat",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      nome: z.string(),
      membrosIds: z.array(z.number()).min(1),
    }),
    handler: async (args) => {
      try {
        const { nome, membrosIds } = args as {
          nome: string;
          membrosIds: number[];
        };
        const result = await actionCriarGrupo(nome, membrosIds);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar grupo"
        );
      }
    },
  });

  registerMcpTool({
    name: "arquivar_sala_chat",
    description: "Arquiva uma sala de chat",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { salaId } = args as { salaId: number };
        const result = await actionArquivarSala(salaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao arquivar sala"
        );
      }
    },
  });

  registerMcpTool({
    name: "desarquivar_sala_chat",
    description: "Desarquiva uma sala de chat",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { salaId } = args as { salaId: number };
        const result = await actionDesarquivarSala(salaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao desarquivar sala"
        );
      }
    },
  });

  registerMcpTool({
    name: "iniciar_chamada",
    description: "Inicia uma chamada de áudio/vídeo",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
      tipo: z.enum(["audio", "video"]),
    }),
    handler: async (args) => {
      try {
        const { salaId, tipo } = args as {
          salaId: number;
          tipo: "audio" | "video";
        };
        const { TipoChamada } = await import("@/features/chat/domain");
        const tipoChamada =
          tipo === "audio" ? TipoChamada.Audio : TipoChamada.Video;
        const result = await actionIniciarChamada(salaId, tipoChamada);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao iniciar chamada"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_historico_chamadas",
    description: "Busca histórico de chamadas de uma sala",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      salaId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { salaId } = args as { salaId: number };
        const result = await actionBuscarHistoricoChamadas(salaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar histórico"
        );
      }
    },
  });

  registerMcpTool({
    name: "gerar_resumo_chamada",
    description: "Gera resumo de chamada usando IA",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      chamadaId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { chamadaId } = args as { chamadaId: number };
        const result = await actionGerarResumo(chamadaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao gerar resumo"
        );
      }
    },
  });

  // =========================================================================
  // DOCUMENTOS
  // =========================================================================

  /**
   * MÓDULO: DOCUMENTOS
   *
   * Ferramentas disponíveis:
   * - listar_documentos: Lista com filtros (pasta, busca textual, tags)
   * - criar_documento: Cria novo documento
   * - atualizar_documento: Atualiza documento existente
   * - deletar_documento: Move documento para lixeira
   *
   * Propriedades de busca suportadas:
   * - Busca textual: título, conteúdo
   * - Filtros: pastaId, tags
   */
  registerMcpTool({
    name: "listar_documentos",
    description: "Lista documentos do sistema",
    feature: "documentos",
    requiresAuth: true,
    schema: z.object({
      pastaId: z.number().optional(),
      busca: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limite: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarDocumentos(
          args as Parameters<typeof actionListarDocumentos>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar documentos"
        );
      }
    },
  });

  registerMcpTool({
    name: "criar_documento",
    description: "Cria um novo documento",
    feature: "documentos",
    requiresAuth: true,
    schema: z.object({
      titulo: z.string(),
      conteudo: z.string().optional(),
      pastaId: z.number().optional(),
      descricao: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async (args) => {
      try {
        const formData = new FormData();
        const typedArgs = args as Record<string, unknown>;
        for (const [key, value] of Object.entries(typedArgs)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value) || typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        }
        const result = await actionCriarDocumento(formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar documento"
        );
      }
    },
  });

  registerMcpTool({
    name: "atualizar_documento",
    description: "Atualiza um documento existente",
    feature: "documentos",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
      titulo: z.string().optional(),
      conteudo: z.string().optional(),
      descricao: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...rest } = args as { id: number } & Record<
          string,
          unknown
        >;
        const formData = new FormData();
        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value) || typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        }
        const result = await actionAtualizarDocumento(id, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao atualizar documento"
        );
      }
    },
  });

  registerMcpTool({
    name: "deletar_documento",
    description: "Move documento para lixeira",
    feature: "documentos",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionDeletarDocumento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao deletar documento"
        );
      }
    },
  });

  // =========================================================================
  // EXPEDIENTES
  // =========================================================================

  /**
   * MÓDULO: EXPEDIENTES
   *
   * Ferramentas disponíveis:
   * - listar_expedientes: Lista com filtros (status, datas, processo, advogado)
   * - criar_expediente: Cria novo expediente/prazo
   * - baixar_expediente: Realiza baixa de expediente
   *
   * Propriedades de busca suportadas:
   * - Filtros: status (pendente/cumprido/vencido), dataInicio, dataFim, processoId, advogadoId
   */
  registerMcpTool({
    name: "listar_expedientes",
    description: "Lista expedientes/prazos processuais",
    feature: "expedientes",
    requiresAuth: true,
    schema: z.object({
      status: z.enum(["pendente", "cumprido", "vencido"]).optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      processoId: z.number().optional(),
      advogadoId: z.number().optional(),
      limite: z.number().min(1).max(100).default(50),
      pagina: z.number().min(1).default(1),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarExpedientes(
          args as Parameters<typeof actionListarExpedientes>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar expedientes"
        );
      }
    },
  });

  registerMcpTool({
    name: "criar_expediente",
    description: "Cria um novo expediente/prazo",
    feature: "expedientes",
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string(),
      trt: z.string(),
      grau: z.string(),
      dataPrazoLegalParte: z.string(),
      origem: z.string().optional(),
      advogadoId: z.number().optional(),
      processoId: z.number().optional(),
      observacoes: z.string().optional(),
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
        const result = await actionCriarExpediente(null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao criar expediente"
        );
      }
    },
  });

  registerMcpTool({
    name: "baixar_expediente",
    description: "Realiza baixa de um expediente",
    feature: "expedientes",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
      protocoloId: z.string().optional(),
      justificativaBaixa: z.string().optional(),
      dataBaixa: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const { id, ...rest } = args as { id: number } & Record<
          string,
          unknown
        >;
        const formData = new FormData();
        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
        const result = await actionBaixarExpediente(id, null, formData);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao baixar expediente"
        );
      }
    },
  });

  // =========================================================================
  // AUDIÊNCIAS
  // =========================================================================

  /**
   * MÓDULO: AUDIÊNCIAS
   *
   * Ferramentas disponíveis:
   * - listar_audiencias: Lista com filtros (status, datas, processo, responsável)
   * - atualizar_status_audiencia: Atualiza status de audiência
   * - listar_tipos_audiencia: Lista tipos de audiência disponíveis
   * - buscar_audiencias_por_cpf: Busca por CPF do cliente
   * - buscar_audiencias_por_cnpj: Busca por CNPJ do cliente
   * - buscar_audiencias_por_numero_processo: Busca por número processual
   *
   * Propriedades de busca suportadas:
   * - Filtros: status, dataInicio, dataFim, processoId, responsavelId
   * - CPF/CNPJ: documentos dos clientes
   */
  registerMcpTool({
    name: "listar_audiencias",
    description: "Lista audiências com filtros",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      status: z
        .enum(["agendada", "realizada", "cancelada", "adiada"])
        .optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      processoId: z.number().optional(),
      responsavelId: z.number().optional(),
      limite: z.number().min(1).max(100).default(50),
      pagina: z.number().min(1).default(1),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarAudiencias(
          args as Parameters<typeof actionListarAudiencias>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar audiências"
        );
      }
    },
  });

  registerMcpTool({
    name: "atualizar_status_audiencia",
    description: "Atualiza status de uma audiência",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
      status: z.enum(["agendada", "realizada", "cancelada", "adiada"]),
      statusDescricao: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const { id, status, statusDescricao } = args as {
          id: number;
          status: string;
          statusDescricao?: string;
        };
        const result = await actionAtualizarStatusAudiencia(
          id,
          status as Parameters<typeof actionAtualizarStatusAudiencia>[1],
          statusDescricao
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao atualizar status"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_tipos_audiencia",
    description: "Lista tipos de audiência disponíveis",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      trt: z.string().optional(),
      grau: z.string().optional(),
      limite: z.number().min(1).max(1000).default(200),
    }),
    handler: async (args) => {
      try {
        const result = await actionListarTiposAudiencia(
          args as Parameters<typeof actionListarTiposAudiencia>[0]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar tipos"
        );
      }
    },
  });

  // FASE 1: Buscas por CPF/CNPJ

  registerMcpTool({
    name: "buscar_audiencias_por_cpf",
    description:
      "Busca todas as audiências de processos vinculados a um cliente por CPF",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe("CPF do cliente"),
      status: z
        .enum(["agendada", "realizada", "cancelada", "adiada"])
        .optional()
        .describe("Filtrar por status da audiência"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAudienciasPorCPF } = await import(
          "@/features/audiencias/actions"
        );
        const { cpf, status } = args as { cpf: string; status?: string };
        const result = await actionBuscarAudienciasPorCPF(
          cpf,
          status as Parameters<typeof actionBuscarAudienciasPorCPF>[1]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar audiências por CPF"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_audiencias_por_cnpj",
    description:
      "Busca todas as audiências de processos vinculados a um cliente por CNPJ",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe("CNPJ do cliente"),
      status: z
        .enum(["agendada", "realizada", "cancelada", "adiada"])
        .optional()
        .describe("Filtrar por status da audiência"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAudienciasPorCNPJ } = await import(
          "@/features/audiencias/actions"
        );
        const { cnpj, status } = args as { cnpj: string; status?: string };
        const result = await actionBuscarAudienciasPorCNPJ(
          cnpj,
          status as Parameters<typeof actionBuscarAudienciasPorCNPJ>[1]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar audiências por CNPJ"
        );
      }
    },
  });

  // FASE 2: Buscas por número de processo

  registerMcpTool({
    name: "buscar_audiencias_por_numero_processo",
    description:
      "Busca audiências de um processo específico pelo número processual",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(7).describe("Número do processo"),
      status: z
        .enum(["agendada", "realizada", "cancelada", "adiada"])
        .optional()
        .describe("Filtrar por status da audiência"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAudienciasPorNumeroProcesso } = await import(
          "@/features/audiencias/actions"
        );
        const { numeroProcesso, status } = args as {
          numeroProcesso: string;
          status?: string;
        };
        const result = await actionBuscarAudienciasPorNumeroProcesso(
          numeroProcesso,
          status as Parameters<
            typeof actionBuscarAudienciasPorNumeroProcesso
          >[1]
        );
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar audiências por número de processo"
        );
      }
    },
  });

  // =========================================================================
  // ACORDOS E CONDENAÇÕES
  // =========================================================================

  /**
   * MÓDULO: ACORDOS E CONDENAÇÕES
   *
   * Ferramentas disponíveis:
   * - buscar_acordos_por_cpf: Busca acordos e condenações por CPF do cliente
   * - buscar_acordos_por_cnpj: Busca acordos e condenações por CNPJ do cliente
   * - buscar_acordos_por_numero_processo: Busca por número processual
   *
   * Propriedades de busca suportadas:
   * - CPF/CNPJ: documentos dos clientes
   * - Filtros: tipo (acordo/condenacao), status (ativo/quitado/cancelado)
   */
  registerMcpTool({
    name: "buscar_acordos_por_cpf",
    description:
      "Busca acordos e condenações de processos vinculados a um cliente por CPF",
    feature: "obrigacoes",
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe("CPF do cliente"),
      tipo: z
        .enum(["acordo", "condenacao"])
        .optional()
        .describe("Filtrar por tipo de obrigação"),
      status: z
        .enum(["ativo", "quitado", "cancelado"])
        .optional()
        .describe("Filtrar por status"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAcordosPorCPF } = await import(
          "@/features/obrigacoes/actions/acordos"
        );
        const { cpf, tipo, status } = args as {
          cpf: string;
          tipo?: string;
          status?: string;
        };
        const result = await actionBuscarAcordosPorCPF(
          cpf,
          tipo as Parameters<typeof actionBuscarAcordosPorCPF>[1],
          status as Parameters<typeof actionBuscarAcordosPorCPF>[2]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar acordos por CPF"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_acordos_por_cnpj",
    description:
      "Busca acordos e condenações de processos vinculados a um cliente por CNPJ",
    feature: "obrigacoes",
    requiresAuth: true,
    schema: z.object({
      cnpj: z.string().min(14).describe("CNPJ do cliente"),
      tipo: z
        .enum(["acordo", "condenacao"])
        .optional()
        .describe("Filtrar por tipo de obrigação"),
      status: z
        .enum(["ativo", "quitado", "cancelado"])
        .optional()
        .describe("Filtrar por status"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAcordosPorCNPJ } = await import(
          "@/features/obrigacoes/actions/acordos"
        );
        const { cnpj, tipo, status } = args as {
          cnpj: string;
          tipo?: string;
          status?: string;
        };
        const result = await actionBuscarAcordosPorCNPJ(
          cnpj,
          tipo as Parameters<typeof actionBuscarAcordosPorCNPJ>[1],
          status as Parameters<typeof actionBuscarAcordosPorCNPJ>[2]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar acordos por CNPJ"
        );
      }
    },
  });

  // FASE 2: Buscas por número de processo

  registerMcpTool({
    name: "buscar_acordos_por_numero_processo",
    description:
      "Busca acordos e condenações de um processo específico pelo número processual",
    feature: "obrigacoes",
    requiresAuth: true,
    schema: z.object({
      numeroProcesso: z.string().min(7).describe("Número do processo"),
      tipo: z
        .enum(["acordo", "condenacao"])
        .optional()
        .describe("Filtrar por tipo de obrigação"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarAcordosPorNumeroProcesso } = await import(
          "@/features/obrigacoes/actions/acordos"
        );
        const { numeroProcesso, tipo } = args as {
          numeroProcesso: string;
          tipo?: string;
        };
        const result = await actionBuscarAcordosPorNumeroProcesso(
          numeroProcesso,
          tipo as Parameters<typeof actionBuscarAcordosPorNumeroProcesso>[1]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error
            ? error.message
            : "Erro ao buscar acordos por número de processo"
        );
      }
    },
  });

  // =========================================================================
  // BUSCA SEMÂNTICA (AI/RAG)
  // =========================================================================

  /**
   * MÓDULO: BUSCA SEMÂNTICA
   *
   * Ferramentas disponíveis:
   * - busca_semantica: Busca semântica no conhecimento do sistema usando IA
   *
   * Propriedades de busca suportadas:
   * - Query: texto da busca
   * - Filtros: tipo (processo/documento/audiencia/expediente/cliente/lancamento/outro)
   * - Limite: número de resultados
   */
  registerMcpTool({
    name: "busca_semantica",
    description: "Busca semântica no conhecimento do sistema usando IA",
    feature: "ai",
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe("Texto da busca"),
      tipo: z
        .enum([
          "processo",
          "documento",
          "audiencia",
          "expediente",
          "cliente",
          "lancamento",
          "outro",
        ])
        .optional(),
      limite: z.number().min(1).max(50).default(10),
    }),
    handler: async (args) => {
      try {
        const { query, tipo, limite } = args as {
          query: string;
          tipo?: string;
          limite?: number;
        };

        const filtros = tipo ? { tipo } : {};
        const resultados = await buscaSemantica(query, {
          limite: limite || 10,
          filtros: filtros as {
            tipo?:
            | "processo"
            | "documento"
            | "audiencia"
            | "expediente"
            | "cliente"
            | "lancamento"
            | "outro";
          },
        });

        if (resultados.length === 0) {
          return textResult("Nenhum resultado encontrado para a busca.");
        }

        const formatted = resultados
          .map(
            (r, i) =>
              `${i + 1}. [${r.metadata.tipo.toUpperCase()}] (${(
                r.similaridade * 100
              ).toFixed(1)}% similar)\n   ${r.texto.substring(0, 200)}${r.texto.length > 200 ? "..." : ""
              }`
          )
          .join("\n\n");

        return textResult(
          `Encontrados ${resultados.length} resultados:\n\n${formatted}`
        );
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro na busca semântica"
        );
      }
    },
  });

  // =========================================================================
  // CAPTURA (COMUNICAÇÕES CNJ)
  // =========================================================================

  /**
   * MÓDULO: CAPTURA (COMUNICAÇÕES CNJ)
   *
   * Ferramentas disponíveis:
   * - listar_comunicacoes_capturadas: Lista comunicações capturadas com filtros
   * - listar_tribunais_disponiveis: Lista tribunais disponíveis para captura
   * - capturar_timeline_processo: Captura timeline de um processo específico
   *
   * Propriedades de busca suportadas:
   * - Filtros: tribunal, status, dataInicio, dataFim, processoId
   */
  registerMcpTool({
    name: "listar_comunicacoes_capturadas",
    description: "Lista comunicações CNJ capturadas do sistema",
    feature: "captura",
    requiresAuth: true,
    schema: z.object({
      tribunal: z
        .string()
        .optional()
        .describe("Filtrar por tribunal (ex: TRT1, TRT15)"),
      status: z
        .enum(["pendente", "processada", "erro"])
        .optional()
        .describe("Filtrar por status"),
      dataInicio: z
        .string()
        .optional()
        .describe("Data inicial (YYYY-MM-DD)"),
      dataFim: z
        .string()
        .optional()
        .describe("Data final (YYYY-MM-DD)"),
      processoId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Filtrar por ID do processo"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Número máximo de comunicações"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarComunicacoesCapturadas } = await import(
          "@/features/captura/actions/comunica-cnj-actions"
        );
        const result = await actionListarComunicacoesCapturadas(
          args as Parameters<typeof actionListarComunicacoesCapturadas>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar comunicações"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_tribunais_disponiveis",
    description: "Lista tribunais disponíveis para captura de dados",
    feature: "captura",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { actionListarTribunaisDisponiveis } = await import(
          "@/features/captura/actions/comunica-cnj-actions"
        );
        const result = await actionListarTribunaisDisponiveis();
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar tribunais"
        );
      }
    },
  });

  registerMcpTool({
    name: "capturar_timeline_processo",
    description: "Recaptura a timeline/movimentações de um processo específico do acervo",
    feature: "captura",
    requiresAuth: true,
    schema: z.object({
      processoId: z
        .number()
        .int()
        .positive()
        .describe("ID do processo (acervo ID)"),
    }),
    handler: async (args) => {
      try {
        const { actionRecapturarTimeline } = await import(
          "@/features/acervo/actions/acervo-actions"
        );
        const { processoId } = args as { processoId: number };
        const result = await actionRecapturarTimeline(processoId);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao capturar timeline"
        );
      }
    },
  });

  // =========================================================================
  // RH (RECURSOS HUMANOS)
  // =========================================================================

  /**
   * MÓDULO: RH (RECURSOS HUMANOS)
   *
   * Ferramentas disponíveis:
   * - listar_folhas_pagamento: Lista folhas de pagamento com filtros (período, funcionário, status)
   * - listar_salarios: Lista salários cadastrados
   * - buscar_salarios_por_usuario: Busca salários de um usuário específico
   *
   * Propriedades de busca suportadas:
   * - Filtros: período, usuarioId, status, vigente
   */
  registerMcpTool({
    name: "listar_folhas_pagamento",
    description: "Lista folhas de pagamento com filtros de período e status",
    feature: "rh",
    requiresAuth: true,
    schema: z.object({
      mesReferencia: z
        .number()
        .min(1)
        .max(12)
        .optional()
        .describe("Mês de referência (1-12)"),
      anoReferencia: z
        .number()
        .min(2020)
        .max(2100)
        .optional()
        .describe("Ano de referência"),
      status: z
        .enum(["rascunho", "aprovada", "paga", "cancelada"])
        .optional()
        .describe("Filtrar por status"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de folhas"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarFolhasPagamento } = await import(
          "@/features/rh/actions/folhas-pagamento-actions"
        );
        const result = await actionListarFolhasPagamento(
          args as Parameters<typeof actionListarFolhasPagamento>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar folhas de pagamento"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_salarios",
    description: "Lista salários cadastrados no sistema",
    feature: "rh",
    requiresAuth: true,
    schema: z.object({
      usuarioId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Filtrar por ID do usuário"),
      vigente: z
        .boolean()
        .optional()
        .describe("Apenas salários vigentes"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Número máximo de salários"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarSalarios } = await import(
          "@/features/rh/actions/salarios-actions"
        );
        const result = await actionListarSalarios(
          args as Parameters<typeof actionListarSalarios>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar salários"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_salarios_por_usuario",
    description: "Busca histórico de salários de um usuário específico",
    feature: "rh",
    requiresAuth: true,
    schema: z.object({
      usuarioId: z
        .number()
        .int()
        .positive()
        .describe("ID do usuário"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarSalariosDoUsuario } = await import(
          "@/features/rh/actions/salarios-actions"
        );
        const { usuarioId } = args as { usuarioId: number };
        const result = await actionBuscarSalariosDoUsuario(usuarioId);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar salários do usuário"
        );
      }
    },
  });

  // =========================================================================
  // TIPOS DE EXPEDIENTES
  // =========================================================================

  /**
   * MÓDULO: TIPOS DE EXPEDIENTES
   *
   * Ferramentas disponíveis:
   * - listar_tipos_expedientes: Lista com filtros (busca por nome, categoria)
   * - buscar_tipo_expediente_por_nome: Busca específica por nome
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome, descrição
   * - Filtros: categoria, ativo
   */
  registerMcpTool({
    name: "listar_tipos_expedientes",
    description: "Lista tipos de expedientes cadastrados no sistema",
    feature: "tipos-expedientes",
    requiresAuth: true,
    schema: z.object({
      busca: z
        .string()
        .optional()
        .describe("Busca por nome ou descrição"),
      categoria: z
        .string()
        .optional()
        .describe("Filtrar por categoria"),
      ativo: z
        .boolean()
        .optional()
        .describe("Filtrar por status ativo/inativo"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Número máximo de tipos"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarTiposExpedientes } = await import(
          "@/features/tipos-expedientes/actions/tipos-expedientes-actions"
        );
        const result = await actionListarTiposExpedientes(
          args as Parameters<typeof actionListarTiposExpedientes>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar tipos de expedientes"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_tipo_expediente_por_nome",
    description: "Busca tipo de expediente específico por nome",
    feature: "tipos-expedientes",
    requiresAuth: true,
    schema: z.object({
      nome: z
        .string()
        .min(2)
        .describe("Nome do tipo de expediente"),
    }),
    handler: async (args) => {
      try {
        const { actionListarTiposExpedientes } = await import(
          "@/features/tipos-expedientes/actions/tipos-expedientes-actions"
        );
        const { nome } = args as { nome: string };
        const result = await actionListarTiposExpedientes({
          busca: nome,
          limite: 10,
        });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar tipo de expediente"
        );
      }
    },
  });

  // =========================================================================
  // ADVOGADOS
  // =========================================================================

  /**
   * MÓDULO: ADVOGADOS
   *
   * Ferramentas disponíveis:
   * - listar_advogados: Lista com filtros (busca por nome/OAB, UF, status)
   * - buscar_advogado_por_oab: Busca específica por número OAB e UF
   * - listar_credenciais_advogado: Lista credenciais PJE/TRT de um advogado
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome, OAB
   * - Filtros: UF, status
   */
  registerMcpTool({
    name: "listar_advogados",
    description: "Lista advogados do sistema com filtros de busca",
    feature: "advogados",
    requiresAuth: true,
    schema: z.object({
      busca: z
        .string()
        .optional()
        .describe("Busca por nome ou número OAB"),
      uf: z
        .string()
        .length(2)
        .optional()
        .describe("Filtrar por UF da OAB"),
      status: z
        .enum(["ativo", "inativo"])
        .optional()
        .describe("Filtrar por status"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Número máximo de advogados"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarAdvogados } = await import(
          "@/features/advogados/actions/advogados-actions"
        );
        const result = await actionListarAdvogados(
          args as Parameters<typeof actionListarAdvogados>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar advogados"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_advogado_por_oab",
    description: "Busca advogado específico por número OAB e UF",
    feature: "advogados",
    requiresAuth: true,
    schema: z.object({
      oab: z
        .string()
        .min(3)
        .describe("Número da OAB"),
      uf: z
        .string()
        .length(2)
        .describe("UF da OAB (ex: SP, RJ, MG)"),
    }),
    handler: async (args) => {
      try {
        const { actionListarAdvogados } = await import(
          "@/features/advogados/actions/advogados-actions"
        );
        const { oab, uf } = args as { oab: string; uf: string };
        const result = await actionListarAdvogados({
          oab,
          uf_oab: uf,
          limite: 1,
        });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar advogado por OAB"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_credenciais_advogado",
    description: "Lista credenciais PJE/TRT de um advogado",
    feature: "advogados",
    requiresAuth: true,
    schema: z.object({
      advogadoId: z
        .number()
        .int()
        .positive()
        .describe("ID do advogado"),
    }),
    handler: async (args) => {
      try {
        const { actionListarCredenciais } = await import(
          "@/features/advogados/actions/credenciais-actions"
        );
        const { advogadoId } = args as { advogadoId: number };
        // Pass as single object parameter (ListarCredenciaisParams)
        const result = await actionListarCredenciais({ advogado_id: advogadoId });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar credenciais"
        );
      }
    },
  });

  // =========================================================================
  // USUÁRIOS
  // =========================================================================

  /**
   * MÓDULO: USUÁRIOS
   *
   * Ferramentas disponíveis:
   * - listar_usuarios: Lista com filtros (busca por nome/email/CPF, cargo, status)
   * - buscar_usuario_por_email: Busca específica por email
   * - buscar_usuario_por_cpf: Busca específica por CPF
   * - listar_permissoes_usuario: Lista permissões de um usuário
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome, email, CPF
   * - Filtros: cargo, status (ativo/inativo)
   */
  registerMcpTool({
    name: "listar_usuarios",
    description: "Lista usuários do sistema com filtros de busca",
    feature: "usuarios",
    requiresAuth: true,
    schema: z.object({
      busca: z
        .string()
        .optional()
        .describe("Busca por nome, email ou CPF"),
      cargo: z
        .string()
        .optional()
        .describe("Filtrar por cargo"),
      status: z
        .enum(["ativo", "inativo"])
        .optional()
        .describe("Filtrar por status"),
      limite: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Número máximo de usuários"),
      offset: z
        .number()
        .min(0)
        .default(0)
        .describe("Offset para paginação"),
    }),
    handler: async (args) => {
      try {
        const { actionListarUsuarios } = await import(
          "@/features/usuarios/actions/usuarios-actions"
        );
        const result = await actionListarUsuarios(
          args as Parameters<typeof actionListarUsuarios>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar usuários"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_usuario_por_email",
    description: "Busca usuário específico por endereço de email",
    feature: "usuarios",
    requiresAuth: true,
    schema: z.object({
      email: z
        .string()
        .email()
        .describe("Email do usuário"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarPorEmail } = await import(
          "@/features/usuarios/actions/usuarios-actions"
        );
        const { email } = args as { email: string };
        const result = await actionBuscarPorEmail(email);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar usuário por email"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_usuario_por_cpf",
    description: "Busca usuário específico por CPF",
    feature: "usuarios",
    requiresAuth: true,
    schema: z.object({
      cpf: z
        .string()
        .min(11)
        .describe("CPF do usuário (com ou sem formatação)"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarPorCpf } = await import(
          "@/features/usuarios/actions/usuarios-actions"
        );
        const { cpf } = args as { cpf: string };
        const result = await actionBuscarPorCpf(cpf);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar usuário por CPF"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_permissoes_usuario",
    description: "Lista todas as permissões de um usuário",
    feature: "usuarios",
    requiresAuth: true,
    schema: z.object({
      usuarioId: z
        .number()
        .int()
        .positive()
        .describe("ID do usuário"),
    }),
    handler: async (args) => {
      try {
        const { actionListarPermissoes } = await import(
          "@/features/usuarios/actions/permissoes-actions"
        );
        const { usuarioId } = args as { usuarioId: number };
        const result = await actionListarPermissoes(usuarioId);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar permissões"
        );
      }
    },
  });

  // =========================================================================
  // ACERVO
  // =========================================================================

  /**
   * MÓDULO: ACERVO
   *
   * Ferramentas disponíveis:
   * - listar_acervo: Lista processos do acervo com filtros textuais
   * - buscar_processos_acervo_por_cpf: Busca processos do cliente por CPF
   *
   * Propriedades de busca suportadas:
   * - Busca textual: número do processo, partes
   * - Filtros: TRT, grau, origem, responsável
   * - CPF: documento do cliente
   */
  registerMcpTool({
    name: "listar_acervo",
    description: "Lista processos do acervo com filtros de busca textual",
    feature: "acervo",
    requiresAuth: true,
    schema: z.object({
      busca: z
        .string()
        .optional()
        .describe("Busca por número do processo ou nome das partes"),
      trt: z.string().optional().describe("Filtrar por TRT (ex: TRT1, TRT15)"),
      grau: z
        .enum(["primeiro_grau", "segundo_grau", "tribunal_superior"])
        .optional()
        .describe("Filtrar por grau"),
      origem: z
        .enum(["acervo_geral", "arquivado"])
        .optional()
        .describe("Filtrar por origem"),
      limite: z.number().min(1).max(100).default(20).describe("Limite de resultados"),
      pagina: z.number().min(1).default(1).describe("Número da página"),
    }),
    handler: async (args) => {
      try {
        const { actionListarAcervoPaginado } = await import(
          "@/features/acervo/actions/acervo-actions"
        );
        const result = await actionListarAcervoPaginado(
          args as Parameters<typeof actionListarAcervoPaginado>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar acervo"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_processos_acervo_por_cpf",
    description: "Busca processos do acervo vinculados a um cliente por CPF",
    feature: "acervo",
    requiresAuth: true,
    schema: z.object({
      cpf: z.string().min(11).describe("CPF do cliente (apenas números)"),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarProcessosClientePorCpf } = await import(
          "@/features/acervo/actions/acervo-actions"
        );
        const { cpf } = args as { cpf: string };
        const result = await actionBuscarProcessosClientePorCpf(cpf);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar processos por CPF"
        );
      }
    },
  });

  // =========================================================================
  // DASHBOARD / MÉTRICAS
  // =========================================================================

  /**
   * MÓDULO: DASHBOARD / MÉTRICAS
   *
   * Ferramentas disponíveis:
   * - obter_dashboard: Obtém dados da dashboard do usuário atual
   * - obter_metricas_escritorio: Obtém métricas globais (admin only)
   *
   * Nota: Métricas administrativas requerem super admin
   */
  registerMcpTool({
    name: "obter_dashboard",
    description: "Obtém dados da dashboard do usuário autenticado",
    feature: "dashboard",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { actionObterDashboard } = await import(
          "@/features/dashboard/actions/dashboard-actions"
        );
        const result = await actionObterDashboard();
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter dashboard"
        );
      }
    },
  });

  registerMcpTool({
    name: "obter_metricas_escritorio",
    description: "Obtém métricas globais do escritório (apenas super admin)",
    feature: "dashboard",
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { actionObterMetricas } = await import(
          "@/features/dashboard/actions/metricas-actions"
        );
        const result = await actionObterMetricas();
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao obter métricas"
        );
      }
    },
  });

  // =========================================================================
  // ASSINATURA DIGITAL
  // =========================================================================

  /**
   * MÓDULO: ASSINATURA DIGITAL
   *
   * Ferramentas disponíveis:
   * - listar_segmentos_assinatura: Lista segmentos de assinatura digital
   * - listar_templates_assinatura: Lista templates de assinatura digital
   * - listar_formularios_assinatura: Lista formulários de assinatura digital
   *
   * Propriedades de busca suportadas:
   * - Filtros: segmento, tipo template, ativo
   */
  registerMcpTool({
    name: "listar_segmentos_assinatura",
    description: "Lista segmentos de assinatura digital",
    feature: "assinatura-digital",
    requiresAuth: true,
    schema: z.object({
      ativo: z.boolean().optional().describe("Filtrar por status ativo/inativo"),
    }),
    handler: async (args) => {
      try {
        const { listarSegmentosAction } = await import(
          "@/features/assinatura-digital/actions"
        );
        const { ativo } = args as { ativo?: boolean };
        const result = await listarSegmentosAction({ ativo });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar segmentos"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_templates_assinatura",
    description: "Lista templates de assinatura digital com filtros",
    feature: "assinatura-digital",
    requiresAuth: true,
    schema: z.object({
      segmento_id: z.number().optional().describe("ID do segmento para filtrar"),
      tipo_template: z
        .enum(["pdf", "markdown"])
        .optional()
        .describe("Tipo de template"),
      ativo: z.boolean().optional().describe("Filtrar por status ativo/inativo"),
    }),
    handler: async (args) => {
      try {
        const { listarTemplatesAction } = await import(
          "@/features/assinatura-digital/actions"
        );
        const filtros = args as {
          segmento_id?: number;
          tipo_template?: "pdf" | "markdown";
          ativo?: boolean;
        };
        const result = await listarTemplatesAction(filtros);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar templates"
        );
      }
    },
  });

  registerMcpTool({
    name: "listar_formularios_assinatura",
    description: "Lista formulários de assinatura digital com filtros",
    feature: "assinatura-digital",
    requiresAuth: true,
    schema: z.object({
      segmento_id: z.number().optional().describe("ID do segmento para filtrar"),
      ativo: z.boolean().optional().describe("Filtrar por status ativo/inativo"),
    }),
    handler: async (args) => {
      try {
        const { listarFormulariosAction } = await import(
          "@/features/assinatura-digital/actions"
        );
        const filtros = args as { segmento_id?: number; ativo?: boolean };
        const result = await listarFormulariosAction(filtros);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar formulários"
        );
      }
    },
  });

  // =========================================================================
  // CARGOS
  // =========================================================================

  /**
   * MÓDULO: CARGOS
   *
   * Ferramentas disponíveis:
   * - listar_cargos: Lista cargos com busca textual
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome do cargo
   * - Filtros: ativo
   */
  registerMcpTool({
    name: "listar_cargos",
    description: "Lista cargos do sistema com busca textual",
    feature: "cargos",
    requiresAuth: true,
    schema: z.object({
      busca: z.string().optional().describe("Busca por nome do cargo"),
      ativo: z.boolean().optional().describe("Filtrar por status ativo/inativo"),
      limite: z.number().min(1).max(100).default(50).describe("Limite de resultados"),
      pagina: z.number().min(1).default(1).describe("Número da página"),
    }),
    handler: async (args) => {
      try {
        const { actionListarCargos } = await import(
          "@/features/cargos/actions/cargos-actions"
        );
        const result = await actionListarCargos(
          args as Parameters<typeof actionListarCargos>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar cargos"
        );
      }
    },
  });

  // =========================================================================
  // ASSISTENTES
  // =========================================================================

  /**
   * MÓDULO: ASSISTENTES
   *
   * Ferramentas disponíveis:
   * - listar_assistentes: Lista assistentes virtuais com busca textual
   *
   * Propriedades de busca suportadas:
   * - Busca textual: nome do assistente
   */
  registerMcpTool({
    name: "listar_assistentes",
    description: "Lista assistentes virtuais do sistema com busca textual",
    feature: "assistentes",
    requiresAuth: true,
    schema: z.object({
      busca: z.string().optional().describe("Busca por nome do assistente"),
    }),
    handler: async (args) => {
      try {
        const { actionListarAssistentes } = await import(
          "@/features/assistentes/actions/assistentes-actions"
        );
        const { busca } = args as { busca?: string };
        const result = await actionListarAssistentes({ busca });
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar assistentes"
        );
      }
    },
  });

  // =========================================================================
  // REPASSES
  // =========================================================================

  /**
   * MÓDULO: REPASSES
   *
   * Ferramentas disponíveis:
   * - listar_repasses_pendentes: Lista repasses pendentes com filtros
   *
   * Propriedades de busca suportadas:
   * - Filtros: status, processo, período, valor
   */
  registerMcpTool({
    name: "listar_repasses_pendentes",
    description: "Lista repasses pendentes com filtros",
    feature: "repasses",
    requiresAuth: true,
    schema: z.object({
      statusRepasse: z
        .enum(["pendente", "iniciado", "finalizado", "cancelado"])
        .optional()
        .describe("Filtrar por status do repasse"),
      processoId: z.number().optional().describe("ID do processo"),
      dataInicio: z
        .string()
        .optional()
        .describe("Data início do período (YYYY-MM-DD)"),
      dataFim: z.string().optional().describe("Data fim do período (YYYY-MM-DD)"),
      valorMinimo: z.number().optional().describe("Valor mínimo"),
      valorMaximo: z.number().optional().describe("Valor máximo"),
    }),
    handler: async (args) => {
      try {
        const { actionListarRepassesPendentes } = await import(
          "@/features/obrigacoes/actions/repasses"
        );
        const result = await actionListarRepassesPendentes(
          args as Parameters<typeof actionListarRepassesPendentes>[0]
        );
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao listar repasses"
        );
      }
    },
  });

  // =========================================================================
  // FERRAMENTAS UTILITÁRIAS
  // =========================================================================

  registerMcpTool({
    name: "status_sistema",
    description: "Retorna o status atual do sistema Sinesys",
    feature: "sistema",
    requiresAuth: false,
    schema: z.object({}),
    handler: async () => {
      const manager = getMcpServerManager();
      const tools = manager.listTools();

      return jsonResult({
        sistema: "Sinesys",
        versao: "2.0.0",
        status: "online",
        ferramentas_disponiveis: tools.length,
        features: [...new Set(tools.map((t) => t.feature))],
      });
    },
  });

  registerMcpTool({
    name: "listar_ferramentas",
    description: "Lista todas as ferramentas MCP disponíveis",
    feature: "sistema",
    requiresAuth: false,
    schema: z.object({
      feature: z.string().optional().describe("Filtrar por feature"),
    }),
    handler: async (args) => {
      const manager = getMcpServerManager();
      let tools = manager.listTools();

      const { feature } = args as { feature?: string };
      if (feature) {
        tools = tools.filter((t) => t.feature === feature);
      }

      const grouped: Record<string, { name: string; description: string }[]> =
        {};
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
  console.log(
    `[MCP Registry] ${getMcpServerManager().listTools().length
    } ferramentas registradas`
  );
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
