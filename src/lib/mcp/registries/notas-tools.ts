/**
 * Registro de Ferramentas MCP - Notas
 *
 * Tools disponíveis:
 * - listar_notas: Lista notas do usuário autenticado com filtro por arquivamento
 * - criar_nota: Cria uma nova nota para o usuário autenticado
 * - atualizar_nota: Atualiza o conteúdo ou etiquetas de uma nota existente
 * - arquivar_nota: Arquiva ou desarquiva uma nota
 * - excluir_nota: Exclui uma nota permanentemente
 * - gerenciar_etiqueta_nota: Cria, atualiza ou exclui etiquetas de notas
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
    criarEtiqueta,
    atualizarEtiqueta,
    excluirEtiqueta,
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
      arquivada: z.boolean().default(true).describe('Se verdadeiro, arquiva a nota. Se falso, desarquiva.'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await arquivarNota(user.id, {
          id: args.id,
          isArchived: args.arquivada,
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

  /**
   * Cria, atualiza ou exclui etiquetas de notas
   */
  registerMcpTool({
    name: 'gerenciar_etiqueta_nota',
    description: 'Gerencia etiquetas de notas: cria uma nova etiqueta, atualiza uma existente ou exclui permanentemente',
    feature: 'notas',
    requiresAuth: true,
    schema: z.object({
      acao: z
        .enum(['criar', 'atualizar', 'excluir'])
        .describe('Ação a executar: criar (nova etiqueta), atualizar (etiqueta existente) ou excluir (remove permanentemente)'),
      id: z.number().optional().describe('ID da etiqueta (obrigatório para atualizar e excluir)'),
      title: z.string().optional().describe('Nome/título da etiqueta (obrigatório para criar, opcional para atualizar)'),
      color: z.string().optional().describe('Cor da etiqueta em formato CSS variable ou hex (obrigatório para criar, opcional para atualizar)'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        if (args.acao === 'criar') {
          if (!args.title) return errorResult('O campo "title" é obrigatório para criar uma etiqueta');
          if (!args.color) return errorResult('O campo "color" é obrigatório para criar uma etiqueta');

          const result = await criarEtiqueta(user.id, {
            title: args.title,
            color: args.color,
          });

          if (!result.success) {
            return errorResult(result.error?.message || 'Erro ao criar etiqueta');
          }

          return jsonResult({
            message: 'Etiqueta criada com sucesso',
            data: result.data,
          });
        }

        if (args.acao === 'atualizar') {
          if (!args.id) return errorResult('O campo "id" é obrigatório para atualizar uma etiqueta');

          const result = await atualizarEtiqueta(user.id, {
            id: args.id,
            title: args.title,
            color: args.color,
          });

          if (!result.success) {
            return errorResult(result.error?.message || 'Erro ao atualizar etiqueta');
          }

          return jsonResult({
            message: 'Etiqueta atualizada com sucesso',
            data: result.data,
          });
        }

        if (args.acao === 'excluir') {
          if (!args.id) return errorResult('O campo "id" é obrigatório para excluir uma etiqueta');

          const result = await excluirEtiqueta(user.id, { id: args.id });

          if (!result.success) {
            return errorResult(result.error?.message || 'Erro ao excluir etiqueta');
          }

          return jsonResult({
            message: 'Etiqueta excluída com sucesso',
            id: args.id,
          });
        }

        return errorResult('Ação inválida');
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno ao gerenciar etiqueta');
      }
    },
  });
}
