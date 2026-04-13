/**
 * Registro de Ferramentas MCP - Entrevistas Trabalhistas
 *
 * Tools disponíveis:
 * - et_iniciar_entrevista: Inicia nova entrevista trabalhista vinculada a um contrato
 * - et_salvar_modulo: Salva respostas de um módulo da entrevista com merge JSONB
 * - et_finalizar_entrevista: Finaliza entrevista após validação dos dados obrigatórios
 * - et_reabrir_entrevista: Reabre entrevista previamente concluída para edição
 * - et_buscar_entrevista: Busca entrevista por ID com todos os dados e respostas
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo de Entrevistas Trabalhistas
 */
export async function registerEntrevistasTrabalhistas(): Promise<void> {
  const {
    iniciarEntrevista,
    salvarModulo,
    finalizarEntrevista,
    reabrirEntrevista,
    buscarEntrevista,
  } = await import('@/app/(authenticated)/entrevistas-trabalhistas/service');

  // ---------------------------------------------------------------------------
  // INICIAR ENTREVISTA
  // ---------------------------------------------------------------------------

  /**
   * Inicia nova entrevista trabalhista vinculada a um contrato existente
   */
  registerMcpTool({
    name: 'et_iniciar_entrevista',
    description:
      'Inicia nova entrevista trabalhista vinculada a um contrato. Define a trilha de perguntas conforme o tipo de litígio (trabalhista_classico, gig_economy ou pejotizacao)',
    feature: 'entrevistas-trabalhistas',
    requiresAuth: true,
    schema: z.object({
      contratoId: z.number().describe('ID do contrato ao qual a entrevista será vinculada'),
      tipoLitigio: z
        .string()
        .optional()
        .describe(
          'Tipo do litígio: trabalhista_classico, gig_economy ou pejotizacao. Determina a trilha de módulos',
        ),
    }),
    handler: async (args) => {
      try {
        const result = await iniciarEntrevista(args);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao iniciar entrevista');
        return jsonResult({ message: 'Entrevista iniciada com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // SALVAR MÓDULO
  // ---------------------------------------------------------------------------

  /**
   * Salva (merge JSONB) as respostas de um módulo da entrevista
   */
  registerMcpTool({
    name: 'et_salvar_modulo',
    description:
      'Salva as respostas de um módulo específico da entrevista (vinculo, jornada, ruptura, etc.) com merge no JSONB existente. Opcionalmente avança para o próximo módulo',
    feature: 'entrevistas-trabalhistas',
    requiresAuth: true,
    schema: z.object({
      entrevistaId: z.number().describe('ID da entrevista'),
      modulo: z
        .string()
        .describe(
          'Nome do módulo: vinculo, jornada, saude_ambiente, ruptura (Trilha A) | ' +
            'controle_algoritmico, dependencia_economica, condicoes_trabalho_gig, desligamento_plataforma (Trilha B) | ' +
            'contrato_pj, subordinacao_real, exclusividade_pessoalidade, fraude_verbas, consolidacao_final (Trilha C)',
        ),
      respostas: z
        .record(z.unknown())
        .describe('Objeto com as respostas do módulo (campos variam por módulo)'),
      avancar: z
        .boolean()
        .optional()
        .default(false)
        .describe('Se true, avança automaticamente para o próximo módulo da trilha'),
      notaOperador: z
        .string()
        .optional()
        .describe('Nota interna do operador sobre as respostas deste módulo'),
    }),
    handler: async (args) => {
      try {
        const result = await salvarModulo(
          args.entrevistaId,
          args.modulo as never,
          args.respostas,
          args.avancar,
          args.notaOperador,
        );
        if (!result.success) return errorResult(result.error?.message || 'Erro ao salvar módulo');
        return jsonResult({ message: 'Módulo salvo com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // FINALIZAR ENTREVISTA
  // ---------------------------------------------------------------------------

  /**
   * Finaliza entrevista após validar os campos obrigatórios por trilha
   */
  registerMcpTool({
    name: 'et_finalizar_entrevista',
    description:
      'Finaliza entrevista trabalhista após validação dos campos obrigatórios da trilha. Requer que os módulos essenciais estejam preenchidos',
    feature: 'entrevistas-trabalhistas',
    requiresAuth: true,
    schema: z.object({
      entrevistaId: z.number().describe('ID da entrevista a finalizar'),
      testemunhasMapeadas: z
        .boolean()
        .describe('Indica se as testemunhas foram identificadas e mapeadas na entrevista'),
    }),
    handler: async (args) => {
      try {
        const result = await finalizarEntrevista(args.entrevistaId, args.testemunhasMapeadas);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao finalizar entrevista');
        return jsonResult({ message: 'Entrevista finalizada com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // REABRIR ENTREVISTA
  // ---------------------------------------------------------------------------

  /**
   * Reabre entrevista concluída para edição
   */
  registerMcpTool({
    name: 'et_reabrir_entrevista',
    description:
      'Reabre uma entrevista trabalhista previamente concluída, retornando-a ao status em_andamento para permitir edições',
    feature: 'entrevistas-trabalhistas',
    requiresAuth: true,
    schema: z.object({
      entrevistaId: z.number().describe('ID da entrevista a reabrir'),
    }),
    handler: async (args) => {
      try {
        const result = await reabrirEntrevista(args.entrevistaId);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao reabrir entrevista');
        return jsonResult({ message: 'Entrevista reaberta com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // BUSCAR ENTREVISTA
  // ---------------------------------------------------------------------------

  /**
   * Busca entrevista por ID com todos os dados, respostas e módulo atual
   */
  registerMcpTool({
    name: 'et_buscar_entrevista',
    description:
      'Busca entrevista trabalhista por ID retornando dados completos: status, trilha, módulo atual e todas as respostas salvas por módulo',
    feature: 'entrevistas-trabalhistas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da entrevista'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarEntrevista(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao buscar entrevista');
        if (!result.data) return errorResult('Entrevista não encontrada');
        return jsonResult({ message: 'Entrevista encontrada', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });
}
