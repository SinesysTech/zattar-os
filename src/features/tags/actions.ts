"use server";

/**
 * Server Actions para o módulo de Tags
 *
 * CRUD de tags e gerenciamento de vínculos com processos.
 * Thin wrappers: apenas revalidação de cache + delegação ao service.
 */

import { revalidatePath } from "next/cache";
import type { CreateTagInput, UpdateTagInput } from "./domain";
import {
  listarTags,
  buscarTag,
  criarTag,
  atualizarTag,
  excluirTag,
  listarTagsDoProcesso,
  listarTagsDosProcessos,
  vincularTag,
  desvincularTag,
  atualizarTagsProcesso,
} from "./service";

// =============================================================================
// TIPOS DE RETORNO
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

// =============================================================================
// SERVER ACTIONS - TAGS CRUD
// =============================================================================

/**
 * Lista todas as tags disponíveis
 */
export async function actionListarTags(): Promise<ActionResult> {
  const result = await listarTags();

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  return { success: true, data: result.data, message: "Tags carregadas com sucesso" };
}

/**
 * Busca uma tag por ID
 */
export async function actionBuscarTag(id: number): Promise<ActionResult> {
  const result = await buscarTag(id);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  return { success: true, data: result.data, message: "Tag carregada com sucesso" };
}

/**
 * Cria uma nova tag
 */
export async function actionCriarTag(input: CreateTagInput): Promise<ActionResult> {
  const result = await criarTag(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");

  return { success: true, data: result.data, message: "Tag criada com sucesso" };
}

/**
 * Atualiza uma tag existente
 */
export async function actionAtualizarTag(
  id: number,
  input: UpdateTagInput
): Promise<ActionResult> {
  const result = await atualizarTag(id, input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");

  return { success: true, data: result.data, message: "Tag atualizada com sucesso" };
}

/**
 * Exclui uma tag
 */
export async function actionExcluirTag(id: number): Promise<ActionResult> {
  const result = await excluirTag(id);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");

  return { success: true, data: null, message: "Tag excluída com sucesso" };
}

// =============================================================================
// SERVER ACTIONS - VÍNCULOS PROCESSO-TAG
// =============================================================================

/**
 * Lista tags de um processo específico
 */
export async function actionListarTagsDoProcesso(
  processoId: number
): Promise<ActionResult> {
  const result = await listarTagsDoProcesso(processoId);

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
    message: "Tags do processo carregadas com sucesso",
  };
}

/**
 * Lista tags de múltiplos processos (batch)
 */
export async function actionListarTagsDosProcessos(
  processoIds: number[]
): Promise<ActionResult> {
  const result = await listarTagsDosProcessos(processoIds);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  return { success: true, data: result.data, message: "Tags carregadas com sucesso" };
}

/**
 * Vincula uma tag a um processo
 */
export async function actionVincularTag(
  processoId: number,
  tagId: number
): Promise<ActionResult> {
  const result = await vincularTag(processoId, tagId);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");
  revalidatePath(`/app/processos/${processoId}`);

  return { success: true, data: result.data, message: "Tag vinculada com sucesso" };
}

/**
 * Remove vínculo de uma tag com um processo
 */
export async function actionDesvincularTag(
  processoId: number,
  tagId: number
): Promise<ActionResult> {
  const result = await desvincularTag(processoId, tagId);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");
  revalidatePath(`/app/processos/${processoId}`);

  return { success: true, data: null, message: "Tag desvinculada com sucesso" };
}

/**
 * Atualiza todas as tags de um processo (substitui as existentes)
 */
export async function actionAtualizarTagsDoProcesso(
  processoId: number,
  tagIds: number[]
): Promise<ActionResult> {
  const result = await atualizarTagsProcesso(processoId, tagIds);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: result.error.message,
    };
  }

  revalidatePath("/app/processos");
  revalidatePath(`/app/processos/${processoId}`);

  return { success: true, data: result.data, message: "Tags atualizadas com sucesso" };
}
