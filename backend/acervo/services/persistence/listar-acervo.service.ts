// Serviço de persistência para listar acervo
// Gerencia consultas na tabela acervo com filtros, paginação, ordenação e agrupamento

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCached, setCached } from '@/backend/utils/redis/cache-utils';
import { getAcervoListKey, getAcervoGroupKey } from '@/backend/utils/redis/cache-keys';
import type {
  Acervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  AgrupamentoAcervo,
} from '@/backend/types/acervo/types';

const ACERVO_TTL = 900; // 15 minutos

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaAcervo(data: Record<string, unknown>): Acervo {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    origem: data.origem as 'acervo_geral' | 'arquivado',
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
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
 * Lista acervo com filtros, paginação e ordenação
 */
export async function listarAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult> {
  const cacheKey = getAcervoListKey(params);
  const cached = await getCached<ListarAcervoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervo: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervo: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 2000); // Máximo 2000
  const offset = (pagina - 1) * limite;

  let query = supabase.from('acervo').select('*', { count: 'exact' });

  // Filtros básicos
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
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

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar acervo: ${error.message}`);
  }

  const processos = (data || []).map(converterParaAcervo);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAcervoResult = {
    processos,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result, ACERVO_TTL);
  return result;
}

/**
 * Lista acervo agrupado por um campo específico
 */
export async function listarAcervoAgrupado(
  params: ListarAcervoParams & { agrupar_por: string }
): Promise<ListarAcervoAgrupadoResult> {
  const cacheKey = getAcervoGroupKey(params);
  const cached = await getCached<ListarAcervoAgrupadoResult>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for listarAcervoAgrupado: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarAcervoAgrupado: ${cacheKey}`);

  const supabase = createServiceClient();
  const incluirContagem = params.incluir_contagem !== false; // Padrão: true

  // Construir query base com filtros (sem paginação)
  let query = supabase.from('acervo').select('*');

  // Aplicar os mesmos filtros da função listarAcervo
  if (params.origem) {
    query = query.eq('origem', params.origem);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  if (params.sem_responsavel === true) {
    query = query.is('responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('responsavel_id', params.responsavel_id);
    }
  }

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

  // Buscar todos os dados primeiro
  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar acervo agrupado: ${error.message}`);
  }

  const processos = (data || []).map(converterParaAcervo);

  // Agrupar em memória
  const grupos = new Map<string, Acervo[]>();

  for (const processo of processos) {
    let chaveGrupo: string;

    switch (params.agrupar_por) {
      case 'trt':
        chaveGrupo = processo.trt;
        break;
      case 'grau':
        chaveGrupo = processo.grau;
        break;
      case 'origem':
        chaveGrupo = processo.origem;
        break;
      case 'responsavel_id':
        chaveGrupo = processo.responsavel_id?.toString() ?? 'sem_responsavel';
        break;
      case 'classe_judicial':
        chaveGrupo = processo.classe_judicial;
        break;
      case 'codigo_status_processo':
        chaveGrupo = processo.codigo_status_processo;
        break;
      case 'orgao_julgador':
        chaveGrupo = processo.descricao_orgao_julgador;
        break;
      case 'mes_autuacao':
        // Extrair mês/ano da data de autuação
        const dataAutuacao = new Date(processo.data_autuacao);
        chaveGrupo = `${dataAutuacao.getFullYear()}-${String(dataAutuacao.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'ano_autuacao':
        const dataAutuacaoAno = new Date(processo.data_autuacao);
        chaveGrupo = dataAutuacaoAno.getFullYear().toString();
        break;
      default:
        chaveGrupo = 'outros';
    }

    if (!grupos.has(chaveGrupo)) {
      grupos.set(chaveGrupo, []);
    }
    grupos.get(chaveGrupo)!.push(processo);
  }

  // Converter para formato de resposta
  const agrupamentos: AgrupamentoAcervo[] = Array.from(grupos.entries()).map(([grupo, processosGrupo]) => {
    const item: AgrupamentoAcervo = {
      grupo,
      quantidade: processosGrupo.length,
    };

    if (!incluirContagem) {
      item.processos = processosGrupo;
    }

    return item;
  });

  // Ordenar por quantidade (decrescente)
  agrupamentos.sort((a, b) => b.quantidade - a.quantidade);

  const result: ListarAcervoAgrupadoResult = {
    agrupamentos,
    total: processos.length,
  };

  await setCached(cacheKey, result, ACERVO_TTL);
  return result;
}

/**
 * Busca um processo do acervo por ID
 */
export async function buscarAcervoPorId(id: number): Promise<Acervo | null> {
  const cacheKey = `acervo:id:${id}`;
  const cached = await getCached<Acervo>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for buscarAcervoPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarAcervoPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acervo')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar acervo: ${error.message}`);
  }

  const result = data ? converterParaAcervo(data) : null;
  if (result) {
    await setCached(cacheKey, result, ACERVO_TTL);
  }
  return result;
}