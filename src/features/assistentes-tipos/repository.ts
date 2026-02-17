import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  AssistenteTipo,
  AssistenteTipoComRelacoes,
  CriarAssistenteTipoInput,
  AtualizarAssistenteTipoInput,
  ListarAssistentesTiposParams,
} from './domain';

/**
 * ASSISTENTES-TIPOS REPOSITORY
 * 
 * Acesso aos dados de relacionamento entre assistentes e tipos de expedientes.
 */

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Buscar relação por ID
 */
export async function buscarPorId(id: number): Promise<AssistenteTipo | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes_tipos_expedientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar relação: ${error.message}`);
  }

  return data as AssistenteTipo;
}

/**
 * Buscar relação ativa por tipo de expediente
 */
export async function buscarPorTipoExpediente(
  tipo_expediente_id: number
): Promise<AssistenteTipoComRelacoes | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes_tipos_expedientes')
    .select(`
      *,
      assistente:assistentes!assistente_id(nome, dify_app_id),
      tipo_expediente:tipos_expedientes!tipo_expediente_id(tipo_expediente),
      criador:usuarios!criado_por(nome_completo)
    `)
    .eq('tipo_expediente_id', tipo_expediente_id)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar relação por tipo: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    assistente_nome: data.assistente?.nome || 'Desconhecido',
    assistente_dify_app_id: data.assistente?.dify_app_id || null,
    tipo_expediente_nome: data.tipo_expediente?.tipo_expediente || 'Desconhecido',
    criador_nome: data.criador?.nome_completo || 'Desconhecido',
  } as AssistenteTipoComRelacoes;
}

/**
 * Listar todas as relações com filtros
 */
export async function listar(
  params: ListarAssistentesTiposParams
): Promise<{ data: AssistenteTipoComRelacoes[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('assistentes_tipos_expedientes')
    .select(`
      *,
      assistente:assistentes!assistente_id(nome, dify_app_id),
      tipo_expediente:tipos_expedientes!tipo_expediente_id(tipo_expediente),
      criador:usuarios!criado_por(nome_completo)
    `, { count: 'exact' });

  if (params.assistente_id) {
    query = query.eq('assistente_id', params.assistente_id);
  }

  if (params.tipo_expediente_id) {
    query = query.eq('tipo_expediente_id', params.tipo_expediente_id);
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar relações: ${error.message}`);
  }

  const mappedData = (data || []).map((item: any) => ({
    ...item,
    assistente_nome: item.assistente?.nome || 'Desconhecido',
    assistente_dify_app_id: item.assistente?.dify_app_id || null,
    tipo_expediente_nome: item.tipo_expediente?.tipo_expediente || 'Desconhecido',
    criador_nome: item.criador?.nome_completo || 'Desconhecido',
  })) as AssistenteTipoComRelacoes[];

  return {
    data: mappedData,
    total: count || 0,
  };
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Criar nova relação
 */
export async function criar(
  input: CriarAssistenteTipoInput,
  usuario_id: number
): Promise<AssistenteTipo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes_tipos_expedientes')
    .insert({
      assistente_id: input.assistente_id,
      tipo_expediente_id: input.tipo_expediente_id,
      ativo: input.ativo,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar relação: ${error.message}`);
  }

  return data as AssistenteTipo;
}

/**
 * Atualizar relação existente
 */
export async function atualizar(
  id: number,
  input: AtualizarAssistenteTipoInput
): Promise<AssistenteTipo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes_tipos_expedientes')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar relação: ${error.message}`);
  }

  return data as AssistenteTipo;
}

/**
 * Deletar relação
 */
export async function deletar(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('assistentes_tipos_expedientes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar relação: ${error.message}`);
  }
}

/**
 * Desativar todas as relações de um tipo e ativar uma nova
 */
export async function ativarRelacao(id: number, tipo_expediente_id: number): Promise<void> {
  const supabase = createServiceClient();

  // Desativar todas as relações deste tipo
  const { error: deactivateError } = await supabase
    .from('assistentes_tipos_expedientes')
    .update({ ativo: false })
    .eq('tipo_expediente_id', tipo_expediente_id)
    .eq('ativo', true);

  if (deactivateError) {
    throw new Error(`Erro ao desativar relações: ${deactivateError.message}`);
  }

  // Ativar a relação especificada
  const { error: activateError } = await supabase
    .from('assistentes_tipos_expedientes')
    .update({ ativo: true })
    .eq('id', id);

  if (activateError) {
    throw new Error(`Erro ao ativar relação: ${activateError.message}`);
  }
}
