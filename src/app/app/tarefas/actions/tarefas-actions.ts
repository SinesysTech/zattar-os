/**
 * Server Actions para Tarefas
 * 
 * Utiliza wrapper safe-action para:
 * - Autenticação automática
 * - Validação com Zod
 * - Tipagem forte
 * - Error handling consistente
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import { authenticateRequest } from '@/lib/auth/session';
import * as service from '../service';
import type {
  CreateTaskInput,
  ListTasksParams,
  UpdateTaskInput,
  CreateSubTaskInput,
  UpdateSubTaskInput,
  DeleteSubTaskInput,
  AddCommentInput,
  DeleteCommentInput,
  AddFileInput,
  RemoveFileInput,
  TaskPositionsInput
} from '../domain';
import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema,
  createSubTaskSchema,
  updateSubTaskSchema,
  deleteSubTaskSchema,
  addCommentSchema,
  deleteCommentSchema,
  addFileSchema,
  removeFileSchema,
  taskPositionsSchema
} from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message: string };

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const idSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});

// =============================================================================
// ACTIONS DE LEITURA
// =============================================================================

/**
 * Lista tarefas do usuário com paginação e filtros (versão compatível com client components)
 */
export async function actionListarTarefas(params?: ListTasksParams): Promise<ActionResult> {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para realizar esta ação',
      };
    }

    const result = await service.listarTarefas(user.id, params ?? {});
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Tarefas carregadas com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar tarefas. Tente novamente.',
    };
  }
}

/**
 * Lista tarefas do usuário (versão Safe Action para uso com useAction)
 */
export const actionListarTarefasSafe = authenticatedAction(
  listTasksSchema,
  async (params, { user }) => {
    const result = await service.listarTarefas(user.id, params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca uma tarefa pelo ID
 */
export const actionBuscarTarefa = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.buscarTarefa(user.id, id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

// =============================================================================
// ACTIONS DE ESCRITA
// =============================================================================

/**
 * Cria uma nova tarefa
 */
export const actionCriarTarefa = authenticatedAction(
  createTaskSchema,
  async (data, { user }) => {
    const result = await service.criarTarefa(user.id, data as CreateTaskInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

/**
 * Atualiza uma tarefa existente
 */
export const actionAtualizarTarefa = authenticatedAction(
  updateTaskSchema,
  async (data, { user }) => {
    const result = await service.atualizarTarefa(user.id, data as UpdateTaskInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

/**
 * Remove uma tarefa
 */
export const actionRemoverTarefa = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.removerTarefa(user.id, id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return { success: true };
  }
);

/**
 * Ajustes rápidos de status
 */
export const actionMarcarComoDone = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.atualizarTarefa(user.id, { id, status: "done" });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/app/tarefas");
    return result.data;
  }
);

export const actionMarcarComoTodo = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.atualizarTarefa(user.id, { id, status: "todo" });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/app/tarefas");
    return result.data;
  }
);

export const actionReordenarTarefas = authenticatedAction(
  taskPositionsSchema,
  async (data, { user }) => {
    const result = await service.reorderTasks(user.id, data as TaskPositionsInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return { success: true };
  }
);

// =============================================================================
// ACTIONS DE SUBTAREFAS, COMENTÁRIOS E ANEXOS
// =============================================================================

export const actionCriarSubtarefa = authenticatedAction(
  createSubTaskSchema,
  async (data, { user }) => {
    const result = await service.criarSubtarefa(user.id, data as CreateSubTaskInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionAtualizarSubtarefa = authenticatedAction(
  updateSubTaskSchema,
  async (data, { user }) => {
    const result = await service.atualizarSubtarefa(user.id, data as UpdateSubTaskInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionRemoverSubtarefa = authenticatedAction(
  deleteSubTaskSchema,
  async (data, { user }) => {
    const result = await service.removerSubtarefa(user.id, data as DeleteSubTaskInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionAdicionarComentario = authenticatedAction(
  addCommentSchema,
  async (data, { user }) => {
    const result = await service.adicionarComentario(user.id, data as AddCommentInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionRemoverComentario = authenticatedAction(
  deleteCommentSchema,
  async (data, { user }) => {
    const result = await service.removerComentario(user.id, data as DeleteCommentInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionAdicionarAnexo = authenticatedAction(
  addFileSchema,
  async (data, { user }) => {
    const result = await service.adicionarAnexo(user.id, data as AddFileInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);

export const actionRemoverAnexo = authenticatedAction(
  removeFileSchema,
  async (data, { user }) => {
    const result = await service.removerAnexo(user.id, data as RemoveFileInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/tarefas');
    return result.data;
  }
);
