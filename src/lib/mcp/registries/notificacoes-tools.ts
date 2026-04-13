/**
 * Registro de Ferramentas MCP - Notificações
 *
 * Tools disponíveis:
 * - listar_notificacoes: Lista notificações do usuário com paginação e filtro por lida/não lida
 * - contar_notificacoes_nao_lidas: Conta o total de notificações não lidas do usuário autenticado
 * - marcar_notificacao_lida: Marca uma notificação específica como lida
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Notificações
 */
export async function registerNotificacoesTools(): Promise<void> {
  const {
    listarNotificacoes,
    contarNotificacoesNaoLidas,
    marcarNotificacaoComoLida,
  } = await import('@/app/(authenticated)/notificacoes/service');

  /**
   * Lista notificações do usuário autenticado com paginação e filtro por status de leitura
   */
  registerMcpTool({
    name: 'listar_notificacoes',
    description: 'Lista notificações do usuário autenticado com paginação. Permite filtrar por notificações lidas ou não lidas.',
    feature: 'notificacoes',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).optional().default(1).describe('Número da página (padrão: 1)'),
      limite: z.number().min(1).max(100).optional().default(20).describe('Número máximo de notificações por página (padrão: 20)'),
      lida: z.boolean().optional().describe('Filtrar por status de leitura: true = lidas, false = não lidas, omitir = todas'),
    }),
    handler: async (args) => {
      try {
        const { pagina, limite, lida } = args as {
          pagina?: number;
          limite?: number;
          lida?: boolean;
        };

        const result = await listarNotificacoes({ pagina: pagina ?? 1, limite: limite ?? 20, lida });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao listar notificações');
        }

        return jsonResult({
          message: `${result.data.total} notificação(ões) encontrada(s)`,
          ...result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar notificações');
      }
    },
  });

  /**
   * Conta o total de notificações não lidas do usuário autenticado
   */
  registerMcpTool({
    name: 'contar_notificacoes_nao_lidas',
    description: 'Conta o total de notificações não lidas do usuário autenticado. Utiliza cache de 30 segundos.',
    feature: 'notificacoes',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const result = await contarNotificacoesNaoLidas();

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao contar notificações não lidas');
        }

        return jsonResult({
          message: `${result.data.total} notificação(ões) não lida(s)`,
          contador: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao contar notificações não lidas');
      }
    },
  });

  /**
   * Marca uma notificação específica como lida
   */
  registerMcpTool({
    name: 'marcar_notificacao_lida',
    description: 'Marca uma notificação específica como lida pelo seu ID',
    feature: 'notificacoes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().int().positive().describe('ID da notificação a ser marcada como lida'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };

        const result = await marcarNotificacaoComoLida(id);

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao marcar notificação como lida');
        }

        return jsonResult({
          message: 'Notificação marcada como lida com sucesso',
          notificacao: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao marcar notificação como lida');
      }
    },
  });
}
