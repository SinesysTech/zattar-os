// Serviço de persistência para listar pendentes de manifestação
// Gerencia consultas na tabela pendentes_manifestacao com filtros, paginação, ordenação e agrupamento

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  PendenteManifestacao,
  ListarPendentesParams,
  ListarPendentesResult,
  ListarPendentesAgrupadoResult,
  AgrupamentoPendente,
} from '@/backend/types/pendentes/types';

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaPendente(data: Record<string, unknown>): PendenteManifestacao {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    processo_id: (data.processo_id as number | null) ?? null,
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
    numero_processo: data.numero_processo as string,
    descricao_orgao_julgador: data.descricao_orgao_julgador as string,
    classe_judicial: data.classe_judicial as string,
    numero: data.numero as number,
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
    id_documento: (data.id_documento as number | null) ?? null,
    data_ciencia_parte: (data.data_ciencia_parte as string | null) ?? null,
    data_prazo_legal_parte: (data.data_prazo_legal_parte as string | null) ?? null,
    data_criacao_expediente: (data.data_criacao_expediente as string | null) ?? null,
    prazo_vencido: data.prazo_vencido as boolean,
    sigla_orgao_julgador: (data.sigla_orgao_julgador as string | null) ?? null,
    baixado_em: (data.baixado_em as string | null) ?? null,
    protocolo_id: (data.protocolo_id as number | null) ?? null,
    justificativa_baixa: (data.justificativa_baixa as string | null) ?? null,
    responsavel_id: (data.responsavel_id as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Lista pendentes de manifestação com filtros, paginação e ordenação
 */
export async function listarPendentes(
  params: ListarPendentesParams = {}
): Promise<ListarPendentesResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  let query = supabase.from('pendentes_manifestacao').select('*', { count: 'exact' });

  // Filtros básicos
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
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%,sigla_orgao_julgador.ilike.%${busca}%`
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

  if (params.sigla_orgao_julgador) {
    query = query.ilike('sigla_orgao_julgador', `%${params.sigla_orgao_julgador}%`);
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

  if (params.processo_id !== undefined) {
    query = query.eq('processo_id', params.processo_id);
  }

  // Filtro de baixa (status de baixa)
  if (params.baixado !== undefined) {
    if (params.baixado === true) {
      // Apenas baixados
      query = query.not('baixado_em', 'is', null);
    } else {
      // Apenas pendentes (não baixados)
      query = query.is('baixado_em', null);
    }
  }

  // Filtros específicos de pendentes
  if (params.prazo_vencido !== undefined) {
    query = query.eq('prazo_vencido', params.prazo_vencido);
  }

  if (params.data_prazo_legal_inicio) {
    query = query.gte('data_prazo_legal_parte', params.data_prazo_legal_inicio);
  }

  if (params.data_prazo_legal_fim) {
    query = query.lte('data_prazo_legal_parte', params.data_prazo_legal_fim);
  }

  if (params.data_ciencia_inicio) {
    query = query.gte('data_ciencia_parte', params.data_ciencia_inicio);
  }

  if (params.data_ciencia_fim) {
    query = query.lte('data_ciencia_parte', params.data_ciencia_fim);
  }

  if (params.data_criacao_expediente_inicio) {
    query = query.gte('data_criacao_expediente', params.data_criacao_expediente_inicio);
  }

  if (params.data_criacao_expediente_fim) {
    query = query.lte('data_criacao_expediente', params.data_criacao_expediente_fim);
  }

  // Filtros de data (comuns)
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

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'data_prazo_legal_parte';
  const ordem = params.ordem ?? (ordenarPor === 'data_prazo_legal_parte' ? 'asc' : 'desc');
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar pendentes de manifestação: ${error.message}`);
  }

  const pendentes = (data || []).map(converterParaPendente);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    pendentes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Lista pendentes de manifestação agrupado por um campo específico
 */
