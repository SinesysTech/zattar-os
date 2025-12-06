// Serviço de persistência para listar audiências
// Gerencia consultas na tabela audiencias com filtros, paginação e ordenação

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCached, setCached } from '@/backend/utils/redis/cache-utils';
import { getAudienciasListKey } from '@/backend/utils/redis/cache-keys';
import type {
  Audiencia,
  ListarAudienciasParams,
  ListarAudienciasResult,
  ModalidadeAudiencia,
  PresencaHibrida,
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
    hora_inicio: (data.hora_inicio as string | null) ?? null,
    hora_fim: (data.hora_fim as string | null) ?? null,
    modalidade: (data.modalidade as ModalidadeAudiencia | null) ?? null,
    presenca_hibrida: (data.presenca_hibrida as PresencaHibrida | null) ?? null,
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
    nome_parte_autora: (data.nome_parte_autora as string | null) ?? null,
    nome_parte_re: (data.nome_parte_re as string | null) ?? null,
    polo_ativo_nome: (data.polo_ativo_nome as string | null) ?? null,
    polo_passivo_nome: (data.polo_passivo_nome as string | null) ?? null,
    url_audiencia_virtual: (data.url_audiencia_virtual as string | null) ?? null,
    url_ata_audiencia: (data.url_ata_audiencia as string | null) ?? null,
    ata_audiencia_id: (data.ata_audiencia_id as number | null) ?? null,
    endereco_presencial: (data.endereco_presencial as {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      pais?: string;
      cep?: string;
    } | null) ?? null,
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
  const cacheKey = getAudienciasListKey(params);
  const cachedResult = await getCached<ListarAudienciasResult>(cacheKey);

  if (cachedResult) {
    console.log(`Cache hit for audiencias list: ${cacheKey}`);
    return cachedResult;
  }

  console.log(`Cache miss for audiencias list: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 1000); // Máximo 1000 (para visualizações de calendário)
  const offset = (pagina - 1) * limite;

  // Selecionar todos os campos da tabela audiencias e fazer JOIN com tabelas relacionadas
  // tipo_descricao e tipo_is_virtual vêm do JOIN com tipo_audiencia
  // modalidade já é calculada automaticamente pelo trigger no banco
  let query = supabase
    .from('audiencias')
    .select(`
      *,
      orgao_julgador!orgao_julgador_id(descricao),
      classe_judicial!classe_judicial_id(descricao, sigla),
      tipo_audiencia!tipo_audiencia_id(descricao, is_virtual, codigo)
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

  // Filtros de tipo_audiencia (via tabela relacionada)
  if (params.tipo_descricao) {
    query = query.ilike('tipo_audiencia.descricao', `%${params.tipo_descricao}%`);
  }

  if (params.tipo_codigo) {
    query = query.eq('tipo_audiencia.codigo', params.tipo_codigo);
  }

  if (params.tipo_is_virtual !== undefined) {
    query = query.eq('tipo_audiencia.is_virtual', params.tipo_is_virtual);
  }

  // Filtro de modalidade (virtual, presencial, híbrida)
  if (params.modalidade) {
    query = query.eq('modalidade', params.modalidade);
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
  // Buscar partes fixas (parte autora/ré) no 1º grau para exibir corretamente
  const numerosProcesso = Array.from(new Set((data || []).map((row) => row.numero_processo as string)));
  const partesPrimeiroGrau = new Map<string, { nome_parte_autora: string | null; nome_parte_re: string | null }>();

  if (numerosProcesso.length > 0) {
    const { data: partesData, error: partesError } = await supabase
      .from('acervo')
      .select('numero_processo, nome_parte_autora, nome_parte_re')
      .in('numero_processo', numerosProcesso)
      .eq('grau', 'primeiro_grau');

    if (!partesError && partesData) {
      partesData.forEach((p) => {
        partesPrimeiroGrau.set(p.numero_processo, {
          nome_parte_autora: p.nome_parte_autora,
          nome_parte_re: p.nome_parte_re,
        });
      });
    }
  }

  const audiencias = (data || []).map((row: Record<string, unknown>) => {
    // Extrair dados dos JOINs
    const orgaoJulgador = row.orgao_julgador as Record<string, unknown> | null;
    const classeJudicial = row.classe_judicial as Record<string, unknown> | null;
    const tipoAudiencia = row.tipo_audiencia as Record<string, unknown> | null;

    // tipo_descricao, tipo_is_virtual e tipo_codigo vêm do JOIN com tipo_audiencia
    const tipoDescricao = tipoAudiencia?.descricao as string | null;
    const tipoIsVirtual = tipoAudiencia?.is_virtual as boolean | null;
    const tipoCodigo = tipoAudiencia?.codigo as string | null;

    // Adicionar campos do JOIN ao objeto
    // modalidade já vem calculado automaticamente pelo trigger no banco
    const rowWithJoins = {
      ...row,
      orgao_julgador_descricao: orgaoJulgador?.descricao ?? null,
      classe_judicial: classeJudicial?.sigla ?? classeJudicial?.descricao ?? null,
      tipo_descricao: tipoDescricao,
      tipo_is_virtual: tipoIsVirtual ?? false,
      tipo_codigo: tipoCodigo,
      // Partes fixas (autor/ré) vindas do 1º grau; fallback para polos se não houver
      nome_parte_autora:
        partesPrimeiroGrau.get(row.numero_processo as string)?.nome_parte_autora ??
        ((row.polo_ativo_nome as string | null) ?? null),
      nome_parte_re:
        partesPrimeiroGrau.get(row.numero_processo as string)?.nome_parte_re ??
        ((row.polo_passivo_nome as string | null) ?? null),
      // sala_audiencia_nome e modalidade já vêm diretamente da tabela audiencias
    };

    return converterParaAudiencia(rowWithJoins);
  });

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarAudienciasResult = {
    audiencias,
    total,
    pagina,
    limite,
    totalPaginas,
  };

  await setCached(cacheKey, result);

  return result;
}
