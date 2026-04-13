/**
 * Registro de Ferramentas MCP - Admin
 *
 * Tools disponíveis:
 * - admin_obter_metricas_db: Retorna métricas do banco de dados (cache hit, queries lentas, disk I/O)
 * - admin_avaliar_upgrade: Avalia necessidade de upgrade de compute com base em métricas
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';
import { actionResultToMcp } from '../utils';
import type { ActionResult } from '@/lib/safe-action';

/**
 * Registra ferramentas MCP do módulo Admin
 */
export async function registerAdminTools(): Promise<void> {
  const { actionObterMetricasDB } = await import('@/app/(authenticated)/admin/actions/metricas-actions');
  const { avaliarNecessidadeUpgrade } = await import('@/app/(authenticated)/admin/services/upgrade-advisor');

  /**
   * Obtém métricas de performance do banco de dados Supabase
   */
  registerMcpTool({
    name: 'admin_obter_metricas_db',
    description: 'Retorna métricas de performance do banco de dados: cache hit rate, queries lentas, tabelas com sequential scan, bloat e disk I/O',
    feature: 'admin',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await actionObterMetricasDB();
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao obter métricas do banco de dados');
      }
    },
  });

  /**
   * Avalia necessidade de upgrade de compute com base em métricas de performance
   */
  registerMcpTool({
    name: 'admin_avaliar_upgrade',
    description: 'Avalia se é necessário fazer upgrade do compute Supabase com base no cache hit rate, disk I/O e tier atual. Retorna recomendação com motivos e estimativa de custo.',
    feature: 'admin',
    requiresAuth: true,
    schema: z.object({
      cacheHitRate: z.number().min(0).max(100).describe('Cache hit rate médio em percentual (0-100)'),
      diskIOBudgetPercent: z.number().min(0).max(100).describe('Porcentagem do Disk IO Budget consumido (0-100)'),
      computeAtual: z.string().min(1).describe('Tier de compute atual (ex: micro, small, medium, large)'),
    }),
    handler: async (args) => {
      try {
        const { cacheHitRate, diskIOBudgetPercent, computeAtual } = args as {
          cacheHitRate: number;
          diskIOBudgetPercent: number;
          computeAtual: string;
        };

        const recomendacao = avaliarNecessidadeUpgrade(cacheHitRate, diskIOBudgetPercent, computeAtual);

        return jsonResult({
          message: recomendacao.should_upgrade ? 'Upgrade recomendado' : 'Sem necessidade de upgrade no momento',
          recomendacao,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao avaliar necessidade de upgrade');
      }
    },
  });
}
