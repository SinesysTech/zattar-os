/**
 * TAGS REPOSITORY - Acesso a dados
 *
 * Operações de banco de dados para tags usando Supabase.
 */

import { createClient } from "@/lib/supabase/server";
import type { Tag, ProcessoTag, CreateTagInput, UpdateTagInput } from "./domain";
import { gerarSlug } from "./domain";

// =============================================================================
// TIPOS DE RETORNO
// =============================================================================

export type RepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

// =============================================================================
// MAPEAMENTO DB -> DOMAIN
// =============================================================================

interface TagRow {
  id: number;
  nome: string;
  slug: string;
  cor: string | null;
  created_at: string;
}

interface ProcessoTagRow {
  id: number;
  processo_id: number;
  tag_id: number;
  created_at: string;
}

function mapTagRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    cor: row.cor,
    createdAt: row.created_at,
  };
}

function mapProcessoTagRowToProcessoTag(row: ProcessoTagRow): ProcessoTag {
  return {
    id: row.id,
    processoId: row.processo_id,
    tagId: row.tag_id,
    createdAt: row.created_at,
  };
}

// =============================================================================
// OPERAÇÕES CRUD - TAGS
// =============================================================================

/**
 * Lista todas as tags
 */
export async function findAllTags(): Promise<RepositoryResult<Tag[]>> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("tags")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: (data as TagRow[]).map(mapTagRowToTag),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao listar tags",
      },
    };
  }
}

/**
 * Busca tag por ID
 */
export async function findTagById(id: number): Promise<RepositoryResult<Tag | null>> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("tags")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: mapTagRowToTag(data as TagRow),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao buscar tag",
      },
    };
  }
}

/**
 * Busca tag por slug
 */
export async function findTagBySlug(slug: string): Promise<RepositoryResult<Tag | null>> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("tags")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: mapTagRowToTag(data as TagRow),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao buscar tag",
      },
    };
  }
}

/**
 * Cria uma nova tag
 */
export async function createTag(input: CreateTagInput): Promise<RepositoryResult<Tag>> {
  try {
    const db = await createClient();
    const slug = gerarSlug(input.nome);

    const { data, error } = await db
      .from("tags")
      .insert({
        nome: input.nome,
        slug,
        cor: input.cor || null,
      })
      .select()
      .single();

    if (error) {
      // Verifica se é erro de slug duplicado
      if (error.code === "23505") {
        return {
          success: false,
          error: { message: "Já existe uma tag com este nome", code: "DUPLICATE" },
        };
      }
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: mapTagRowToTag(data as TagRow),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao criar tag",
      },
    };
  }
}

/**
 * Atualiza uma tag existente
 */
export async function updateTag(
  id: number,
  input: UpdateTagInput
): Promise<RepositoryResult<Tag>> {
  try {
    const db = await createClient();
    const updates: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      updates.nome = input.nome;
      updates.slug = gerarSlug(input.nome);
    }
    if (input.cor !== undefined) {
      updates.cor = input.cor;
    }

    const { data, error } = await db
      .from("tags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: { message: "Já existe uma tag com este nome", code: "DUPLICATE" },
        };
      }
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: mapTagRowToTag(data as TagRow),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao atualizar tag",
      },
    };
  }
}

/**
 * Exclui uma tag
 */
export async function deleteTag(id: number): Promise<RepositoryResult<void>> {
  try {
    const db = await createClient();
    const { error } = await db.from("tags").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Erro ao excluir tag",
      },
    };
  }
}

// =============================================================================
// OPERAÇÕES - PROCESSO_TAGS (Vínculos)
// =============================================================================

/**
 * Lista tags de um processo específico
 */
export async function findTagsByProcessoId(
  processoId: number
): Promise<RepositoryResult<Tag[]>> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("processo_tags")
      .select(`
        tag_id,
        tags:tag_id (
          id,
          nome,
          slug,
          cor,
          created_at
        )
      `)
      .eq("processo_id", processoId);

    if (error) {
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    const tags = (data || [])
      .map((row) => {
        const tagData = row.tags as unknown as TagRow | null;
        return tagData ? mapTagRowToTag(tagData) : null;
      })
      .filter((tag): tag is Tag => tag !== null);

    return { success: true, data: tags };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Erro ao buscar tags do processo",
      },
    };
  }
}

/**
 * Lista tags de múltiplos processos de uma vez (batch)
 */
export async function findTagsByProcessoIds(
  processoIds: number[]
): Promise<RepositoryResult<Map<number, Tag[]>>> {
  try {
    if (processoIds.length === 0) {
      return { success: true, data: new Map() };
    }

    const db = await createClient();
    const { data, error } = await db
      .from("processo_tags")
      .select(`
        processo_id,
        tag_id,
        tags:tag_id (
          id,
          nome,
          slug,
          cor,
          created_at
        )
      `)
      .in("processo_id", processoIds);

    if (error) {
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    const tagsMap = new Map<number, Tag[]>();

    for (const row of data || []) {
      const processoId = row.processo_id as number;
      const tagData = row.tags as unknown as TagRow | null;

      if (!tagData) continue;

      const tag = mapTagRowToTag(tagData);
      const existing = tagsMap.get(processoId) || [];
      existing.push(tag);
      tagsMap.set(processoId, existing);
    }

    return { success: true, data: tagsMap };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Erro ao buscar tags dos processos",
      },
    };
  }
}

/**
 * Vincula uma tag a um processo
 */
export async function vincularTagAoProcesso(
  processoId: number,
  tagId: number
): Promise<RepositoryResult<ProcessoTag>> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("processo_tags")
      .insert({
        processo_id: processoId,
        tag_id: tagId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: { message: "Tag já vinculada a este processo", code: "DUPLICATE" },
        };
      }
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      success: true,
      data: mapProcessoTagRowToProcessoTag(data as ProcessoTagRow),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Erro ao vincular tag ao processo",
      },
    };
  }
}

/**
 * Remove vínculo de uma tag com um processo
 */
export async function desvincularTagDoProcesso(
  processoId: number,
  tagId: number
): Promise<RepositoryResult<void>> {
  try {
    const db = await createClient();
    const { error } = await db
      .from("processo_tags")
      .delete()
      .eq("processo_id", processoId)
      .eq("tag_id", tagId);

    if (error) {
      return {
        success: false,
        error: { message: error.message, code: error.code },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Erro ao desvincular tag do processo",
      },
    };
  }
}

/**
 * Atualiza todas as tags de um processo (substitui as existentes)
 */
export async function atualizarTagsDoProcesso(
  processoId: number,
  tagIds: number[]
): Promise<RepositoryResult<Tag[]>> {
  try {
    const db = await createClient();

    // 1. Remove todas as tags existentes
    const { error: deleteError } = await db
      .from("processo_tags")
      .delete()
      .eq("processo_id", processoId);

    if (deleteError) {
      return {
        success: false,
        error: { message: deleteError.message, code: deleteError.code },
      };
    }

    // 2. Se não houver novas tags, retorna vazio
    if (tagIds.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Insere as novas tags
    const inserts = tagIds.map((tagId) => ({
      processo_id: processoId,
      tag_id: tagId,
    }));

    const { error: insertError } = await db.from("processo_tags").insert(inserts);

    if (insertError) {
      return {
        success: false,
        error: { message: insertError.message, code: insertError.code },
      };
    }

    // 4. Busca e retorna as tags atualizadas
    return findTagsByProcessoId(processoId);
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar tags do processo",
      },
    };
  }
}
