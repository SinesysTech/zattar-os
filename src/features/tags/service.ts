"use server";

/**
 * TAGS SERVICE - Camada de Regras de Negócio (Casos de Uso)
 *
 * CONVENÇÕES:
 * - Funções nomeadas como ações: listar, buscar, criar, atualizar, deletar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError } from "@/types";
import type { Tag, ProcessoTag, CreateTagInput, UpdateTagInput } from "./domain";
import { createTagSchema, updateTagSchema } from "./domain";
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
// SERVIÇOS - TAGS CRUD
// =============================================================================

/**
 * Lista todas as tags disponíveis
 */
export async function listarTags(): Promise<Result<Tag[]>> {
  try {
    const result = await findAllTags();

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Busca uma tag por ID
 */
export async function buscarTag(id: number): Promise<Result<Tag>> {
  try {
    if (!id || id <= 0) {
      return err(appError("VALIDATION_ERROR", "ID deve ser um número positivo", { field: "id" }));
    }

    const result = await findTagById(id);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    if (!result.data) {
      return err(appError("NOT_FOUND", "Tag não encontrada", { id }));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Cria uma nova tag
 */
export async function criarTag(input: CreateTagInput): Promise<Result<Tag>> {
  try {
    const validation = createTagSchema.safeParse(input);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return err(
        appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
          field: firstError?.path.join("."),
          errors: validation.error.errors,
        })
      );
    }

    const result = await createTag(validation.data);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message, { code: result.error.code }));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Atualiza uma tag existente
 */
export async function atualizarTag(id: number, input: UpdateTagInput): Promise<Result<Tag>> {
  try {
    if (!id || id <= 0) {
      return err(appError("VALIDATION_ERROR", "ID deve ser um número positivo", { field: "id" }));
    }

    const validation = updateTagSchema.safeParse(input);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return err(
        appError("VALIDATION_ERROR", firstError?.message ?? "Dados inválidos", {
          field: firstError?.path.join("."),
          errors: validation.error.errors,
        })
      );
    }

    const result = await updateTag(id, validation.data);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message, { code: result.error.code }));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Exclui uma tag
 */
export async function excluirTag(id: number): Promise<Result<null>> {
  try {
    if (!id || id <= 0) {
      return err(appError("VALIDATION_ERROR", "ID deve ser um número positivo", { field: "id" }));
    }

    const result = await deleteTag(id);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    return ok(null);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

// =============================================================================
// SERVIÇOS - VÍNCULOS PROCESSO-TAG
// =============================================================================

/**
 * Lista tags de um processo específico
 */
export async function listarTagsDoProcesso(processoId: number): Promise<Result<Tag[]>> {
  try {
    if (!processoId || processoId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID do processo deve ser um número positivo", {
          field: "processoId",
        })
      );
    }

    const result = await findTagsByProcessoId(processoId);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Lista tags de múltiplos processos (batch)
 * Retorna um Record<processoId, Tag[]> para serialização segura
 */
export async function listarTagsDosProcessos(
  processoIds: number[]
): Promise<Result<Record<number, Tag[]>>> {
  try {
    if (!processoIds || processoIds.length === 0) {
      return ok({});
    }

    const result = await findTagsByProcessoIds(processoIds);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    // Converter Map para objeto para serialização
    const tagsObj: Record<number, Tag[]> = {};
    result.data.forEach((tags, processoId) => {
      tagsObj[processoId] = tags;
    });

    return ok(tagsObj);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Vincula uma tag a um processo
 */
export async function vincularTag(
  processoId: number,
  tagId: number
): Promise<Result<ProcessoTag>> {
  try {
    if (!processoId || processoId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID do processo deve ser um número positivo", {
          field: "processoId",
        })
      );
    }

    if (!tagId || tagId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID da tag deve ser um número positivo", {
          field: "tagId",
        })
      );
    }

    const result = await vincularTagAoProcesso(processoId, tagId);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message, { code: result.error.code }));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Remove vínculo de uma tag com um processo
 */
export async function desvincularTag(
  processoId: number,
  tagId: number
): Promise<Result<null>> {
  try {
    if (!processoId || processoId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID do processo deve ser um número positivo", {
          field: "processoId",
        })
      );
    }

    if (!tagId || tagId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID da tag deve ser um número positivo", {
          field: "tagId",
        })
      );
    }

    const result = await desvincularTagDoProcesso(processoId, tagId);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    return ok(null);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}

/**
 * Atualiza todas as tags de um processo (substitui as existentes)
 */
export async function atualizarTagsProcesso(
  processoId: number,
  tagIds: number[]
): Promise<Result<Tag[]>> {
  try {
    if (!processoId || processoId <= 0) {
      return err(
        appError("VALIDATION_ERROR", "ID do processo deve ser um número positivo", {
          field: "processoId",
        })
      );
    }

    const result = await atualizarTagsDoProcesso(processoId, tagIds);

    if (!result.success) {
      return err(appError("DATABASE_ERROR", result.error.message));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro desconhecido",
        { originalError: error }
      )
    );
  }
}
