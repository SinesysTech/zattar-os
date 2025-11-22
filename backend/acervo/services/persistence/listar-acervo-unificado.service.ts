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
 * Agrupa processos com mesmo numero_processo em um único item
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
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100

  // Estratégia: Buscar TODAS as instâncias que satisfazem os filtros,
  // agrupar em memória, depois paginar os grupos resultantes
  // NOTA: Para datasets muito grandes, pode ser necessário implementar
  // agrupamento via SQL com window functions, mas isso é mais complexo

  let query = supabase.from('acervo').select('*');

  // === APLICAR FILTROS ===

  // Filtros básicos
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  // Filtro de grau: aplicar ao grau atual (maior data_autuacao)
  // Por enquanto, buscamos todos os graus e filtramos depois do agrupamento
  // TODO: Otimizar com window function no SQL se necessário
  // if (params.grau) {
  //   query = query.eq('grau', params.grau);
  // }

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

  // Ordenação: aplicar ordenação básica, depois reordenar grupos se necessário
  const ordenarPor = params.ordenar_por ?? 'data_autuacao';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Buscar TODOS os registros que satisfazem os filtros
  // IMPORTANTE: Especificar range amplo para buscar todos os registros
  // (sem paginação ainda - paginação será aplicada após agrupamento)
  // Supabase limita a 1000 por padrão, então usamos range para buscar até 100k registros
  query = query.range(0, 100000);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar acervo unificado: ${error.message}`);
  }

  // Converter para Acervo e agrupar
  const processos = (data || []).map(converterParaAcervo);
  let processosUnificados = agruparInstancias(processos);

  // Filtro de grau: aplicar APÓS agrupamento (filtrar por grau atual)
  if (params.grau) {
    processosUnificados = processosUnificados.filter(
      p => p.grau_atual === params.grau
    );
  }

  // Total de processos únicos (APÓS filtro de grau se aplicável)
  const total = processosUnificados.length;

  // Ordenar processos unificados se necessário
  // (já vem ordenado pela query inicial, mas se filtro de grau foi aplicado pode precisar reordenar)
  if (params.ordenar_por) {
    const campo = params.ordenar_por;
    const asc = ordem === 'asc';
    processosUnificados.sort((a, b) => {
      const valA = a[campo as keyof ProcessoUnificado];
      const valB = b[campo as keyof ProcessoUnificado];
      if (valA == null && valB == null) return 0;
      if (valA == null) return asc ? 1 : -1;
      if (valB == null) return asc ? -1 : 1;
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  }

  // Aplicar paginação nos processos unificados
  const offset = (pagina - 1) * limite;
  const processosPaginados = processosUnificados.slice(offset, offset + limite);

  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAcervoUnificadoResult = {
    processos: processosPaginados,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result, ACERVO_UNIFICADO_TTL);
  return result;
}
