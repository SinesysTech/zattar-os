/**
 * Registro de Ferramentas MCP - Calendar
 *
 * Tools disponíveis:
 * - listar_eventos_calendar: Lista eventos unificados do calendário por período e fontes
 * - obter_briefing_calendar: Obtém o briefing de eventos para uma data específica
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
    name: 'listar_eventos_calendar',
    description: 'Lista eventos unificados do calendário (audiências, expedientes, obrigações, perícias, agenda) em um período. Suporta filtro por fontes específicas.',
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

  /**
   * Obtém o briefing de eventos para uma data específica (todos os eventos do dia)
   */
  registerMcpTool({
    name: 'obter_briefing_calendar',
    description: 'Obtém o briefing completo de eventos para uma data específica, incluindo audiências, expedientes com prazo, obrigações, perícias e compromissos de agenda.',
    feature: 'calendar',
    requiresAuth: true,
    schema: z.object({
      data: z.string().describe('Data para o briefing no formato ISO (ex: 2026-04-13T00:00:00.000Z)'),
    }),
    handler: async (args) => {
      try {
        const { data } = args as { data: string };

        const startAt = new Date(data);
        startAt.setUTCHours(0, 0, 0, 0);

        const endAt = new Date(data);
        endAt.setUTCHours(23, 59, 59, 999);

        const events = await listarEventosPorPeriodo({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        });

        const porFonte = events.reduce<Record<string, typeof events>>((acc, evento) => {
          const fonte = evento.source;
          if (!acc[fonte]) acc[fonte] = [];
          acc[fonte].push(evento);
          return acc;
        }, {});

        return jsonResult({
          message: `Briefing do dia ${data}: ${events.length} evento(s)`,
          data,
          totalEventos: events.length,
          resumoPorFonte: Object.fromEntries(
            Object.entries(porFonte).map(([fonte, evts]) => [fonte, evts.length])
          ),
          eventos: porFonte,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter briefing do calendário');
      }
    },
  });
}
