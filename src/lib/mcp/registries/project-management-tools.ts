/**
 * Registro de Ferramentas MCP - Gestão de Projetos
 *
 * Tools disponíveis:
 * - pm_listar_projetos: Lista projetos com filtros de busca, status e paginação
 * - pm_buscar_projeto: Busca projeto por ID com detalhes completos
 * - pm_criar_projeto: Cria novo projeto vinculado ao usuário autenticado
 * - pm_atualizar_projeto: Atualiza dados de projeto existente
 * - pm_excluir_projeto: Exclui projeto do sistema
 * - pm_listar_tarefas: Lista tarefas de um projeto com filtro por status
 * - pm_criar_tarefa: Cria nova tarefa em um projeto
 * - pm_atualizar_tarefa: Atualiza dados de tarefa existente
 * - pm_excluir_tarefa: Exclui tarefa do sistema
 * - pm_listar_membros: Lista membros de um projeto
 * - pm_adicionar_membro: Adiciona membro a um projeto com papel definido
 * - pm_listar_lembretes: Lista lembretes do usuário autenticado
 */

import { z } from 'zod';
import { registerMcpTool } from '../server';
import { jsonResult, errorResult } from '../types';

/**
 * Registra ferramentas MCP do módulo de Gestão de Projetos
 */
