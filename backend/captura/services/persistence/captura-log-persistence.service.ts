// Serviço de persistência de histórico de capturas
// Gerencia operações de CRUD na tabela capturas_log

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  CapturaLog,
  CriarCapturaLogParams,
  AtualizarCapturaLogParams,
  ListarCapturasLogParams,
  ListarCapturasLogResult,
} from '@/backend/types/captura/capturas-log-types';

/**
 * Criar um novo registro de captura
 */
export async function criarCapturaLog(params: CriarCapturaLogParams): Promise<CapturaLog> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('capturas_log')
    .insert({
      tipo_captura: params.tipo_captura,
      advogado_id: params.advogado_id,
      credencial_ids: params.credencial_ids,
      status: params.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar registro de captura: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar registro de captura: nenhum dado retornado');
  }

  return data as CapturaLog;
}

/**
 * Atualizar registro de captura
 */
export async function atualizarCapturaLog(
  id: number,
  params: AtualizarCapturaLogParams
): Promise<CapturaLog> {
  const supabase = createServiceClient();

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Partial<CapturaLog> = {};
  
  if (params.status !== undefined) {
    updateData.status = params.status;
  }
  if (params.resultado !== undefined) {
    updateData.resultado = params.resultado;
  }
  if (params.erro !== undefined) {
    updateData.erro = params.erro;
  }
  if (params.concluido_em !== undefined) {
    updateData.concluido_em = params.concluido_em;
  }

  // Se status mudou para completed ou failed, atualizar concluido_em automaticamente
  if (params.status === 'completed' || params.status === 'failed') {
    if (!params.concluido_em) {
      updateData.concluido_em = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('capturas_log')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Registro de captura não encontrado');
    }
    throw new Error(`Erro ao atualizar registro de captura: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar registro de captura: nenhum dado retornado');
  }

  return data as CapturaLog;
}

/**
 * Buscar registro de captura por ID
 */
export async function buscarCapturaLog(id: number): Promise<CapturaLog | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('capturas_log')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar registro de captura: ${error.message}`);
  }

  return data as CapturaLog;
}

/**
 * Listar histórico de capturas com filtros e paginação
 */
export async function listarCapturasLog(
  params: ListarCapturasLogParams = {}
): Promise<ListarCapturasLogResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  let query = supabase.from('capturas_log').select('*', { count: 'exact' });

  // Filtros
  if (params.tipo_captura) {
    query = query.eq('tipo_captura', params.tipo_captura);
  }

  if (params.advogado_id) {
    query = query.eq('advogado_id', params.advogado_id);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  // Filtro por data (iniciado_em)
  if (params.data_inicio) {
    const dataInicio = new Date(params.data_inicio);
    dataInicio.setHours(0, 0, 0, 0);
    query = query.gte('iniciado_em', dataInicio.toISOString());
  }

  if (params.data_fim) {
    const dataFim = new Date(params.data_fim);
    dataFim.setHours(23, 59, 59, 999);
    query = query.lte('iniciado_em', dataFim.toISOString());
  }

  // Ordenação: mais recentes primeiro
  query = query.order('iniciado_em', { ascending: false });

  // Paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar histórico de capturas: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    capturas: (data || []) as CapturaLog[],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

