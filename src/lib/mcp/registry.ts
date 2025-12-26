/**
 * Registry de ferramentas MCP do Sinesys
 *
 * Registra todas as Server Actions como ferramentas MCP
 * Cobertura expandida: ~45% das 314 Server Actions disponíveis (~75 ferramentas)
 *
 * Última atualização: 2025-12-26
 * Fase 1 (PRIORIDADE MÁXIMA): Buscas por CPF/CNPJ implementadas (8 tools)
 * Fase 2: Buscas por número de processo implementadas (3 tools)
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
  actionBuscarProcesso,
  actionBuscarTimeline,
} from "@/features/processos/actions";

// =============================================================================
// IMPORTS - PARTES (CLIENTES)
// =============================================================================
import {
  actionListarClientes,
  actionBuscarCliente,
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
  actionBuscarContrato,
  actionAtualizarContrato,
  tipoContratoSchema,
  tipoCobrancaSchema,
  statusContratoSchema,
  poloProcessualSchema,
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
  actionBuscarLancamento,
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
  actionBuscarTransacao,
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
} from "@/features/chat/actions/chat-actions";

import {
  actionIniciarChamada,
  actionBuscarHistoricoChamadas,
  actionBuscarChamadaPorId,
  actionGerarResumo,
} from "@/features/chat/actions/chamadas-actions";

// =============================================================================
// IMPORTS - DOCUMENTOS
// =============================================================================
import {
  actionListarDocumentos,
  actionBuscarDocumento,
  actionCriarDocumento,
  actionAtualizarDocumento,
  actionDeletarDocumento,
} from "@/features/documentos/actions/documentos-actions";

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
  actionBuscarAudienciaPorId,
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

  registerMcpTool({
    name: "buscar_processo",
    description:
      "Busca um processo específico por ID, retornando todos os detalhes",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID do processo"),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarProcesso(id);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar processo"
        );
      }
    },
  });

  registerMcpTool({
    name: "buscar_timeline_processo",
    description: "Busca a timeline/movimentações de um processo",
    feature: "processos",
    requiresAuth: true,
    schema: z.object({
      processoId: z.number().int().positive().describe("ID do processo"),
    }),
    handler: async (args) => {
      try {
        const { processoId } = args as { processoId: number };
        const result = await actionBuscarTimeline(processoId);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar timeline"
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
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
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
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
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
  // PARTES - CLIENTES (7 tools: 5 originais + 2 novas buscas por CPF/CNPJ)
  // =========================================================================

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
    name: "buscar_cliente",
    description: "Busca um cliente específico por ID",
    feature: "partes",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID do cliente"),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarCliente(id);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar cliente"
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
  // CONTRATOS (4 tools)
  // =========================================================================

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
      poloCliente: poloProcessualSchema.describe("Polo processual do cliente"),
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
    name: "buscar_contrato",
    description: "Busca um contrato específico por ID",
    feature: "contratos",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe("ID do contrato"),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarContrato(id);
        if ("success" in result && typeof result.success === "boolean") {
          return actionResultToMcp(result as ActionResult<unknown>);
        }
        return errorResult("Resultado inválido da ação");
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar contrato"
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
  // FINANCEIRO - PLANO DE CONTAS (4 tools)
  // =========================================================================

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
  // FINANCEIRO - LANÇAMENTOS (8 tools)
  // =========================================================================

  registerMcpTool({
    name: "listar_lancamentos",
    description: "Lista lançamentos financeiros com filtros",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      tipo: z.enum(["receita", "despesa"]).optional(),
      status: z
        .enum(["pendente", "confirmado", "cancelado", "estornado"])
        .optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      contaId: z.number().optional(),
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
    name: "buscar_lancamento",
    description: "Busca um lançamento por ID",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarLancamento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar lançamento"
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
  // FINANCEIRO - DRE (3 tools)
  // =========================================================================

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
  // FINANCEIRO - FLUXO DE CAIXA (8 tools)
  // =========================================================================

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
  // FINANCEIRO - CONCILIAÇÃO (5 tools)
  // =========================================================================

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

  registerMcpTool({
    name: "buscar_transacao_bancaria",
    description: "Busca uma transação bancária por ID",
    feature: "financeiro",
    requiresAuth: true,
    schema: z.object({
      transacaoId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { transacaoId } = args as { transacaoId: number };
        const result = await actionBuscarTransacao(transacaoId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar transação"
        );
      }
    },
  });

  // =========================================================================
  // CHAT (10 tools)
  // =========================================================================

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
    name: "buscar_chamada",
    description: "Busca detalhes de uma chamada",
    feature: "chat",
    requiresAuth: true,
    schema: z.object({
      chamadaId: z.number(),
    }),
    handler: async (args) => {
      try {
        const { chamadaId } = args as { chamadaId: number };
        const result = await actionBuscarChamadaPorId(chamadaId);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar chamada"
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
  // DOCUMENTOS (5 tools)
  // =========================================================================

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
    name: "buscar_documento",
    description: "Busca um documento por ID",
    feature: "documentos",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarDocumento(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar documento"
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
  // EXPEDIENTES (3 tools)
  // =========================================================================

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
  // AUDIÊNCIAS (7 tools: 4 originais + 3 novas buscas)
  // =========================================================================

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
    name: "buscar_audiencia",
    description: "Busca uma audiência por ID",
    feature: "audiencias",
    requiresAuth: true,
    schema: z.object({
      id: z.number(),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };
        const result = await actionBuscarAudienciaPorId(id);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : "Erro ao buscar audiência"
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
  // ACORDOS E CONDENAÇÕES (6 tools)
  // =========================================================================

  // FASE 1: Buscas por CPF/CNPJ

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
              ).toFixed(1)}% similar)\n   ${r.texto.substring(0, 200)}${
                r.texto.length > 200 ? "..." : ""
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
    `[MCP Registry] ${
      getMcpServerManager().listTools().length
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
