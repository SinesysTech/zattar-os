/**
 * Registro de Ferramentas MCP - Peças Jurídicas
 *
 * Tools disponíveis:
 * - pj_listar_modelos: Lista modelos de peças com filtros de busca, tipo e visibilidade
 * - pj_buscar_modelo: Busca modelo de peça por ID
 * - pj_criar_modelo: Cria novo modelo de peça jurídica
 * - pj_atualizar_modelo: Atualiza modelo de peça existente
 * - pj_deletar_modelo: Remove (soft delete) modelo de peça
 * - pj_listar_tipos: Lista os tipos de peça jurídica disponíveis no sistema
 * - pj_preview_geracao: Gera preview dos placeholders resolvidos para um contrato
 * - pj_gerar_de_contrato: Gera peça jurídica completa a partir de modelo e contrato
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';
import { actionResultToMcp } from '../utils';

/**
 * Registra ferramentas MCP do módulo de Peças Jurídicas
 */
export async function registerPecasJuridicasTools(): Promise<void> {
  const {
    listarPecasModelos,
    buscarPecaModelo,
    criarPecaModelo,
    atualizarPecaModelo,
    deletarPecaModelo,
    previewGeracaoPeca,
    gerarPecaDeContrato,
  } = await import('@/app/(authenticated)/pecas-juridicas/service');

  // ---------------------------------------------------------------------------
  // MODELOS DE PEÇAS
  // ---------------------------------------------------------------------------

  /**
   * Lista modelos de peças jurídicas com filtros de busca, tipo e visibilidade
   */
  registerMcpTool({
    name: 'pj_listar_modelos',
    description: 'Lista modelos de peças jurídicas com filtros de busca textual, tipo e visibilidade',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().optional().default(1).describe('Página de resultados'),
      limite: z.number().optional().default(20).describe('Número máximo de modelos por página'),
      busca: z.string().optional().describe('Busca textual por título ou descrição'),
      tipo: z.string().optional().describe('Filtrar por tipo de peça (ex: peticao_inicial, recurso_ordinario)'),
      visibilidade: z.string().optional().describe('Filtrar por visibilidade: publico ou privado'),
    }),
    handler: async (args) => {
      try {
        const result = await listarPecasModelos(args);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao listar modelos');
        return jsonResult({ message: 'Modelos carregados', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Busca modelo de peça jurídica por ID
   */
  registerMcpTool({
    name: 'pj_buscar_modelo',
    description: 'Busca modelo de peça jurídica por ID com todos os detalhes e placeholders definidos',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do modelo de peça'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarPecaModelo(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Modelo não encontrado');
        return jsonResult({ message: 'Modelo encontrado', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Cria novo modelo de peça jurídica
   */
  registerMcpTool({
    name: 'pj_criar_modelo',
    description: 'Cria novo modelo de peça jurídica com conteúdo em formato Plate.js',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      titulo: z.string().describe('Título do modelo'),
      tipo: z.string().describe('Tipo da peça (peticao_inicial, contestacao, recurso_ordinario, etc.)'),
      conteudo: z.unknown().optional().describe('Conteúdo do modelo em formato Plate.js (JSON)'),
      descricao: z.string().optional().describe('Descrição do modelo'),
      visibilidade: z.string().optional().describe('Visibilidade: publico ou privado'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await criarPecaModelo(
          { ...args, tipoPeca: args.tipo as never },
          user.id,
        );
        if (!result.success) return errorResult(result.error?.message || 'Erro ao criar modelo');
        return jsonResult({ message: 'Modelo criado com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Atualiza modelo de peça jurídica existente
   */
  registerMcpTool({
    name: 'pj_atualizar_modelo',
    description: 'Atualiza dados de um modelo de peça jurídica existente',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do modelo'),
      titulo: z.string().optional().describe('Novo título do modelo'),
      tipo: z.string().optional().describe('Novo tipo da peça'),
      conteudo: z.unknown().optional().describe('Novo conteúdo em formato Plate.js (JSON)'),
      descricao: z.string().optional().describe('Nova descrição'),
      visibilidade: z.string().optional().describe('Nova visibilidade: publico ou privado'),
    }),
    handler: async (args) => {
      try {
        const { id, tipo, ...input } = args;
        const updateInput = tipo ? { ...input, tipoPeca: tipo as never } : input;
        const result = await atualizarPecaModelo(id, updateInput);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao atualizar modelo');
        return jsonResult({ message: 'Modelo atualizado com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Remove modelo de peça jurídica (soft delete)
   */
  registerMcpTool({
    name: 'pj_deletar_modelo',
    description: 'Remove um modelo de peça jurídica do sistema (soft delete — não é permanente)',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      id: z.number().describe('ID do modelo a remover'),
    }),
    handler: async (args) => {
      try {
        const result = await deletarPecaModelo(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao deletar modelo');
        return jsonResult({ message: 'Modelo removido com sucesso' });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // TIPOS DE PEÇA
  // ---------------------------------------------------------------------------

  /**
   * Lista os tipos de peça jurídica disponíveis no sistema com seus rótulos
   */
  registerMcpTool({
    name: 'pj_listar_tipos',
    description: 'Lista os tipos de peça jurídica disponíveis no sistema com seus rótulos em português',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const { actionGetTiposPecaOptions } = await import(
          '@/app/(authenticated)/pecas-juridicas/actions/pecas-modelos-actions'
        );
        const result = await actionGetTiposPecaOptions();
        return actionResultToMcp(result);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // GERAÇÃO DE PEÇAS
  // ---------------------------------------------------------------------------

  /**
   * Gera preview dos placeholders que serão substituídos para um contrato
   */
  registerMcpTool({
    name: 'pj_preview_geracao',
    description:
      'Gera preview dos placeholders que serão substituídos ao gerar uma peça a partir de um contrato, mostrando quais dados estão disponíveis',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      modeloId: z.number().describe('ID do modelo de peça'),
      contratoId: z.number().describe('ID do contrato para montar o contexto de placeholders'),
    }),
    handler: async (args) => {
      try {
        const { actionBuscarContextoContrato } = await import(
          '@/app/(authenticated)/pecas-juridicas/actions/gerar-peca-actions'
        );

        const contextResult = await actionBuscarContextoContrato(args.contratoId);
        if (!contextResult.success) {
          return errorResult(contextResult.error || 'Não foi possível carregar o contexto do contrato');
        }

        const result = await previewGeracaoPeca(args.modeloId, contextResult.data);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao gerar preview');
        return jsonResult({ message: 'Preview gerado', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Gera peça jurídica completa a partir de um modelo e dados de um contrato
   */
  registerMcpTool({
    name: 'pj_gerar_de_contrato',
    description:
      'Gera peça jurídica completa a partir de um modelo, substituindo os placeholders com dados do contrato e vinculando o documento gerado',
    feature: 'pecas-juridicas',
    requiresAuth: true,
    schema: z.object({
      modeloId: z.number().describe('ID do modelo de peça a usar'),
      contratoId: z.number().describe('ID do contrato para substituição de placeholders'),
      titulo: z.string().optional().describe('Título personalizado para a peça gerada'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const { actionBuscarContextoContrato } = await import(
          '@/app/(authenticated)/pecas-juridicas/actions/gerar-peca-actions'
        );

        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const contextResult = await actionBuscarContextoContrato(args.contratoId);
        if (!contextResult.success) {
          return errorResult(contextResult.error || 'Não foi possível carregar o contexto do contrato');
        }

        const titulo = args.titulo ?? `Peça gerada — Contrato #${args.contratoId}`;

        const result = await gerarPecaDeContrato(
          { modeloId: args.modeloId, contratoId: args.contratoId, titulo },
          contextResult.data,
          user.id,
        );
        if (!result.success) return errorResult(result.error?.message || 'Erro ao gerar peça');
        return jsonResult({ message: 'Peça gerada com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });
}
