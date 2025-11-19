// Serviço de persistência para listar audiências
// Gerencia consultas na tabela audiencias com filtros, paginação e ordenação

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Audiencia,
  ListarAudienciasParams,
  ListarAudienciasResult,
} from '@/backend/types/audiencias/types';

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaAudiencia(data: Record<string, unknown>): Audiencia {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    processo_id: data.processo_id as number,
    orgao_julgador_id: (data.orgao_julgador_id as number | null) ?? null,
    orgao_julgador_descricao: (data.orgao_julgador_descricao as string | null) ?? null,
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
    numero_processo: data.numero_processo as string,
    classe_judicial: (data.classe_judicial as string | null) ?? null,
    classe_judicial_id: (data.classe_judicial_id as number | null) ?? null,
    data_inicio: data.data_inicio as string,
    data_fim: data.data_fim as string,
    sala_audiencia_nome: (data.sala_audiencia_nome as string | null) ?? null,
    sala_audiencia_id: (data.sala_audiencia_id as number | null) ?? null,
    status: data.status as string,
    status_descricao: (data.status_descricao as string | null) ?? null,
    tipo_audiencia_id: (data.tipo_audiencia_id as number | null) ?? null,
    tipo_descricao: (data.tipo_descricao as string | null) ?? null,
    tipo_codigo: (data.tipo_codigo as string | null) ?? null,
    tipo_is_virtual: (data.tipo_is_virtual as boolean) ?? false,
    designada: (data.designada as boolean) ?? false,
    em_andamento: (data.em_andamento as boolean) ?? false,
    documento_ativo: (data.documento_ativo as boolean) ?? false,
    polo_ativo_nome: (data.polo_ativo_nome as string | null) ?? null,
    polo_passivo_nome: (data.polo_passivo_nome as string | null) ?? null,
    url_audiencia_virtual: (data.url_audiencia_virtual as string | null) ?? null,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Lista audiências com filtros, paginação e ordenação
 * Usa responsavel_id diretamente da tabela audiencias
 */
export async function listarAudiencias(
  params: ListarAudienciasParams = {}
): Promise<ListarAudienciasResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  // Selecionar todos os campos da tabela audiencias e fazer JOIN com tabelas relacionadas
  let query = supabase
    .from('audiencias')
    .select(`
      *,
      orgao_julgador:orgao_julgador_id(descricao),
      classe_judicial:classe_judicial_id(descricao, sigla),
      tipo_audiencia:tipo_audiencia_id(descricao, codigo, is_virtual),
      sala_audiencia:sala_audiencia_id(nome)
    `, { count: 'exact' });

  // Filtros básicos (campos da tabela audiencias não precisam de prefixo)
  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  // Filtro de responsável (vem diretamente da tabela audiencias)
  if (params.sem_responsavel === true) {
    query = query.is('responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('responsavel_id', params.responsavel_id);
    }
  }

  // Busca textual (busca em múltiplos campos)
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `numero_processo.ilike.%${busca}%,polo_ativo_nome.ilike.%${busca}%,polo_passivo_nome.ilike.%${busca}%`
    );
  }

  // Filtros específicos por campo
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.polo_ativo_nome) {
    query = query.ilike('polo_ativo_nome', `%${params.polo_ativo_nome}%`);
  }

  if (params.polo_passivo_nome) {
    query = query.ilike('polo_passivo_nome', `%${params.polo_passivo_nome}%`);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.tipo_descricao) {
    query = query.ilike('tipo_descricao', `%${params.tipo_descricao}%`);
  }

  if (params.tipo_codigo) {
    query = query.eq('tipo_codigo', params.tipo_codigo);
  }

  if (params.tipo_is_virtual !== undefined) {
    query = query.eq('tipo_is_virtual', params.tipo_is_virtual);
  }

  // Filtros de data
  if (params.data_inicio_inicio) {
    query = query.gte('data_inicio', params.data_inicio_inicio);
  }

  if (params.data_inicio_fim) {
    query = query.lte('data_inicio', params.data_inicio_fim);
  }

  if (params.data_fim_inicio) {
    query = query.gte('data_fim', params.data_fim_inicio);
  }

  if (params.data_fim_fim) {
    query = query.lte('data_fim', params.data_fim_fim);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'data_inicio';
  const ordem = params.ordem ?? 'asc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar audiências: ${error.message}`);
  }

  // Converter dados para formato de retorno
  const audiencias = (data || []).map((row: Record<string, unknown>) => {
    // Extrair dados do JOIN
    const orgaoJulgador = row.orgao_julgador as Record<string, unknown> | null;
    const classeJudicial = row.classe_judicial as Record<string, unknown> | null;
    const tipoAudiencia = row.tipo_audiencia as Record<string, unknown> | null;
    const salaAudiencia = row.sala_audiencia as Record<string, unknown> | null;

    // Adicionar campos do JOIN ao objeto
    const rowWithJoins = {
      ...row,
      orgao_julgador_descricao: orgaoJulgador?.descricao ?? null,
      classe_judicial: classeJudicial?.descricao ?? null,
      tipo_descricao: tipoAudiencia?.descricao ?? null,
      tipo_codigo: tipoAudiencia?.codigo ?? null,
      tipo_is_virtual: tipoAudiencia?.is_virtual ?? false,
      sala_audiencia_nome: salaAudiencia?.nome ?? row.sala_audiencia_nome ?? null,
    };

    return converterParaAudiencia(rowWithJoins);
  });

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    audiencias,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

