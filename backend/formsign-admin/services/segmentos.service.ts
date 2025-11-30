import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { TABLE_SEGMENTOS } from './constants';
import type {
  FormsignSegmento,
  FormsignSegmentoList,
  ListSegmentosParams,
  UpsertSegmentoInput,
} from '@/backend/types/formsign-admin/types';

const SEGMENTO_SELECT = '*';

export async function listSegmentos(params: ListSegmentosParams = {}): Promise<FormsignSegmentoList> {
  const supabase = createServiceClient();
  let query = supabase.from(TABLE_SEGMENTOS).select(SEGMENTO_SELECT, { count: 'exact' });

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.search) {
    const term = params.search.trim();
    query = query.or(`nome.ilike.%${term}%,slug.ilike.%${term}%,descricao.ilike.%${term}%`);
  }

  const { data, error, count } = await query.order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar segmentos: ${error.message}`);
  }

  return {
    segmentos: (data as FormsignSegmento[]) || [],
    total: count ?? 0,
  };
}

export async function createSegmento(input: UpsertSegmentoInput): Promise<FormsignSegmento> {
  const supabase = createServiceClient();
  const payload = {
    nome: input.nome,
    slug: input.slug,
    descricao: input.descricao ?? null,
    ativo: input.ativo ?? true,
  };

  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .insert(payload)
    .select(SEGMENTO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao criar segmento: ${error.message}`);
  }

  return data as FormsignSegmento;
}

export async function getSegmento(id: number): Promise<FormsignSegmento | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .select(SEGMENTO_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter segmento: ${error.message}`);
  }

  return data as FormsignSegmento;
}

export async function updateSegmento(id: number, input: Partial<UpsertSegmentoInput>): Promise<FormsignSegmento> {
  const supabase = createServiceClient();
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) payload.nome = input.nome;
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.descricao !== undefined) payload.descricao = input.descricao ?? null;
  if (input.ativo !== undefined) payload.ativo = input.ativo;

  const { data, error } = await supabase
    .from(TABLE_SEGMENTOS)
    .update(payload)
    .eq('id', id)
    .select(SEGMENTO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar segmento: ${error.message}`);
  }

  return data as FormsignSegmento;
}

export async function deleteSegmento(id: number): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE_SEGMENTOS).delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao deletar segmento: ${error.message}`);
  }
}
