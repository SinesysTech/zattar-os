/**
 * Serviço de persistência para expedientes unificados (VIEW)
 * Consulta a VIEW que combina expedientes do PJE e expedientes manuais
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import {
  ExpedienteUnificado,
  ListarExpedientesUnificadosParams,
  ListarExpedientesUnificadosResult,
} from '@/backend/types/expedientes-manuais/types';

/**
 * Listar expedientes unificados (PJE + Manuais) com filtros e paginação
 */
export const listarExpedientesUnificados = async (
  params: ListarExpedientesUnificadosParams = {}
): Promise<ListarExpedientesUnificadosResult> => {
  const supabase = await createClient();

  const {
    pagina = 0,
    limite = 20,
    busca,
    origem,
    processo_id,
    trt,
    grau,
    tipo_expediente_id,
    responsavel_id,
    prazo_vencido,
    baixado,
    segredo_justica,
    juizo_digital,
    data_prazo_legal_inicio,
    data_prazo_legal_fim,
    data_autuacao_inicio,
    data_autuacao_fim,
    ordenar_por = 'created_at',
    ordem = 'desc',
  } = params;

  // Query base na VIEW
  let query = supabase
    .from('expedientes_unificados')
    .select('*', { count: 'exact' });

  // Filtros
  if (busca) {
    query = query.or(
      `numero_processo.ilike.%${busca}%,descricao.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%`
    );
  }

  if (origem) {
    query = query.eq('origem', origem);
  }

  if (processo_id !== undefined) {
    query = query.eq('processo_id', processo_id);
  }

  if (trt) {
    query = query.eq('trt', trt);
  }

  if (grau) {
    query = query.eq('grau', grau);
  }

  if (tipo_expediente_id !== undefined) {
    query = query.eq('tipo_expediente_id', tipo_expediente_id);
  }

  if (responsavel_id !== undefined) {
    if (responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else {
      query = query.eq('responsavel_id', responsavel_id);
    }
  }

  if (prazo_vencido !== undefined) {
    query = query.eq('prazo_vencido', prazo_vencido);
  }

  if (baixado !== undefined) {
    if (baixado) {
      query = query.not('baixado_em', 'is', null);
    } else {
      query = query.is('baixado_em', null);
    }
  }

  if (segredo_justica !== undefined) {
    query = query.eq('segredo_justica', segredo_justica);
  }

  if (juizo_digital !== undefined) {
    query = query.eq('juizo_digital', juizo_digital);
  }

  if (data_prazo_legal_inicio) {
    query = query.gte('data_prazo_legal', data_prazo_legal_inicio);
  }

  if (data_prazo_legal_fim) {
    query = query.lte('data_prazo_legal', data_prazo_legal_fim);
  }

  if (data_autuacao_inicio) {
    query = query.gte('data_autuacao', data_autuacao_inicio);
  }

  if (data_autuacao_fim) {
    query = query.lte('data_autuacao', data_autuacao_fim);
  }

  // Ordenação
  query = query.order(ordenar_por, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = pagina * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao listar expedientes unificados:', error);
    throw new Error(`Falha ao listar expedientes unificados: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    expedientes: data || [],
    total,
    pagina,
    limite,
    totalPaginas,
  };
};

/**
 * Buscar expediente unificado por ID e origem
 */
export const buscarExpedienteUnificadoPorId = async (
  id: number,
  origem: 'pje' | 'manual'
): Promise<ExpedienteUnificado | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expedientes_unificados')
    .select('*')
    .eq('id', id)
    .eq('origem', origem)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    console.error('Erro ao buscar expediente unificado:', error);
    throw new Error(`Falha ao buscar expediente unificado: ${error.message}`);
  }

  return data;
};
