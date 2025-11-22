// Serviço de persistência para listar acervo unificado
// Agrupa processos com mesmo numero_processo (multi-instância) em uma única visualização

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCached, setCached } from '@/backend/utils/redis/cache-utils';
import { getAcervoListKey } from '@/backend/utils/redis/cache-keys';
import type {
  Acervo,
  ListarAcervoParams,
  ProcessoUnificado,
  ProcessoInstancia,
  ListarAcervoUnificadoResult,
  GrauAcervo,
  OrigemAcervo,
} from '@/backend/types/acervo/types';

const ACERVO_UNIFICADO_TTL = 900; // 15 minutos

/**
 * Determina qual instância é o grau atual do processo
 * Baseado em maior data_autuacao (critério primário) e updated_at (desempate)
 */
function identificarGrauAtual(instances: ProcessoInstancia[]): number {
  if (instances.length === 0) return -1;
  if (instances.length === 1) return 0;

  let idxAtual = 0;
  let maiorDataAutuacao = new Date(instances[0].data_autuacao);
  let maiorUpdated = new Date(instances[0].updated_at);

  for (let i = 1; i < instances.length; i++) {
    const dataAutuacao = new Date(instances[i].data_autuacao);
    const updated = new Date(instances[i].updated_at);

    // Critério primário: maior data_autuacao
    if (dataAutuacao > maiorDataAutuacao) {
      idxAtual = i;
      maiorDataAutuacao = dataAutuacao;
      maiorUpdated = updated;
    }
    // Desempate: maior updated_at
    else if (dataAutuacao.getTime() === maiorDataAutuacao.getTime() && updated > maiorUpdated) {
      idxAtual = i;
      maiorUpdated = updated;
    }
  }

  return idxAtual;
}

/**
 * Agrupa instâncias de processo em ProcessoUnificado
 */
function agruparInstancias(processos: Acervo[]): ProcessoUnificado[] {
  // Agrupar por numero_processo
  const grupos = new Map<string, Acervo[]>();
  for (const processo of processos) {
    const existing = grupos.get(processo.numero_processo) || [];
    existing.push(processo);
    grupos.set(processo.numero_processo, existing);
  }

  // Converter cada grupo em ProcessoUnificado
  const processosUnificados: ProcessoUnificado[] = [];

  for (const [numero_processo, instancias] of grupos) {
    // Criar metadados de instâncias
    const instances: ProcessoInstancia[] = instancias.map(inst => ({
      id: inst.id,
      grau: inst.grau,
      origem: inst.origem,
      trt: inst.trt,
      data_autuacao: inst.data_autuacao,
      updated_at: inst.updated_at,
      is_grau_atual: false, // Será atualizado abaixo
    }));

    // Identificar grau atual
    const idxGrauAtual = identificarGrauAtual(instances);
    instances[idxGrauAtual].is_grau_atual = true;

    const instanciaPrincipal = instancias[idxGrauAtual];
    const grausAtivos = instances.map(i => i.grau);

    // Montar ProcessoUnificado usando instância principal
    const processoUnificado: ProcessoUnificado = {
      id: instanciaPrincipal.id,
      id_pje: instanciaPrincipal.id_pje,
      advogado_id: instanciaPrincipal.advogado_id,
      trt: instanciaPrincipal.trt,
      numero_processo,
      numero: instanciaPrincipal.numero,
      descricao_orgao_julgador: instanciaPrincipal.descricao_orgao_julgador,
      classe_judicial: instanciaPrincipal.classe_judicial,
      segredo_justica: instanciaPrincipal.segredo_justica,
      codigo_status_processo: instanciaPrincipal.codigo_status_processo,
      prioridade_processual: instanciaPrincipal.prioridade_processual,
      nome_parte_autora: instanciaPrincipal.nome_parte_autora,
      qtde_parte_autora: instanciaPrincipal.qtde_parte_autora,
      nome_parte_re: instanciaPrincipal.nome_parte_re,
      qtde_parte_re: instanciaPrincipal.qtde_parte_re,
      data_autuacao: instanciaPrincipal.data_autuacao,
      juizo_digital: instanciaPrincipal.juizo_digital,
      data_arquivamento: instanciaPrincipal.data_arquivamento,
      data_proxima_audiencia: instanciaPrincipal.data_proxima_audiencia,
      tem_associacao: instanciaPrincipal.tem_associacao,
      responsavel_id: instanciaPrincipal.responsavel_id,
      created_at: instanciaPrincipal.created_at,
      updated_at: instanciaPrincipal.updated_at,
      grau_atual: instances[idxGrauAtual].grau,
      instances,
      graus_ativos: grausAtivos as GrauAcervo[],
    };

    processosUnificados.push(processoUnificado);
  }

  return processosUnificados;
}

/**
 * Converte dados do banco para formato Acervo
 */
function converterParaAcervo(data: Record<string, unknown>): Acervo {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    origem: data.origem as OrigemAcervo,
    trt: data.trt as string,
    grau: data.grau as GrauAcervo,
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
  // (sem paginação ainda - paginação será aplicada após agrupamento)
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
