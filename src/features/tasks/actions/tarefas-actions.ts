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
import type { CreateTarefaInput, UpdateTarefaInput, ListarTarefasParams } from '../domain';
import {
  createTarefaSchema,
  updateTarefaSchema,
  listarTarefasSchema,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const idSchema = z.object({
  id: z.number().int().positive('ID inválido'),
});

// =============================================================================
// ACTIONS DE LEITURA
// =============================================================================

/**
 * Lista tarefas do usuário com paginação e filtros
 */
export const actionListarTarefas = authenticatedAction(
  listarTarefasSchema,
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
    const result = await service.buscarTarefa(id, user.id);
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
  createTarefaSchema,
  async (data, { user }) => {
    const result = await service.criarTarefa(user.id, data as CreateTarefaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/tarefas');
    return result.data;
  }
);

/**
 * Atualiza uma tarefa existente
 */
export const actionAtualizarTarefa = authenticatedAction(
  updateTarefaSchema,
  async (data, { user }) => {
    const result = await service.atualizarTarefa(data.id, user.id, data as UpdateTarefaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/tarefas');
    return result.data;
  }
);

/**
 * Remove uma tarefa
 */
export const actionRemoverTarefa = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.removerTarefa(id, user.id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/tarefas');
    return { success: true };
  }
);

/**
 * Marca uma tarefa como concluída
 */
export const actionConcluirTarefa = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.concluirTarefa(id, user.id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/tarefas');
    return result.data;
  }
);

/**
 * Reabre uma tarefa (marca como pendente)
 */
export const actionReabrirTarefa = authenticatedAction(
  idSchema,
  async ({ id }, { user }) => {
    const result = await service.reabrirTarefa(id, user.id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/tarefas');
    return result.data;
  }
);

