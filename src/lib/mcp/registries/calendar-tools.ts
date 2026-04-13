/**
 * Registro de Ferramentas MCP - Calendar
 *
 * Tools disponíveis:
 * - listar_eventos_calendario_unificado: Agrega eventos de 5 fontes em um período
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Calendar
 */
export async function registerCalendarTools(): Promise<void> {
  const { listarEventosPorPeriodo } = await import('@/app/(authenticated)/calendar/service');

  /**
   * Lista eventos unificados do calendário em um período, com filtro opcional por fonte
   */
  registerMcpTool({
    name: 'listar_eventos_calendario_unificado',
    description: 'Agrega eventos de 5 fontes (audiencias, expedientes, obrigacoes, pericias, agenda) em um período',
    feature: 'calendar',
    requiresAuth: true,
    schema: z.object({
      dataInicio: z.string().describe('Data de início do período no formato ISO (ex: 2026-04-01T00:00:00.000Z)'),
      dataFim: z.string().describe('Data de fim do período no formato ISO (ex: 2026-04-30T23:59:59.999Z)'),
      fontes: z
        .array(z.enum(['audiencias', 'expedientes', 'obrigacoes', 'pericias', 'agenda']))
        .optional()
        .describe('Fontes de eventos a incluir. Padrão: todas (audiencias, expedientes, obrigacoes, pericias, agenda)'),
    }),
    handler: async (args) => {
      try {
        const { dataInicio, dataFim, fontes } = args as {
          dataInicio: string;
          dataFim: string;
          fontes?: ('audiencias' | 'expedientes' | 'obrigacoes' | 'pericias' | 'agenda')[];
        };

        const events = await listarEventosPorPeriodo({
          startAt: dataInicio,
          endAt: dataFim,
          sources: fontes,
        });

        return jsonResult({
          message: `${events.length} evento(s) encontrado(s)`,
          total: events.length,
          periodo: { dataInicio, dataFim },
          eventos: events,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar eventos do calendário');
      }
    },
  });
}
