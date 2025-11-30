import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { TABLE_TEMPLATES } from './constants';
import type {
  FormsignTemplate,
  FormsignTemplateList,
  ListTemplatesParams,
  UpsertTemplateInput,
} from '@/backend/types/formsign-admin/types';

const TEMPLATE_SELECT = '*';

function parseId(id: string): { column: 'id' | 'template_uuid'; value: string | number } {
  const numericId = Number(id);
  if (!Number.isNaN(numericId) && Number.isFinite(numericId)) {
    return { column: 'id', value: numericId };
  }
  return { column: 'template_uuid', value: id };
}

function buildTemplatePayload(input: UpsertTemplateInput) {
  return {
    template_uuid: input.template_uuid,
    nome: input.nome,
    descricao: input.descricao ?? null,
    arquivo_original: input.arquivo_original,
    arquivo_nome: input.arquivo_nome,
    arquivo_tamanho: input.arquivo_tamanho,
    status: input.status ?? 'ativo',
    versao: input.versao ?? 1,
    ativo: input.ativo ?? true,
    campos: input.campos ?? '[]',
    conteudo_markdown: input.conteudo_markdown ?? null,
    criado_por: input.criado_por ?? null,
  };
}

function buildPartialTemplatePayload(input: Partial<UpsertTemplateInput>) {
  const payload: Record<string, unknown> = {};
  if (input.template_uuid !== undefined) payload.template_uuid = input.template_uuid;
  if (input.nome !== undefined) payload.nome = input.nome;
  if (input.descricao !== undefined) payload.descricao = input.descricao ?? null;
  if (input.arquivo_original !== undefined) payload.arquivo_original = input.arquivo_original;
  if (input.arquivo_nome !== undefined) payload.arquivo_nome = input.arquivo_nome;
  if (input.arquivo_tamanho !== undefined) payload.arquivo_tamanho = input.arquivo_tamanho;
  if (input.status !== undefined) payload.status = input.status;
  if (input.versao !== undefined) payload.versao = input.versao;
  if (input.ativo !== undefined) payload.ativo = input.ativo;
  if (input.campos !== undefined) payload.campos = input.campos;
  if (input.conteudo_markdown !== undefined) payload.conteudo_markdown = input.conteudo_markdown ?? null;
  if (input.criado_por !== undefined) payload.criado_por = input.criado_por ?? null;
  return payload;
}

export async function listTemplates(params: ListTemplatesParams = {}): Promise<FormsignTemplateList> {
  const supabase = createServiceClient();
  let query = supabase.from(TABLE_TEMPLATES).select(TEMPLATE_SELECT, { count: 'exact' });

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.search) {
    const term = params.search.trim();
    query = query.or(
      `nome.ilike.%${term}%,template_uuid.ilike.%${term}%,descricao.ilike.%${term}%`
    );
  }

  const { data, error, count } = await query.order('nome', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar templates: ${error.message}`);
  }

  return {
    templates: (data as FormsignTemplate[]) || [],
    total: count ?? 0,
  };
}

export async function getTemplate(id: string): Promise<FormsignTemplate | null> {
  const supabase = createServiceClient();
  const parsed = parseId(id);

  const { data, error } = await supabase
    .from(TABLE_TEMPLATES)
    .select(TEMPLATE_SELECT)
    .eq(parsed.column, parsed.value)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao obter template: ${error.message}`);
  }

  return data as FormsignTemplate;
}

export async function createTemplate(input: UpsertTemplateInput): Promise<FormsignTemplate> {
  const supabase = createServiceClient();
  const payload = buildTemplatePayload(input);

  const { data, error } = await supabase
    .from(TABLE_TEMPLATES)
    .insert(payload)
    .select(TEMPLATE_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao criar template: ${error.message}`);
  }

  return data as FormsignTemplate;
}

export async function updateTemplate(id: string, input: Partial<UpsertTemplateInput>): Promise<FormsignTemplate> {
  const supabase = createServiceClient();
  const parsed = parseId(id);
  const payload = buildPartialTemplatePayload(input);

  const { data, error } = await supabase
    .from(TABLE_TEMPLATES)
    .update(payload)
    .eq(parsed.column, parsed.value)
    .select(TEMPLATE_SELECT)
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar template: ${error.message}`);
  }

  return data as FormsignTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createServiceClient();
  const parsed = parseId(id);

  const { error } = await supabase
    .from(TABLE_TEMPLATES)
    .delete()
    .eq(parsed.column, parsed.value);

  if (error) {
    throw new Error(`Erro ao deletar template: ${error.message}`);
  }
}
