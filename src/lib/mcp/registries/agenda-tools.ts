/**
 * Registro de Ferramentas MCP - Agenda
 *
 * Tools disponíveis:
 * - criar_evento_agenda: Cria um novo evento na agenda
 * - atualizar_evento_agenda: Atualiza um evento existente na agenda
 * - excluir_evento_agenda: Exclui um evento da agenda
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Agenda
 */
export async function registerAgendaTools(): Promise<void> {
  const { criarEvento, atualizarEvento, deletarEvento } = await import(
    '@/app/(authenticated)/agenda/service'
  );

  /**
   * Cria um novo evento na agenda
   */
  registerMcpTool({
    name: 'criar_evento_agenda',
    description: 'Cria um novo evento na agenda do escritório',
    feature: 'agenda',
    requiresAuth: true,
    schema: z.object({
      titulo: z.string().describe('Título do evento'),
      dataInicio: z.string().describe('Data e hora de início (ISO 8601, ex: 2025-04-15T09:00:00)'),
      dataFim: z.string().describe('Data e hora de fim (ISO 8601, ex: 2025-04-15T10:00:00)'),
      diaInteiro: z.boolean().optional().default(false).describe('Indica se o evento ocupa o dia inteiro'),
      local: z.string().optional().describe('Local do evento'),
      descricao: z.string().optional().describe('Descrição ou observações do evento'),
      cor: z.string().optional().describe('Cor do evento para exibição no calendário'),
      responsavelId: z.number().optional().describe('ID do usuário responsável pelo evento'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await criarEvento(
          {
            titulo: args.titulo,
            dataInicio: args.dataInicio,
            dataFim: args.dataFim,
            diaInteiro: args.diaInteiro ?? false,
            local: args.local,
            descricao: args.descricao,
            cor: args.cor ?? '',
            responsavelId: args.responsavelId,
          },
          user.id,
        );

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao criar evento');
        }

        return jsonResult({
          message: 'Evento criado com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao criar evento');
      }
    },
  });

  /**
   * Atualiza um evento existente na agenda
   */
  registerMcpTool({
    name: 'atualizar_evento_agenda',
    description: 'Atualiza os dados de um evento existente na agenda',
    feature: 'agenda',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do evento a ser atualizado'),
      titulo: z.string().optional().describe('Novo título do evento'),
      dataInicio: z.string().optional().describe('Nova data e hora de início (ISO 8601)'),
      dataFim: z.string().optional().describe('Nova data e hora de fim (ISO 8601)'),
      diaInteiro: z.boolean().optional().describe('Indica se o evento ocupa o dia inteiro'),
      local: z.string().optional().describe('Novo local do evento'),
      descricao: z.string().optional().describe('Nova descrição do evento'),
      cor: z.string().optional().describe('Nova cor do evento'),
    }),
    handler: async (args) => {
      try {
        const result = await atualizarEvento({
          id: args.id,
          titulo: args.titulo,
          dataInicio: args.dataInicio,
          dataFim: args.dataFim,
          diaInteiro: args.diaInteiro,
          local: args.local,
          descricao: args.descricao,
          cor: args.cor,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao atualizar evento');
        }

        return jsonResult({
          message: 'Evento atualizado com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao atualizar evento');
      }
    },
  });

  /**
   * Exclui um evento da agenda
   */
  registerMcpTool({
    name: 'excluir_evento_agenda',
    description: 'Exclui um evento da agenda permanentemente',
    feature: 'agenda',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do evento a ser excluído'),
    }),
    handler: async (args) => {
      try {
        const result = await deletarEvento(args.id);

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao excluir evento');
        }

        return jsonResult({
          message: 'Evento excluído com sucesso',
          id: args.id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao excluir evento');
      }
    },
  });
}