export async function listarPendentesAgrupado(
  params: ListarPendentesParams & { agrupar_por: string }
): Promise<ListarPendentesAgrupadoResult> {
  const supabase = createServiceClient();
  const incluirContagem = params.incluir_contagem !== false; // Padrão: true

  // Construir query base com filtros (sem paginação)
  let query = supabase.from('pendentes_manifestacao').select('*');

  // Aplicar os mesmos filtros da função listarPendentes
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
      `numero_processo.ilike.%${busca}%,nome_parte_autora.ilike.%${busca}%,nome_parte_re.ilike.%${busca}%,descricao_orgao_julgador.ilike.%${busca}%,classe_judicial.ilike.%${busca}%,sigla_orgao_julgador.ilike.%${busca}%`
    );
  }

  // Filtros específicos por campo
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.sigla_orgao_julgador) {
    query = query.ilike('sigla_orgao_julgador', `%${params.sigla_orgao_julgador}%`);
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

  if (params.processo_id !== undefined) {
    query = query.eq('processo_id', params.processo_id);
  }

  // Filtro de baixa (status de baixa)
  if (params.baixado !== undefined) {
    if (params.baixado === true) {
      // Apenas baixados
      query = query.not('baixado_em', 'is', null);
    } else {
      // Apenas pendentes (não baixados)
      query = query.is('baixado_em', null);
    }
  }

  // Filtros específicos de pendentes
  if (params.prazo_vencido !== undefined) {
    query = query.eq('prazo_vencido', params.prazo_vencido);
  }

  if (params.data_prazo_legal_inicio) {
    query = query.gte('data_prazo_legal_parte', params.data_prazo_legal_inicio);
  }

  if (params.data_prazo_legal_fim) {
    query = query.lte('data_prazo_legal_parte', params.data_prazo_legal_fim);
  }

  if (params.data_ciencia_inicio) {
    query = query.gte('data_ciencia_parte', params.data_ciencia_inicio);
  }

  if (params.data_ciencia_fim) {
    query = query.lte('data_ciencia_parte', params.data_ciencia_fim);
  }

  if (params.data_criacao_expediente_inicio) {
    query = query.gte('data_criacao_expediente', params.data_criacao_expediente_inicio);
  }

  if (params.data_criacao_expediente_fim) {
    query = query.lte('data_criacao_expediente', params.data_criacao_expediente_fim);
  }

  // Filtros de data (comuns)
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

  // Buscar todos os dados primeiro
  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar pendentes agrupado: ${error.message}`);
  }

  const pendentes = (data || []).map(converterParaPendente);

  // Agrupar em memória
  const grupos = new Map<string, PendenteManifestacao[]>();

  for (const pendente of pendentes) {
    let chaveGrupo: string;

    switch (params.agrupar_por) {
      case 'trt':
        chaveGrupo = pendente.trt;
        break;
      case 'grau':
        chaveGrupo = pendente.grau;
        break;
      case 'responsavel_id':
        chaveGrupo = pendente.responsavel_id?.toString() ?? 'sem_responsavel';
        break;
      case 'classe_judicial':
        chaveGrupo = pendente.classe_judicial;
        break;
      case 'codigo_status_processo':
        chaveGrupo = pendente.codigo_status_processo;
        break;
      case 'orgao_julgador':
        chaveGrupo = pendente.descricao_orgao_julgador;
        break;
      case 'mes_autuacao':
        // Extrair mês/ano da data de autuação
        const dataAutuacao = new Date(pendente.data_autuacao);
        chaveGrupo = `${dataAutuacao.getFullYear()}-${String(dataAutuacao.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'ano_autuacao':
        const dataAutuacaoAno = new Date(pendente.data_autuacao);
        chaveGrupo = dataAutuacaoAno.getFullYear().toString();
        break;
      case 'prazo_vencido':
        chaveGrupo = pendente.prazo_vencido ? 'vencido' : 'no_prazo';
        break;
      case 'mes_prazo_legal':
        // Extrair mês/ano da data do prazo legal
        if (pendente.data_prazo_legal_parte) {
          const dataPrazoLegal = new Date(pendente.data_prazo_legal_parte);
          chaveGrupo = `${dataPrazoLegal.getFullYear()}-${String(dataPrazoLegal.getMonth() + 1).padStart(2, '0')}`;
        } else {
          chaveGrupo = 'sem_prazo';
        }
        break;
      default:
        chaveGrupo = 'outros';
    }

    if (!grupos.has(chaveGrupo)) {
      grupos.set(chaveGrupo, []);
    }
    grupos.get(chaveGrupo)!.push(pendente);
  }

  // Converter para formato de resposta
  const agrupamentos: AgrupamentoPendente[] = Array.from(grupos.entries()).map(([grupo, pendentesGrupo]) => {
    const item: AgrupamentoPendente = {
      grupo,
      quantidade: pendentesGrupo.length,
    };

    if (!incluirContagem) {
      item.pendentes = pendentesGrupo;
    }

    return item;
  });

  // Ordenar por quantidade (decrescente)
  agrupamentos.sort((a, b) => b.quantidade - a.quantidade);

  return {
    agrupamentos,
    total: pendentes.length,
  };
}
