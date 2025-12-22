'use server';

/**
 * CONTRATOS FEATURE - Segmentos Actions
 *
 * Server Actions para gerenciamento de segmentos.
 * Segmentos são usados para categorizar contratos (trabalhista, civil, etc.)
 */

import { createDbClient } from '@/lib/supabase';

// =============================================================================
// TIPOS
// =============================================================================

/**
 * Tipo de resultado simplificado para actions de segmentos
 */
type SegmentoActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Segmento {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentoInput {
  nome: string;
  slug: string;
  descricao?: string | null;
}

export interface UpdateSegmentoInput {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  ativo?: boolean;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_SEGMENTOS = 'segmentos';

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaSegmento(data: Record<string, unknown>): Segmento {
  return {
    id: data.id as number,
    nome: data.nome as string,
    slug: data.slug as string,
    descricao: (data.descricao as string | null) ?? null,
    ativo: (data.ativo as boolean) ?? true,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Lista todos os segmentos
 */
export async function actionListarSegmentos(): Promise<SegmentoActionResult<Segmento[]>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_SEGMENTOS)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const segmentos = (data || []).map((item) =>
      converterParaSegmento(item as Record<string, unknown>)
    );

    return { success: true, data: segmentos };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar segmentos',
    };
  }
}

/**
 * Cria um novo segmento
 */
export async function actionCriarSegmento(
  input: CreateSegmentoInput
): Promise<SegmentoActionResult<Segmento>> {
  try {
    const db = createDbClient();

    // Validar campos obrigatórios
    if (!input.nome?.trim()) {
      return { success: false, error: 'Nome é obrigatório' };
    }

    if (!input.slug?.trim()) {
      return { success: false, error: 'Slug é obrigatório' };
    }

    // Verificar se slug já existe
    const { data: existingSlug } = await db
      .from(TABLE_SEGMENTOS)
      .select('id')
      .eq('slug', input.slug.trim().toLowerCase())
      .maybeSingle();

    if (existingSlug) {
      return { success: false, error: 'Já existe um segmento com este slug' };
    }

    const { data, error } = await db
      .from(TABLE_SEGMENTOS)
      .insert({
        nome: input.nome.trim(),
        slug: input.slug.trim().toLowerCase(),
        descricao: input.descricao?.trim() || null,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: converterParaSegmento(data as Record<string, unknown>),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar segmento',
    };
  }
}

/**
 * Atualiza um segmento existente
 */
export async function actionAtualizarSegmento(
  id: number,
  input: UpdateSegmentoInput
): Promise<SegmentoActionResult<Segmento>> {
  try {
    const db = createDbClient();

    // Verificar se segmento existe
    const { data: existing } = await db
      .from(TABLE_SEGMENTOS)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Segmento não encontrado' };
    }

    // Verificar se novo slug já existe (se estiver sendo alterado)
    if (input.slug) {
      const { data: existingSlug } = await db
        .from(TABLE_SEGMENTOS)
        .select('id')
        .eq('slug', input.slug.trim().toLowerCase())
        .neq('id', id)
        .maybeSingle();

      if (existingSlug) {
        return { success: false, error: 'Já existe um segmento com este slug' };
      }
    }

    const updateData: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      updateData.nome = input.nome.trim();
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug.trim().toLowerCase();
    }
    if (input.descricao !== undefined) {
      updateData.descricao = input.descricao?.trim() || null;
    }
    if (input.ativo !== undefined) {
      updateData.ativo = input.ativo;
    }

    const { data, error } = await db
      .from(TABLE_SEGMENTOS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: converterParaSegmento(data as Record<string, unknown>),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar segmento',
    };
  }
}

/**
 * Deleta um segmento
 */
export async function actionDeletarSegmento(id: number): Promise<SegmentoActionResult<void>> {
  try {
    const db = createDbClient();

    // Verificar se há contratos usando este segmento
    const { data: contratosUsando } = await db
      .from('contratos')
      .select('id')
      .eq('segmento_id', id)
      .limit(1);

    if (contratosUsando && contratosUsando.length > 0) {
      return {
        success: false,
        error: 'Não é possível deletar: existem contratos usando este segmento',
      };
    }

    const { error } = await db.from(TABLE_SEGMENTOS).delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar segmento',
    };
  }
}
