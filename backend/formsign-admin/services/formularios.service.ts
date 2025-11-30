import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { TABLE_FORMULARIOS, TABLE_SEGMENTOS } from './constants';
import type {
  FormsignFormulario,
  FormsignFormularioList,
  ListFormulariosParams,
  UpsertFormularioInput,
} from '@/backend/types/formsign-admin/types';

const FORMULARIO_SELECT = '*, segmento:formsign_segmentos(*)';

function parseFormularioId(id: string): { column: 'id' | 'formulario_uuid'; value: string | number } {
  const numericId = Number(id);
  if (!Number.isNaN(numericId) && Number.isFinite(numericId)) {
    return { column: 'id', value: numericId };
  }
  return { column: 'formulario_uuid', value: id };
}

function buildFormularioPayload(input: UpsertFormularioInput) {
  return {
    nome: input.nome,
    slug: input.slug,
    segmento_id: input.segmento_id,
    descricao: input.descricao ?? null,
    form_schema: input.form_schema ?? null,
    schema_version: input.schema_version ?? '1.0.0',
    template_ids: input.template_ids ?? [],
    ativo: input.ativo ?? true,
    ordem: input.ordem ?? 0,
    foto_necessaria: input.foto_necessaria ?? true,
    geolocation_necessaria: input.geolocation_necessaria ?? false,
    metadados_seguranca: input.metadados_seguranca ?? '["ip","user_agent"]',
    criado_por: input.criado_por ?? null,
  };
}

export async function listFormularios(
  params: ListFormulariosParams = {}
): Promise<FormsignFormularioList> {
  const supabase = createServiceClient();
  let query = supabase.from(TABLE_FORMULARIOS).select(FORMULARIO_SELECT, { count: 'exact' });

  if (params.segmento_id !== undefined) {
    query = query.eq('segmento_id', params.segmento_id);
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.search) {
    const term = params.search.trim();
    query = query.or(
      `nome.ilike.%${term}%,slug.ilike.%${term}%,descricao.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query
    .order('ordem', { ascending: true, nullsFirst: true })
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar formulários: ${error.message}`);
  }

  return {
    formularios: (data as FormsignFormulario[]) || [],
    total: count ?? 0,
  };
}

export async function getFormulario(id: string): Promise<FormsignFormulario | null> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .select(FORMULARIO_SELECT)
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter formulário: ${error.message}`);
  }

  return data as FormsignFormulario;
}

export async function createFormulario(input: UpsertFormularioInput): Promise<FormsignFormulario> {
  const supabase = createServiceClient();
  const payload = buildFormularioPayload(input);

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .insert(payload)
    .select(FORMULARIO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao criar formulário: ${error.message}`);
  }

  return data as FormsignFormulario;
}

export async function updateFormulario(
  id: string,
  input: Partial<UpsertFormularioInput>
): Promise<FormsignFormulario> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);
  const payload: Record<string, unknown> = {};

  if (input.nome !== undefined) payload.nome = input.nome;
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.segmento_id !== undefined) payload.segmento_id = input.segmento_id;
  if (input.descricao !== undefined) payload.descricao = input.descricao ?? null;
  if (input.form_schema !== undefined) payload.form_schema = input.form_schema;
  if (input.schema_version !== undefined) payload.schema_version = input.schema_version;
  if (input.template_ids !== undefined) payload.template_ids = input.template_ids;
  if (input.ativo !== undefined) payload.ativo = input.ativo;
  if (input.ordem !== undefined) payload.ordem = input.ordem;
  if (input.foto_necessaria !== undefined) payload.foto_necessaria = input.foto_necessaria;
  if (input.geolocation_necessaria !== undefined) {
    payload.geolocation_necessaria = input.geolocation_necessaria;
  }
  if (input.metadados_seguranca !== undefined) {
    payload.metadados_seguranca = input.metadados_seguranca;
  }
  if (input.criado_por !== undefined) payload.criado_por = input.criado_por ?? null;

  const { data, error } = await supabase
    .from(TABLE_FORMULARIOS)
    .update(payload)
    .eq(parsed.column, parsed.value)
    .select(FORMULARIO_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar formulário: ${error.message}`);
  }

  return data as FormsignFormulario;
}

export async function deleteFormulario(id: string): Promise<void> {
  const supabase = createServiceClient();
  const parsed = parseFormularioId(id);

  const { error } = await supabase
    .from(TABLE_FORMULARIOS)
    .delete()
    .eq(parsed.column, parsed.value);

  if (error) {
    throw new Error(`Erro ao deletar formulário: ${error.message}`);
  }
}
