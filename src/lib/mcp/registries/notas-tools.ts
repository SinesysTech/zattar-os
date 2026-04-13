/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Registro de Ferramentas MCP - Notas
 *
 * Tools disponíveis:
 * - listar_notas: Lista notas do usuário autenticado com filtro por arquivamento
 * - criar_nota: Cria uma nova nota para o usuário autenticado
 * - atualizar_nota: Atualiza o conteúdo ou etiquetas de uma nota existente
 * - arquivar_nota: Arquiva ou desarquiva uma nota
 * - excluir_nota: Exclui uma nota permanentemente
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo Notas
 */
export async function registerNotasTools(): Promise<void> {
  const {
    listarDadosNotas,
    criarNota,
    atualizarNota,
    arquivarNota,
    excluirNota,
  } = await import('@/app/(authenticated)/notas/service');

  /**
   * Lista notas do usuário autenticado
   */
  registerMcpTool({
    name: 'listar_notas',
    description: 'Lista as notas do usuário autenticado, com opção de filtrar por notas arquivadas',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      includeArchived: z.boolean().optional().describe('Se verdadeiro, retorna apenas notas arquivadas. Se falso ou omitido, retorna notas ativas.'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await listarDadosNotas(user.id, { includeArchived: args.includeArchived });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao listar notas');
        }

        return jsonResult({
          message: 'Notas listadas com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao listar notas');
      }
    },
  });

  /**
   * Cria uma nova nota para o usuário autenticado
   */
  registerMcpTool({
    name: 'criar_nota',
    description: 'Cria uma nova nota para o usuário autenticado, podendo ser do tipo texto ou checklist',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      title: z.string().describe('Título da nota'),
      content: z.string().optional().describe('Conteúdo da nota (texto ou itens do checklist em formato JSON)'),
      type: z
        .enum(['text', 'checklist'])
        .optional()
        .default('text')
        .describe('Tipo da nota: text (texto livre) ou checklist (lista de verificação)'),
      labels: z.array(z.number()).optional().describe('IDs das etiquetas a serem associadas à nota'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await criarNota(user.id, {
          title: args.title,
          content: args.content,
          type: args.type,
          labels: args.labels,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao criar nota');
        }

        return jsonResult({
          message: 'Nota criada com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao criar nota');
      }
    },
  });

  /**
   * Atualiza uma nota existente
   */
  registerMcpTool({
    name: 'atualizar_nota',
    description: 'Atualiza o título, conteúdo ou etiquetas de uma nota existente',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da nota a ser atualizada'),
      title: z.string().optional().describe('Novo título da nota'),
      content: z.string().optional().describe('Novo conteúdo da nota'),
      labels: z.array(z.number()).optional().describe('Novos IDs de etiquetas (substitui os existentes)'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await atualizarNota(user.id, {
          id: args.id,
          title: args.title,
          content: args.content,
          labels: args.labels,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao atualizar nota');
        }

        return jsonResult({
          message: 'Nota atualizada com sucesso',
          data: result.data,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao atualizar nota');
      }
    },
  });

  /**
   * Arquiva ou desarquiva uma nota
   */
  registerMcpTool({
    name: 'arquivar_nota',
    description: 'Arquiva ou desarquiva uma nota do usuário autenticado',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da nota'),
      arquivada: z.boolean().describe('Se verdadeiro, arquiva a nota. Se falso, desarquiva.'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

         
        const result = await arquivarNota(user.id, {
          id: (args as any).id,
          isArchived: (args as any).arquivada,
        });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao arquivar nota');
        }

        const acao = args.arquivada ? 'arquivada' : 'desarquivada';

        return jsonResult({
          message: `Nota ${acao} com sucesso`,
          id: args.id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao arquivar nota');
      }
    },
  });

  /**
   * Exclui uma nota permanentemente
   */
  registerMcpTool({
    name: 'excluir_nota',
    description: 'Exclui uma nota permanentemente. Esta ação não pode ser desfeita.',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID da nota a ser excluída'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await excluirNota(user.id, { id: args.id });

        if (!result.success) {
          return errorResult(result.error?.message || 'Erro ao excluir nota');
        }

        return jsonResult({
          message: 'Nota excluída com sucesso',
          id: args.id,
        });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao excluir nota');
      }
    },
  });
}
