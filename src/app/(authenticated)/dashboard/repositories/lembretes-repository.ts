/**
 * Repository para Lembretes (Reminders)
 * Camada de acesso a dados para lembretes do dashboard
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Lembrete,
  CriarLembreteInput,
  AtualizarLembreteInput,
  ListarLembretesParams,
} from '../domain';

/**
 * Busca lembretes de um usuário
 */
export async function buscarLembretes(
  params: ListarLembretesParams
): Promise<Lembrete[]> {
  const supabase = await createClient();

  let query = supabase
    .from('reminders')
    .select('*')
    .eq('usuario_id', params.usuario_id)
    .order('data_lembrete', { ascending: true })
    .limit(params.limite);

  // Filtrar por status de conclusão se especificado
  if (params.concluido !== undefined) {
    query = query.eq('concluido', params.concluido);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar lembretes:', error);
    throw new Error(`Erro ao buscar lembretes: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    usuario_id: row.usuario_id,
    texto: row.texto,
    prioridade: row.prioridade as 'low' | 'medium' | 'high',
    categoria: row.categoria,
    data_lembrete: row.data_lembrete,
    concluido: row.concluido,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * Busca um lembrete específico por ID
 */
export async function buscarLembretePorId(
  id: number,
  usuarioId: number
): Promise<Lembrete | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', usuarioId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    console.error('Erro ao buscar lembrete:', error);
    throw new Error(`Erro ao buscar lembrete: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    usuario_id: data.usuario_id,
    texto: data.texto,
    prioridade: data.prioridade as 'low' | 'medium' | 'high',
    categoria: data.categoria,
    data_lembrete: data.data_lembrete,
    concluido: data.concluido,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Cria um novo lembrete
 */
export async function criarLembrete(
  input: CriarLembreteInput,
  usuarioId: number
): Promise<Lembrete> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      usuario_id: usuarioId,
      texto: input.texto,
      prioridade: input.prioridade,
      categoria: input.categoria,
      data_lembrete: input.data_lembrete,
      concluido: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar lembrete:', error);
    throw new Error(`Erro ao criar lembrete: ${error.message}`);
  }

  return {
    id: data.id,
    usuario_id: data.usuario_id,
    texto: data.texto,
    prioridade: data.prioridade as 'low' | 'medium' | 'high',
    categoria: data.categoria,
    data_lembrete: data.data_lembrete,
    concluido: data.concluido,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Atualiza um lembrete existente
 */
export async function atualizarLembrete(
  input: AtualizarLembreteInput,
  usuarioId: number
): Promise<Lembrete> {
  const supabase = await createClient();

  const updateData: Record<string, string | boolean | undefined> = {};

  if (input.texto !== undefined) updateData.texto = input.texto;
  if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;
  if (input.categoria !== undefined) updateData.categoria = input.categoria;
  if (input.data_lembrete !== undefined)
    updateData.data_lembrete = input.data_lembrete;
  if (input.concluido !== undefined) updateData.concluido = input.concluido;

  const { data, error } = await supabase
    .from('reminders')
    .update(updateData)
    .eq('id', input.id)
    .eq('usuario_id', usuarioId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar lembrete:', error);
    throw new Error(`Erro ao atualizar lembrete: ${error.message}`);
  }

  if (!data) {
    throw new Error('Lembrete não encontrado ou você não tem permissão');
  }

  return {
    id: data.id,
    usuario_id: data.usuario_id,
    texto: data.texto,
    prioridade: data.prioridade as 'low' | 'medium' | 'high',
    categoria: data.categoria,
    data_lembrete: data.data_lembrete,
    concluido: data.concluido,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Marca um lembrete como concluído ou não concluído
 */
export async function marcarLembreteConcluido(
  id: number,
  concluido: boolean,
  usuarioId: number
): Promise<Lembrete> {
  return atualizarLembrete({ id, concluido }, usuarioId);
}

/**
 * Deleta um lembrete
 */
export async function deletarLembrete(
  id: number,
  usuarioId: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuarioId);

  if (error) {
    console.error('Erro ao deletar lembrete:', error);
    throw new Error(`Erro ao deletar lembrete: ${error.message}`);
  }
}

/**
 * Conta lembretes pendentes (não concluídos) de um usuário
 */
export async function contarLembretesPendentes(
  usuarioId: number
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('concluido', false);

  if (error) {
    console.error('Erro ao contar lembretes pendentes:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Busca lembretes vencidos (data_lembrete já passou e ainda não concluídos)
 */
export async function buscarLembretesVencidos(
  usuarioId: number
): Promise<Lembrete[]> {
  const supabase = await createClient();

  const agora = new Date().toISOString();

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('concluido', false)
    .lt('data_lembrete', agora)
    .order('data_lembrete', { ascending: true });

  if (error) {
    console.error('Erro ao buscar lembretes vencidos:', error);
    throw new Error(`Erro ao buscar lembretes vencidos: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    usuario_id: row.usuario_id,
    texto: row.texto,
    prioridade: row.prioridade as 'low' | 'medium' | 'high',
    categoria: row.categoria,
    data_lembrete: row.data_lembrete,
    concluido: row.concluido,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
