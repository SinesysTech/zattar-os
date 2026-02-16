"use server";

/**
 * Server Actions para o módulo de Tags
 *
 * CRUD de tags e gerenciamento de vínculos com processos.
 */

import { revalidatePath } from "next/cache";
import {
  type CreateTagInput,
  type UpdateTagInput,
  createTagSchema,
  updateTagSchema,
} from "./domain";
import {
  findAllTags,
  findTagById,
  createTag,
  updateTag,
  deleteTag,
  findTagsByProcessoId,
  findTagsByProcessoIds,
  vincularTagAoProcesso,
  desvincularTagDoProcesso,
  atualizarTagsDoProcesso,
} from "./repository";

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
// HELPERS
// =============================================================================

function formatZodErrors(zodError: {
  errors: Array<{ path: (string | number)[]; message: string }>;
}): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join(".");
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

// =============================================================================
// SERVER ACTIONS - TAGS CRUD
// =============================================================================

/**
 * Lista todas as tags disponíveis
 */
export async function actionListarTags(): Promise<ActionResult> {
  try {
    const result = await findAllTags();

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
      message: "Tags carregadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao listar tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar tags. Tente novamente.",
    };
  }
}

/**
 * Busca uma tag por ID
 */
export async function actionBuscarTag(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID da tag é obrigatório",
      };
    }

    const result = await findTagById(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    if (!result.data) {
      return {
        success: false,
        error: "Tag não encontrada",
        message: "Tag não encontrada",
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Tag carregada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar tag. Tente novamente.",
    };
  }
}

/**
 * Cria uma nova tag
 */
export async function actionCriarTag(input: CreateTagInput): Promise<ActionResult> {
  try {
    // Validar com Zod
    const validation = createTagSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const result = await createTag(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Tag criada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao criar tag. Tente novamente.",
    };
  }
}

/**
 * Atualiza uma tag existente
 */
export async function actionAtualizarTag(
  id: number,
  input: UpdateTagInput
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID da tag é obrigatório",
      };
    }

    // Validar com Zod
    const validation = updateTagSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        error: "Erro de validação",
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || "Dados inválidos",
      };
    }

    const result = await updateTag(id, validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: result.data,
      message: "Tag atualizada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar tag. Tente novamente.",
    };
  }
}

/**
 * Exclui uma tag
 */
export async function actionExcluirTag(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID da tag é obrigatório",
      };
    }

    const result = await deleteTag(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");

    return {
      success: true,
      data: null,
      message: "Tag excluída com sucesso",
    };
  } catch (error) {
    console.error("Erro ao excluir tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao excluir tag. Tente novamente.",
    };
  }
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
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "ID inválido",
        message: "ID do processo é obrigatório",
      };
    }

    const result = await findTagsByProcessoId(processoId);

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
  } catch (error) {
    console.error("Erro ao listar tags do processo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar tags do processo. Tente novamente.",
    };
  }
}

/**
 * Lista tags de múltiplos processos (batch)
 */
export async function actionListarTagsDosProcessos(
  processoIds: number[]
): Promise<ActionResult> {
  try {
    if (!processoIds || processoIds.length === 0) {
      return {
        success: true,
        data: {},
        message: "Nenhum processo informado",
      };
    }

    const result = await findTagsByProcessoIds(processoIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // Converter Map para objeto para serialização
    const tagsObj: Record<number, unknown[]> = {};
    result.data.forEach((tags, processoId) => {
      tagsObj[processoId] = tags;
    });

    return {
      success: true,
      data: tagsObj,
      message: "Tags carregadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao listar tags dos processos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao carregar tags dos processos. Tente novamente.",
    };
  }
}

/**
 * Vincula uma tag a um processo
 */
export async function actionVincularTag(
  processoId: number,
  tagId: number
): Promise<ActionResult> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "ID do processo inválido",
        message: "ID do processo é obrigatório",
      };
    }

    if (!tagId || tagId <= 0) {
      return {
        success: false,
        error: "ID da tag inválido",
        message: "ID da tag é obrigatório",
      };
    }

    const result = await vincularTagAoProcesso(processoId, tagId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");
    revalidatePath(`/app/processos/${processoId}`);

    return {
      success: true,
      data: result.data,
      message: "Tag vinculada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao vincular tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao vincular tag. Tente novamente.",
    };
  }
}

/**
 * Remove vínculo de uma tag com um processo
 */
export async function actionDesvincularTag(
  processoId: number,
  tagId: number
): Promise<ActionResult> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "ID do processo inválido",
        message: "ID do processo é obrigatório",
      };
    }

    if (!tagId || tagId <= 0) {
      return {
        success: false,
        error: "ID da tag inválido",
        message: "ID da tag é obrigatório",
      };
    }

    const result = await desvincularTagDoProcesso(processoId, tagId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");
    revalidatePath(`/app/processos/${processoId}`);

    return {
      success: true,
      data: null,
      message: "Tag desvinculada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao desvincular tag:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao desvincular tag. Tente novamente.",
    };
  }
}

/**
 * Atualiza todas as tags de um processo (substitui as existentes)
 */
export async function actionAtualizarTagsDoProcesso(
  processoId: number,
  tagIds: number[]
): Promise<ActionResult> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "ID do processo inválido",
        message: "ID do processo é obrigatório",
      };
    }

    const result = await atualizarTagsDoProcesso(processoId, tagIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath("/app/processos");
    revalidatePath(`/app/processos/${processoId}`);

    return {
      success: true,
      data: result.data,
      message: "Tags atualizadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar tags do processo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      message: "Erro ao atualizar tags. Tente novamente.",
    };
  }
}
