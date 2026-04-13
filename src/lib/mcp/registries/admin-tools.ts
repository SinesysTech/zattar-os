/**
 * Registro de Ferramentas MCP - Admin
 *
 * Tools disponíveis:
 * - avaliar_upgrade_compute: Avalia necessidade de upgrade de compute com base em métricas
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Admin
 */
export async function registerAdminTools(): Promise<void> {
  const { avaliarNecessidadeUpgrade } = await import('@/app/(authenticated)/admin/services/upgrade-advisor');

  /**
   * Avalia necessidade de upgrade de compute com base em métricas de performance
   */
  registerMcpTool({
    name: 'avaliar_upgrade_compute',
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
