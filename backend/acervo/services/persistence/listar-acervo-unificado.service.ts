// Serviço de persistência para listar acervo unificado
// Usa VIEW materializada acervo_unificado para agrupamento eficiente no banco
// Elimina necessidade de carregar e agrupar grandes volumes em memória

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCached, setCached } from '@/backend/utils/redis/cache-utils';
import { getAcervoListKey } from '@/backend/utils/redis/cache-keys';
import type {
  ListarAcervoParams,
  ProcessoUnificado,
  ProcessoInstancia,
  ListarAcervoUnificadoResult,
  GrauAcervo,
} from '@/backend/types/acervo/types';

const ACERVO_UNIFICADO_TTL = 900; // 15 minutos

/**
 * Converte JSONB de instâncias da VIEW para formato ProcessoInstancia[]
 */
function converterInstances(instancesJson: unknown): ProcessoInstancia[] {
  if (!Array.isArray(instancesJson)) {
    return [];
  }

  return instancesJson.map((inst: Record<string, unknown>) => ({
    id: inst.id as number,
    grau: inst.grau as GrauAcervo,
    origem: inst.origem as 'acervo_geral' | 'arquivado',
    trt: inst.trt as string,
    data_autuacao: inst.data_autuacao as string,
    updated_at: inst.updated_at as string,
    is_grau_atual: (inst.is_grau_atual as boolean) ?? false,
  }));
}

/**
 * Converte dados da VIEW materializada para formato ProcessoUnificado
 */
function converterParaProcessoUnificado(data: Record<string, unknown>): ProcessoUnificado {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    trt: data.trt as string,
    numero_processo: data.numero_processo as string,
    numero: data.numero as number,
    descricao_orgao_julgador: data.descricao_orgao_julgador as string,
    classe_judicial: data.classe_judicial as string,
    segredo_justica: data.segredo_justica as boolean,
    codigo_status_processo: data.codigo_status_processo as string,
    prioridade_processual: data.prioridade_processual as number,
    nome_parte_autora: data.nome_parte_autora as string,
    qtde_parte_autora: data.qtde_parte_autora as number,
    nome_parte_re: data.nome_parte_re as string,
    qtde_parte_re: data.qtde_parte_re as number,
    data_autuacao: data.data_autuacao as string,
    juizo_digital: data.juizo_digital as boolean,
    data_arquivamento: (data.data_arquivamento as string | null) ?? null,
    data_proxima_audiencia: (data.data_proxima_audiencia as string | null) ?? null,
    tem_associacao: data.tem_associacao as boolean,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    grau_atual: data.grau_atual as GrauAcervo,
    graus_ativos: (data.graus_ativos as GrauAcervo[]) ?? [],
    instances: converterInstances(data.instances),
  };
}

/**
 * Lista acervo unificado com filtros, paginação e ordenação
 * Usa VIEW materializada acervo_unificado para agrupamento eficiente no banco
 * Elimina necessidade de carregar grandes volumes em memória
 */
export async function listarAcervoUnificado(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoUnificadoResult> {
  const cacheKey = getAcervoListKey({ ...params, unified: true });
  const cached = await getCached<ListarAcervoUnificadoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervoUnificado: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervoUnificado: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 2000); // Máximo 2000
  const offset = (pagina - 1) * limite;

  // Usar VIEW materializada acervo_unificado
  // A VIEW já faz o agrupamento por numero_processo no banco
  let query = supabase.from('acervo_unificado').select('*', { count: 'exact' });

  // === APLICAR FILTROS ===

  // Filtros básicos
  // Filtro por origem: filtra pela origem da instância principal (grau atual)
  // A VIEW materializada inclui o campo origem da instância principal
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  // Filtro de grau: aplicar ao grau atual
  if (params.grau) {
    query = query.eq('grau_atual', params.grau);
  }

  // Filtro de responsável
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
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%`
    );
  }

  // Filtros específicos por campo
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.nome_parte_autora) {
    query = query.ilike('nome_parte_autora', `%${params.nome_parte_autora}%`);
  }

  if (params.nome_parte_re) {
    query = query.ilike('nome_parte_re', `%${params.nome_parte_re}%`);
  }

  if (params.descricao_orgao_julgador) {
    query = query.ilike('descricao_orgao_julgador', `%${params.descricao_orgao_julgador}%`);
  }

  if (params.classe_judicial) {
    query = query.eq('classe_judicial', params.classe_judicial);
  }

  if (params.codigo_status_processo) {
    query = query.eq('codigo_status_processo', params.codigo_status_processo);
  }

  if (params.segredo_justica !== undefined) {
    query = query.eq('segredo_justica', params.segredo_justica);
  }

  if (params.juizo_digital !== undefined) {
    query = query.eq('juizo_digital', params.juizo_digital);
  }

  if (params.tem_associacao !== undefined) {
    query = query.eq('tem_associacao', params.tem_associacao);
  }

  // Filtros de data
  if (params.data_autuacao_inicio) {
    query = query.gte('data_autuacao', params.data_autuacao_inicio);
  }

  if (params.data_autuacao_fim) {
    query = query.lte('data_autuacao', params.data_autuacao_fim);
  }

  if (params.data_arquivamento_inicio) {
    query = query.gte('data_arquivamento', params.data_arquivamento_inicio);
  }

  if (params.data_arquivamento_fim) {
    query = query.lte('data_arquivamento', params.data_arquivamento_fim);
  }

  if (params.data_proxima_audiencia_inicio) {
    query = query.gte('data_proxima_audiencia', params.data_proxima_audiencia_inicio);
  }

  if (params.data_proxima_audiencia_fim) {
    query = query.lte('data_proxima_audiencia', params.data_proxima_audiencia_fim);
  }

  if (params.tem_proxima_audiencia === true) {
    query = query.not('data_proxima_audiencia', 'is', null);
  } else if (params.tem_proxima_audiencia === false) {
    query = query.is('data_proxima_audiencia', null);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'data_autuacao';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação (agora no banco, não em memória!)
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar acervo unificado: ${error.message}`);
  }

  // Converter dados da VIEW para ProcessoUnificado
  const processosUnificados = (data || []).map(converterParaProcessoUnificado);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAcervoUnificadoResult = {
    processos: processosUnificados,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result, ACERVO_UNIFICADO_TTL);
  return result;
}
