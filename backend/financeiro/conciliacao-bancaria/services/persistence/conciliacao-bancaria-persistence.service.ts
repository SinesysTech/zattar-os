import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import type {
  TransacaoParsed,
  TransacaoBancariaImportada,
  TransacaoComConciliacao,
  ConciliacaoBancaria,
  ImportarExtratoResponse,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  ConciliarManualDTO,
  SugestaoConciliacao,
  StatusConciliacao,
  BuscarLancamentosManuaisParams,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import type { LancamentoFinanceiroResumo } from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { calcularHashTransacao } from '../../parsers';
import { JANELA_DIAS_BUSCA_CANDIDATOS } from '@/backend/types/financeiro/conciliacao-bancaria.types';

const CACHE_TTL = 600; // 10 minutos

interface TransacaoRecord {
  id: number;
  conta_bancaria_id: number;
  data_transacao: string;
  descricao: string;
  valor: number;
  tipo_transacao: 'credito' | 'debito';
  documento: string | null;
  saldo_extrato: number | null;
  dados_originais: Record<string, unknown>;
  hash_transacao: string;
  arquivo_importacao: string;
  created_by: number;
  created_at: string;
}

interface ConciliacaoRecord {
  id: number;
  transacao_importada_id: number;
  lancamento_financeiro_id: number | null;
  status: StatusConciliacao;
  tipo_conciliacao: 'automatica' | 'manual' | null;
  score_similaridade: number | null;
  observacoes: string | null;
  dados_adicionais: Record<string, unknown> | null;
  conciliado_por: number | null;
  data_conciliacao: string | null;
  created_at: string;
  updated_at: string;
}

interface LancamentoRecord extends LancamentoFinanceiroResumo {
  conta_bancaria_id?: number | null;
  documento?: string | null;
  status?: string;
}

interface TransacaoJoined extends TransacaoRecord {
  contas_bancarias?: {
    id: number;
    nome: string;
    banco: string | null;
    agencia: string | null;
    conta: string | null;
  } | null;
  conciliacoes_bancarias?: ConciliacaoRecord | null;
  lancamentos_financeiros?: LancamentoRecord | null;
}

// ----------------------------------------------------------------------------
// Mappers
// ----------------------------------------------------------------------------

export const mapTransacaoRecord = (record: TransacaoRecord): TransacaoBancariaImportada => ({
  id: record.id,
  contaBancariaId: record.conta_bancaria_id,
  dataTransacao: record.data_transacao,
  descricao: record.descricao,
  valor: Number(record.valor),
  tipoTransacao: record.tipo_transacao,
  documento: record.documento,
  saldoExtrato: record.saldo_extrato,
  dadosOriginais: record.dados_originais || {},
  hashTransacao: record.hash_transacao,
  arquivoImportacao: record.arquivo_importacao,
  createdBy: record.created_by,
  createdAt: record.created_at,
});

export const mapConciliacaoRecord = (record: ConciliacaoRecord): ConciliacaoBancaria => ({
  id: record.id,
  transacaoImportadaId: record.transacao_importada_id,
  lancamentoFinanceiroId: record.lancamento_financeiro_id,
  status: record.status,
  tipoConciliacao: record.tipo_conciliacao,
  scoreSimilaridade: record.score_similaridade,
  observacoes: record.observacoes,
  dadosAdicionais: record.dados_adicionais,
  conciliadoPor: record.conciliado_por,
  dataConciliacao: record.data_conciliacao,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const mapTransacaoComConciliacaoRecord = (
  record: TransacaoJoined
): TransacaoComConciliacao => {
  const base = mapTransacaoRecord(record);

  const contaBancaria = record.contas_bancarias
    ? {
        id: record.contas_bancarias.id,
        nome: record.contas_bancarias.nome,
        banco: record.contas_bancarias.banco,
        agencia: record.contas_bancarias.agencia,
        conta: record.contas_bancarias.conta,
      }
    : undefined;

  const lancamentoVinculado = record.lancamentos_financeiros
    ? {
        id: record.lancamentos_financeiros.id,
        descricao: record.lancamentos_financeiros.descricao,
        valor: Number(record.lancamentos_financeiros.valor),
        dataLancamento: record.lancamentos_financeiros.data_lancamento,
        dataVencimento: record.lancamentos_financeiros.data_vencimento || null,
        tipo: record.lancamentos_financeiros.tipo as 'receita' | 'despesa',
        status: record.lancamentos_financeiros.status || 'pendente',
        contaContabilNome: record.lancamentos_financeiros.contaContabilNome,
        centroCustoNome: record.lancamentos_financeiros.centroCustoNome,
      }
    : undefined;

  const conciliacao = record.conciliacoes_bancarias
    ? mapConciliacaoRecord(record.conciliacoes_bancarias)
    : undefined;

  return {
    ...base,
    contaBancaria,
    conciliacao,
    lancamentoVinculado,
  };
};

// ----------------------------------------------------------------------------
// Cache helpers
// ----------------------------------------------------------------------------

const cacheListKey = (params: ListarTransacoesImportadasParams) =>
  generateCacheKey('conciliacao:transacoes', params as Record<string, unknown>);

const cacheByIdKey = (id: number) => `conciliacao:transacao:${id}`;

// ----------------------------------------------------------------------------
// Importa\u00e7\u00e3o
// ----------------------------------------------------------------------------

export const importarTransacoes = async (
  contaBancariaId: number,
  transacoes: TransacaoParsed[],
  arquivoNome: string,
  usuarioId: number,
  tipoArquivo: 'ofx' | 'csv'
): Promise<ImportarExtratoResponse> => {
  const supabase = createServiceClient();

  let duplicatasIgnoradas = 0;
  const novasTransacoes: Array<Partial<TransacaoRecord>> = [];
  const agora = new Date().toISOString();

  const hashes = transacoes.map((transacao) =>
    calcularHashTransacao(contaBancariaId, transacao.dataTransacao, transacao.valor, transacao.descricao)
  );

  const hashesUnicos = Array.from(new Set(hashes));

  const { data: hashesExistentes, error: erroBusca } = await supabase
    .from('transacoes_bancarias_importadas')
    .select('hash_transacao')
    .eq('conta_bancaria_id', contaBancariaId)
    .in('hash_transacao', hashesUnicos);

  if (erroBusca) {
    throw new Error(`Erro ao verificar duplicatas: ${erroBusca.message}`);
  }

  const hashSet = new Set((hashesExistentes || []).map((h) => h.hash_transacao as string));

  transacoes.forEach((transacao, index) => {
    const hash = hashes[index];

    if (hashSet.has(hash)) {
      duplicatasIgnoradas++;
      return;
    }

    novasTransacoes.push({
      conta_bancaria_id: contaBancariaId,
      data_transacao: transacao.dataTransacao,
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo_transacao: transacao.tipoTransacao,
      documento: transacao.documento || null,
      saldo_extrato: transacao.saldoExtrato ?? null,
      dados_originais: transacao.dadosOriginais,
      hash_transacao: hash,
      arquivo_importacao: arquivoNome,
      created_by: usuarioId,
      created_at: agora,
    });
  });

  let transacoesCriadas: TransacaoRecord[] = [];

  if (novasTransacoes.length > 0) {
    const { data, error } = await supabase
      .from('transacoes_bancarias_importadas')
      .insert(novasTransacoes)
      .select('*');

    if (error) {
      throw new Error(`Erro ao inserir transa\u00e7\u00f5es: ${error.message}`);
    }

    transacoesCriadas = (data || []) as TransacaoRecord[];

    // Criar registros de concilia\u00e7\u00e3o pendentes
    const conciliacoes = transacoesCriadas.map((t) => ({
      transacao_importada_id: t.id,
      lancamento_financeiro_id: null,
      status: 'pendente' as StatusConciliacao,
      tipo_conciliacao: null,
      score_similaridade: null,
      observacoes: null,
      dados_adicionais: null,
      conciliado_por: null,
      data_conciliacao: null,
      created_at: agora,
      updated_at: agora,
    }));

    const { error: erroConciliacoes } = await supabase
      .from('conciliacoes_bancarias')
      .insert(conciliacoes);

    if (erroConciliacoes) {
      throw new Error(`Erro ao criar registros de concilia\u00e7\u00e3o: ${erroConciliacoes.message}`);
    }
  }

  await invalidarCacheConciliacao();

  return {
    sucesso: true,
    transacoesImportadas: transacoesCriadas.length,
    duplicatasIgnoradas,
    erros: [],
    detalhes: {
      arquivoNome,
      tipoArquivo,
      contaBancariaId,
      dataImportacao: agora,
    },
  };
};

// ----------------------------------------------------------------------------
// Listagem e busca
// ----------------------------------------------------------------------------

export const listarTransacoesImportadas = async (
  params: ListarTransacoesImportadasParams
): Promise<ListarTransacoesResponse> => {
  const cacheKey = cacheListKey(params);
  const cached = await getCached<ListarTransacoesResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();
  const {
    pagina = 1,
    limite = 50,
    contaBancariaId,
    dataInicio,
    dataFim,
    statusConciliacao,
    busca,
    tipoTransacao,
    ordenarPor = 'data_transacao',
    ordem = 'desc',
  } = params;

  const campoOrdenacaoMap: Record<string, string> = {
    data_transacao: 'data_transacao',
    valor: 'valor',
    descricao: 'descricao',
    created_at: 'created_at',
  };

  const campoOrdenacao = campoOrdenacaoMap[ordenarPor] || 'data_transacao';
  const crescente = ordem === 'asc';

  let query = supabase
    .from('transacoes_bancarias_importadas')
    .select(
      `
      *,
      contas_bancarias (id, nome, banco, agencia, conta),
      conciliacoes_bancarias (*),
      lancamentos_financeiros (
        id,
        descricao,
        valor,
        data_lancamento,
        data_vencimento,
        tipo,
        status,
        conta_contabil_id,
        centro_custo_id,
        conta_bancaria_id
      )
    `,
      { count: 'exact' }
    )
    .order(campoOrdenacao, { ascending: crescente });

  if (contaBancariaId) {
    query = query.eq('conta_bancaria_id', contaBancariaId);
  }

  if (tipoTransacao) {
    query = query.eq('tipo_transacao', tipoTransacao);
  }

  if (dataInicio) {
    query = query.gte('data_transacao', dataInicio);
  }

  if (dataFim) {
    query = query.lte('data_transacao', dataFim);
  }

  if (statusConciliacao) {
    if (Array.isArray(statusConciliacao)) {
      query = query.in('conciliacoes_bancarias.status', statusConciliacao);
    } else {
      query = query.eq('conciliacoes_bancarias.status', statusConciliacao);
    }
  }

  if (busca) {
    query = query.or(`descricao.ilike.%${busca}%,documento.ilike.%${busca}%`);
  }

  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar transa\u00e7\u00f5es importadas: ${error.message}`);
  }

  const items = (data || []).map((r) => mapTransacaoComConciliacaoRecord(r as TransacaoJoined));

  // Resumo por status
  const resumo: ListarTransacoesResponse['resumo'] = {
    totalPendentes: 0,
    totalConciliadas: 0,
    totalDivergentes: 0,
    totalIgnoradas: 0,
    valorTotalPendentes: 0,
    valorTotalConciliadas: 0,
  };

  for (const item of items) {
    const status = item.conciliacao?.status || 'pendente';
    if (status === 'pendente') {
      resumo.totalPendentes++;
      resumo.valorTotalPendentes += item.valor;
    }
    if (status === 'conciliado') {
      resumo.totalConciliadas++;
      resumo.valorTotalConciliadas += item.valor;
    }
    if (status === 'divergente') {
      resumo.totalDivergentes++;
    }
    if (status === 'ignorado') {
      resumo.totalIgnoradas++;
    }
  }

  const result: ListarTransacoesResponse = {
    items,
    paginacao: {
      pagina,
      limite,
      total: count || 0,
      totalPaginas: Math.ceil((count || 0) / limite),
    },
    resumo,
  };

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

export const buscarTransacaoPorId = async (
  id: number
): Promise<TransacaoComConciliacao | null> => {
  const cacheKey = cacheByIdKey(id);
  const cached = await getCached<TransacaoComConciliacao>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('transacoes_bancarias_importadas')
    .select(
      `
      *,
      contas_bancarias (id, nome, banco, agencia, conta),
      conciliacoes_bancarias (*),
      lancamentos_financeiros (
        id,
        descricao,
        valor,
        data_lancamento,
        data_vencimento,
        tipo,
        status,
        conta_contabil_id,
        centro_custo_id,
        conta_bancaria_id
      )
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar transa\u00e7\u00e3o: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const result = mapTransacaoComConciliacaoRecord(data as TransacaoJoined);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

// ----------------------------------------------------------------------------
// Concilia\u00e7\u00e3o
// ----------------------------------------------------------------------------

export const conciliarManualPersistence = async (
  dto: ConciliarManualDTO,
  usuarioId?: number | null
): Promise<ConciliacaoBancaria> => {
  const supabase = createServiceClient();

  // Validar transa\u00e7\u00e3o
  const { data: transacao, error: erroTransacao } = await supabase
    .from('transacoes_bancarias_importadas')
    .select('id')
    .eq('id', dto.transacaoImportadaId)
    .maybeSingle();

  if (erroTransacao || !transacao) {
    throw new Error('Transa\u00e7\u00e3o n\u00e3o encontrada');
  }

  const updateData: Record<string, unknown> = {
    status: dto.lancamentoFinanceiroId === null ? 'ignorado' : 'conciliado',
    tipo_conciliacao: 'manual',
    lancamento_financeiro_id: dto.lancamentoFinanceiroId ?? null,
    conciliado_por: usuarioId ?? null,
    data_conciliacao: new Date().toISOString(),
    observacoes: dto.observacoes || null,
    dados_adicionais: null,
  };

  const { data, error } = await supabase
    .from('conciliacoes_bancarias')
    .update(updateData)
    .eq('transacao_importada_id', dto.transacaoImportadaId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao conciliar transa\u00e7\u00e3o: ${error.message}`);
  }

  await invalidarCacheConciliacao();
  return mapConciliacaoRecord(data as ConciliacaoRecord);
};

export const conciliarAutomaticamentePersistence = async (
  transacaoImportadaId: number,
  lancamentoFinanceiroId: number,
  score: number
): Promise<ConciliacaoBancaria> => {
  const supabase = createServiceClient();

  const { data: transacao, error: erroTransacao } = await supabase
    .from('transacoes_bancarias_importadas')
    .select('id')
    .eq('id', transacaoImportadaId)
    .maybeSingle();

  if (erroTransacao || !transacao) {
    throw new Error('Transa\u00e7\u00e3o n\u00e3o encontrada');
  }

  const updateData: Record<string, unknown> = {
    status: 'conciliado',
    tipo_conciliacao: 'automatica',
    lancamento_financeiro_id: lancamentoFinanceiroId,
    score_similaridade: score,
    conciliado_por: null,
    data_conciliacao: new Date().toISOString(),
    dados_adicionais: null,
    observacoes: null,
  };

  const { data, error } = await supabase
    .from('conciliacoes_bancarias')
    .update(updateData)
    .eq('transacao_importada_id', transacaoImportadaId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao conciliar automaticamente: ${error.message}`);
  }

  await invalidarCacheConciliacao();
  return mapConciliacaoRecord(data as ConciliacaoRecord);
};

export const desconciliar = async (transacaoImportadaId: number): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('conciliacoes_bancarias')
    .update({
      status: 'pendente',
      lancamento_financeiro_id: null,
      observacoes: null,
      tipo_conciliacao: null,
      score_similaridade: null,
      dados_adicionais: null,
      conciliado_por: null,
      data_conciliacao: null,
    })
    .eq('transacao_importada_id', transacaoImportadaId);

  if (error) {
    throw new Error(`Erro ao desconciliar: ${error.message}`);
  }

  await invalidarCacheConciliacao();
};

export const salvarSugestoesConciliacao = async (
  conciliacaoId: number,
  sugestoes: SugestaoConciliacao[]
): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('conciliacoes_bancarias')
    .update({
      dados_adicionais: { sugestoes },
    })
    .eq('id', conciliacaoId);

  if (error) {
    throw new Error(`Erro ao salvar sugest\u00f5es: ${error.message}`);
  }

  await invalidarCacheConciliacao();
};

// ----------------------------------------------------------------------------
// Candidatos
// ----------------------------------------------------------------------------

export const buscarLancamentosPorFiltro = async (
  params: BuscarLancamentosManuaisParams
): Promise<LancamentoFinanceiroResumo[]> => {
  const supabase = createServiceClient();
  const {
    busca,
    dataInicio,
    dataFim,
    contaBancariaId,
    tipo,
    limite = 20,
  } = params;

  let query = supabase
    .from('lancamentos_financeiros')
    .select('id, descricao, valor, data_lancamento, data_vencimento, tipo, status, conta_bancaria_id, documento')
    .order('data_lancamento', { ascending: false })
    .limit(Math.min(limite, 50));

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  if (contaBancariaId) {
    query = query.eq('conta_bancaria_id', contaBancariaId);
  }

  if (dataInicio) {
    query = query.gte('data_lancamento', dataInicio);
  }

  if (dataFim) {
    query = query.lte('data_lancamento', dataFim);
  }

  if (busca) {
    query = query.or(`descricao.ilike.%${busca}%,documento.ilike.%${busca}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar lan\u00e7amentos: ${error.message}`);
  }

  return (data || []).map((l) => ({
    id: l.id,
    descricao: l.descricao,
    valor: Number(l.valor),
    dataLancamento: l.data_lancamento,
    dataVencimento: l.data_vencimento,
    tipo: l.tipo as 'receita' | 'despesa',
    status: l.status,
    contaBancariaId: l.conta_bancaria_id,
  }));
};

export const buscarLancamentosCandidatos = async (
  transacao: TransacaoBancariaImportada
): Promise<LancamentoFinanceiroResumo[]> => {
  const supabase = createServiceClient();
  const dataInicio = new Date(transacao.dataTransacao);
  dataInicio.setDate(dataInicio.getDate() - JANELA_DIAS_BUSCA_CANDIDATOS);
  const dataFim = new Date(transacao.dataTransacao);
  dataFim.setDate(dataFim.getDate() + JANELA_DIAS_BUSCA_CANDIDATOS);

  const tipo = transacao.tipoTransacao === 'credito' ? 'receita' : 'despesa';

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id, descricao, valor, data_lancamento, data_vencimento, tipo, status, conta_bancaria_id')
    .eq('tipo', tipo)
    .eq('status', 'confirmado')
    .eq('conta_bancaria_id', transacao.contaBancariaId)
    .gte('data_lancamento', dataInicio.toISOString().split('T')[0])
    .lte('data_lancamento', dataFim.toISOString().split('T')[0])
    .order('data_lancamento', { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`Erro ao buscar lan\u00e7amentos candidatos: ${error.message}`);
  }

  return (data || []).map((l) => ({
    id: l.id,
    descricao: l.descricao,
    valor: Number(l.valor),
    dataLancamento: l.data_lancamento,
    dataVencimento: l.data_vencimento,
    tipo: l.tipo as 'receita' | 'despesa',
    status: l.status,
    contaBancariaId: l.conta_bancaria_id,
  }));
};

// ----------------------------------------------------------------------------
// Cache
// ----------------------------------------------------------------------------

export const invalidarCacheConciliacao = async (): Promise<void> => {
  await deletePattern('conciliacao:*');
};
