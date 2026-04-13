/**
 * Registro de Ferramentas MCP - Tipos de Expedientes
 *
 * Tools disponíveis:
 * - listar_tipos_expedientes: Lista tipos de expedientes com paginação e filtros
 * - criar_tipo_expediente: Cria novo tipo de expediente
 * - deletar_tipo_expediente: Remove tipo de expediente pelo ID
 *
 * NOTA: O service de tipos-expedientes lança erros diretamente em vez de retornar
 * Result<T>. Todas as chamadas são envolvidas em try/catch.
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Tipos de Expedientes
 */
export async function registerTiposExpedientesTools(): Promise<void> {
  const { listar, criar, deletar } = await import('@/app/(authenticated)/tipos-expedientes/service');

  /**
   * Lista tipos de expedientes com paginação e filtro textual
   */
  registerMcpTool({
    name: 'listar_tipos_expedientes',
    description: 'Lista os tipos de expedientes cadastrados no sistema com suporte a paginação e busca textual',
    feature: 'tipos-expedientes',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().min(1).optional().describe('Número da página (padrão: 1)'),
      limite: z.number().min(1).max(100).optional().describe('Número máximo de itens por página (padrão: 20)'),
      busca: z.string().optional().describe('Filtro textual pelo nome do tipo de expediente'),
    }),
    handler: async (args) => {
      try {
        const { pagina, limite, busca } = args as {
          pagina?: number;
          limite?: number;
          busca?: string;
        };

        const resultado = await listar({ pagina, limite, busca });

        return jsonResult({
          message: `${resultado.meta.total} tipo(s) de expediente encontrado(s)`,
          ...resultado,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao listar tipos de expedientes');
      }
    },
  });

  /**
   * Cria novo tipo de expediente
   */
  registerMcpTool({
    name: 'criar_tipo_expediente',
    description: 'Cria um novo tipo de expediente no sistema. O nome deve ser único.',
    feature: 'tipos-expedientes',
    requiresAuth: true,
    schema: z.object({
      tipoExpediente: z.string().min(1).describe('Nome do tipo de expediente a ser criado'),
    }),
    handler: async (args) => {
      try {
        const { tipoExpediente } = args as { tipoExpediente: string };

        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();

        if (!user) {
          return errorResult('Usuário não autenticado');
        }

        const criado = await criar({ tipoExpediente }, user.id);

        return jsonResult({
          message: 'Tipo de expediente criado com sucesso',
          tipoExpediente: criado,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao criar tipo de expediente');
      }
    },
  });

  /**
   * Remove tipo de expediente pelo ID
   */
  registerMcpTool({
    name: 'deletar_tipo_expediente',
    description: 'Remove um tipo de expediente pelo ID. Lança erro se o tipo estiver em uso por expedientes existentes.',
    feature: 'tipos-expedientes',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do tipo de expediente a ser removido'),
    }),
    handler: async (args) => {
      try {
        const { id } = args as { id: number };

        await deletar(id);

        return jsonResult({
          message: 'Tipo de expediente removido com sucesso',
          id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro ao deletar tipo de expediente');
      }
    },
  });
}