export async function registerProjectManagementTools(): Promise<void> {
  const { listarProjetos, buscarProjeto, criarProjeto, atualizarProjeto, excluirProjeto } =
    await import('@/app/(authenticated)/project-management/lib/services/project.service');

  const { listarTarefasPorProjeto, criarTarefa, atualizarTarefa, excluirTarefa } =
    await import('@/app/(authenticated)/project-management/lib/services/task.service');

  const { listarMembros, adicionarMembro } =
    await import('@/app/(authenticated)/project-management/lib/services/team.service');

  const { listarLembretes } =
    await import('@/app/(authenticated)/project-management/lib/services/reminder.service');

  // ---------------------------------------------------------------------------
  // PROJETOS
  // ---------------------------------------------------------------------------

  /**
   * Lista projetos com filtros de busca textual, status e paginação
   */
  registerMcpTool({
    name: 'pm_listar_projetos',
    description: 'Lista projetos do sistema com filtros de busca, status e paginação',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      pagina: z.number().optional().default(1).describe('Página de resultados'),
      limite: z.number().optional().default(20).describe('Número máximo de projetos por página'),
      busca: z.string().optional().describe('Busca textual por nome ou descrição'),
      status: z.string().optional().describe('Filtrar por status do projeto'),
    }),
    handler: async (args) => {
      try {
        const result = await listarProjetos(args);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao listar projetos');
        return jsonResult({ message: 'Projetos carregados', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Busca projeto por ID com todos os detalhes
   */
  registerMcpTool({
    name: 'pm_buscar_projeto',
    description: 'Busca projeto por ID com todos os detalhes',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      id: z.string().describe('ID do projeto'),
    }),
    handler: async (args) => {
      try {
        const result = await buscarProjeto(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Projeto não encontrado');
        return jsonResult({ message: 'Projeto encontrado', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Cria novo projeto vinculando ao usuário autenticado como gerente
   */
  registerMcpTool({
    name: 'pm_criar_projeto',
    description: 'Cria novo projeto no sistema, vinculando o usuário autenticado como gerente',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      nome: z.string().describe('Nome do projeto'),
      descricao: z.string().optional().describe('Descrição do projeto'),
      status: z.string().optional().describe('Status inicial do projeto'),
      prioridade: z.string().optional().describe('Prioridade do projeto'),
      dataInicio: z.string().optional().describe('Data de início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Data de encerramento previsto (YYYY-MM-DD)'),
      clienteId: z.number().optional().describe('ID do cliente vinculado'),
      processoId: z.number().optional().describe('ID do processo vinculado'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await criarProjeto(args, user.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao criar projeto');
        return jsonResult({ message: 'Projeto criado com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Atualiza dados de projeto existente
   */
  registerMcpTool({
    name: 'pm_atualizar_projeto',
    description: 'Atualiza dados de um projeto existente',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      id: z.string().describe('ID do projeto'),
      nome: z.string().optional().describe('Novo nome do projeto'),
      descricao: z.string().optional().describe('Nova descrição do projeto'),
      status: z.string().optional().describe('Novo status do projeto'),
      prioridade: z.string().optional().describe('Nova prioridade do projeto'),
      dataInicio: z.string().optional().describe('Nova data de início (YYYY-MM-DD)'),
      dataFim: z.string().optional().describe('Nova data de encerramento (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const { id, ...input } = args;
        const result = await atualizarProjeto(id, input);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao atualizar projeto');
        return jsonResult({ message: 'Projeto atualizado com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Exclui projeto do sistema
   */
  registerMcpTool({
    name: 'pm_excluir_projeto',
    description: 'Exclui um projeto do sistema permanentemente',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      id: z.string().describe('ID do projeto a excluir'),
    }),
    handler: async (args) => {
      try {
        const result = await excluirProjeto(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao excluir projeto');
        return jsonResult({ message: 'Projeto excluído com sucesso' });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // TAREFAS
  // ---------------------------------------------------------------------------

  /**
   * Lista tarefas de um projeto com filtro opcional por status
   */
  registerMcpTool({
    name: 'pm_listar_tarefas',
    description: 'Lista tarefas de um projeto com filtro opcional por status',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      projetoId: z.string().describe('ID do projeto'),
      status: z.string().optional().describe('Filtrar por status da tarefa'),
    }),
    handler: async (args) => {
      try {
        const result = await listarTarefasPorProjeto(args.projetoId, args.status);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao listar tarefas');
        return jsonResult({ message: 'Tarefas carregadas', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Cria nova tarefa em um projeto, vinculando o usuário autenticado como criador
   */
  registerMcpTool({
    name: 'pm_criar_tarefa',
    description: 'Cria nova tarefa em um projeto, vinculando o usuário autenticado como criador',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      projetoId: z.string().describe('ID do projeto'),
      titulo: z.string().describe('Título da tarefa'),
      descricao: z.string().optional().describe('Descrição detalhada da tarefa'),
      status: z.string().optional().describe('Status inicial da tarefa'),
      prioridade: z.string().optional().describe('Prioridade da tarefa'),
      responsavelId: z.string().optional().describe('ID do responsável pela tarefa'),
      dataVencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await criarTarefa(args, user.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao criar tarefa');
        return jsonResult({ message: 'Tarefa criada com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Atualiza dados de uma tarefa existente
   */
  registerMcpTool({
    name: 'pm_atualizar_tarefa',
    description: 'Atualiza dados de uma tarefa existente',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      id: z.string().describe('ID da tarefa'),
      titulo: z.string().optional().describe('Novo título da tarefa'),
      descricao: z.string().optional().describe('Nova descrição da tarefa'),
      status: z.string().optional().describe('Novo status da tarefa'),
      prioridade: z.string().optional().describe('Nova prioridade da tarefa'),
      responsavelId: z.string().optional().describe('Novo responsável pela tarefa'),
      dataVencimento: z.string().optional().describe('Nova data de vencimento (YYYY-MM-DD)'),
      projetoId: z.string().optional().describe('ID do projeto para recalcular progresso'),
    }),
    handler: async (args) => {
      try {
        const { id, projetoId, ...input } = args;
        const result = await atualizarTarefa(id, input, projetoId);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao atualizar tarefa');
        return jsonResult({ message: 'Tarefa atualizada com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Exclui tarefa do sistema
   */
  registerMcpTool({
    name: 'pm_excluir_tarefa',
    description: 'Exclui uma tarefa do sistema permanentemente',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      id: z.string().describe('ID da tarefa a excluir'),
    }),
    handler: async (args) => {
      try {
        const result = await excluirTarefa(args.id);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao excluir tarefa');
        return jsonResult({ message: 'Tarefa excluída com sucesso' });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // EQUIPE
  // ---------------------------------------------------------------------------

  /**
   * Lista membros de um projeto com seus papéis
   */
  registerMcpTool({
    name: 'pm_listar_membros',
    description: 'Lista membros de um projeto com seus papéis (gerente, membro, observador)',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      projetoId: z.string().describe('ID do projeto'),
    }),
    handler: async (args) => {
      try {
        const result = await listarMembros(args.projetoId);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao listar membros');
        return jsonResult({ message: 'Membros carregados', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  /**
   * Adiciona usuário a um projeto com papel definido
   */
  registerMcpTool({
    name: 'pm_adicionar_membro',
    description: 'Adiciona um usuário a um projeto com papel de gerente, membro ou observador',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      projetoId: z.string().describe('ID do projeto'),
      usuarioId: z.number().describe('ID do usuário a adicionar'),
      papel: z
        .enum(['gerente', 'membro', 'observador'])
        .optional()
        .default('membro')
        .describe('Papel do usuário no projeto'),
    }),
    handler: async (args) => {
      try {
        const result = await adicionarMembro(args);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao adicionar membro');
        return jsonResult({ message: 'Membro adicionado com sucesso', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // LEMBRETES
  // ---------------------------------------------------------------------------

  /**
   * Lista lembretes do usuário autenticado com filtro por status de conclusão
   */
  registerMcpTool({
    name: 'pm_listar_lembretes',
    description: 'Lista lembretes do usuário autenticado com filtro opcional por status de conclusão',
    feature: 'project-management',
    requiresAuth: true,
    schema: z.object({
      concluido: z.boolean().optional().describe('Filtrar por lembretes concluídos (true) ou pendentes (false)'),
      limite: z.number().optional().describe('Número máximo de lembretes a retornar'),
    }),
    handler: async (args) => {
      try {
        const { getCurrentUser } = await import('@/lib/auth/server');
        const user = await getCurrentUser();
        if (!user) return errorResult('Usuário não autenticado');

        const result = await listarLembretes(user.id, args);
        if (!result.success) return errorResult(result.error?.message || 'Erro ao listar lembretes');
        return jsonResult({ message: 'Lembretes carregados', data: result.data });
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro interno');
      }
    },
  });
}
