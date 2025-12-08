/**
 * Serviço de persistência para Obrigações Financeiras
 * Gerencia queries consolidadas que combinam parcelas de acordos e lançamentos financeiros
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import type {
  Obrigacao,
  ObrigacaoComDetalhes,
  ListarObrigacoesParams,
  TipoObrigacao,
  StatusObrigacao,
  OrigemObrigacao,
  StatusSincronizacao,
  ClienteResumoObrigacao,
  ProcessoResumoObrigacao,
  AcordoResumoObrigacao,
  ParcelaResumoObrigacao,
  LancamentoResumoObrigacao,
  ContaContabilResumoObrigacao,
  InconsistenciaObrigacao,
} from '@/backend/types/financeiro/obrigacoes.types';
import {
  calcularDiasAteVencimento,
  determinarStatusObrigacao,
  determinarTipoObrigacao,
  isOrigemObrigacaoValida,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'obrigacoes';
const CACHE_TTL = 300; // 5 minutos (dados mais dinâmicos)

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

interface ParcelaRecord {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_contratuais: number | null;
  honorarios_sucumbenciais: number | null;
  data_vencimento: string;
  data_efetivacao: string | null;
  status: string;
  forma_pagamento: string | null;
  status_repasse: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  acordos_condenacoes?: {
    id: number;
    tipo: 'acordo' | 'condenacao';
    direcao: 'recebimento' | 'pagamento';
    valor_total: number;
    numero_parcelas: number;
    status: string;
    acervo_id: number | null;
    cliente_id: number | null;
    acervo?: {
      id: number;
      numero_processo: string;
      autor: string | null;
      reu: string | null;
      vara: string | null;
      tribunal: string | null;
    } | null;
    clientes?: {
      id: number;
      nome: string;
      razao_social: string | null;
      nome_fantasia: string | null;
      cpf: string | null;
      cnpj: string | null;
      tipo_pessoa: 'fisica' | 'juridica';
    } | null;
  } | null;
  lancamentos_financeiros?: Array<{
    id: number;
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: number;
    data_lancamento: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
    status: string;
    conta_contabil_id: number | null;
    plano_contas?: {
      id: number;
      codigo: string;
      nome: string;
    } | null;
  }> | null;
}

interface LancamentoRecord {
  id: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_lancamento: string;
  data_competencia: string;
  data_vencimento: string | null;
  data_efetivacao: string | null;
  status: string;
  origem: string;
  forma_pagamento: string | null;
  conta_bancaria_id: number | null;
  conta_contabil_id: number;
  centro_custo_id: number | null;
  cliente_id: number | null;
  contrato_id: number | null;
  acordo_condenacao_id: number | null;
  parcela_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: number;
    nome: string;
    razao_social: string | null;
    nome_fantasia: string | null;
    cpf: string | null;
    cnpj: string | null;
    tipo_pessoa: 'fisica' | 'juridica';
  } | null;
  plano_contas?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Mapeia registro de parcela para interface Obrigacao
 */
const mapearParcelaParaObrigacao = (parcela: ParcelaRecord): ObrigacaoComDetalhes => {
  const acordo = parcela.acordos_condenacoes;
  const lancamentosVinculados = parcela.lancamentos_financeiros || [];
  const lancamentoVinculado = lancamentosVinculados[0]; // Primeiro lançamento vinculado

  const tipoObrigacao: TipoObrigacao = acordo?.direcao === 'pagamento'
    ? 'acordo_pagamento'
    : 'acordo_recebimento';

  const statusObrigacao = determinarStatusObrigacao(
    parcela.status,
    parcela.data_vencimento,
    parcela.data_efetivacao
  );

  // Calcular valor total (principal + honorários)
  const valorTotal = parcela.valor_bruto_credito_principal +
    (parcela.honorarios_sucumbenciais || 0);

  // Calcular percentual de honorários contratuais
  const percentualHonorarios = parcela.honorarios_contratuais && parcela.valor_bruto_credito_principal > 0
    ? (parcela.honorarios_contratuais / parcela.valor_bruto_credito_principal) * 100
    : null;

  // Determinar status de sincronização
  let statusSincronizacao: StatusSincronizacao = 'pendente';
  if (parcela.status === 'pendente') {
    statusSincronizacao = 'pendente';
  } else if (lancamentoVinculado) {
    // Verificar se valores estão consistentes
    const valorEsperado = valorTotal;
    const valorLancamento = lancamentoVinculado.valor;
    if (Math.abs(valorEsperado - valorLancamento) < 0.01) {
      statusSincronizacao = 'sincronizado';
    } else {
      statusSincronizacao = 'inconsistente';
    }
  } else if (parcela.status === 'recebida' || parcela.status === 'paga') {
    statusSincronizacao = 'inconsistente'; // Deveria ter lançamento mas não tem
  }

  const obrigacao: ObrigacaoComDetalhes = {
    id: `parcela_${parcela.id}`,
    tipoEntidade: 'parcela',
    entidadeId: parcela.id,
    tipo: tipoObrigacao,
    status: statusObrigacao,
    origem: 'acordo_judicial',
    statusSincronizacao,
    descricao: `Parcela ${parcela.numero_parcela}/${acordo?.numero_parcelas || '?'} - ${acordo?.tipo === 'acordo' ? 'Acordo' : 'Condenação'}`,
    valor: valorTotal,
    dataVencimento: parcela.data_vencimento,
    dataEfetivacao: parcela.data_efetivacao,
    dataLancamento: parcela.created_at.split('T')[0],
    dataCompetencia: parcela.data_vencimento,
    diasAteVencimento: calcularDiasAteVencimento(parcela.data_vencimento),
    percentualHonorarios,
    clienteId: acordo?.cliente_id || null,
    processoId: acordo?.acervo_id || null,
    acordoId: parcela.acordo_condenacao_id,
    parcelaId: parcela.id,
    lancamentoId: lancamentoVinculado?.id || null,
    contaContabilId: lancamentoVinculado?.conta_contabil_id || null,
    centroCustoId: null,
    contaBancariaId: null,
    createdAt: parcela.created_at,
    updatedAt: parcela.updated_at,
    createdBy: null,
  };

  // Adicionar dados relacionados se disponíveis
  if (acordo?.clientes) {
    obrigacao.cliente = {
      id: acordo.clientes.id,
      nome: acordo.clientes.nome,
      razaoSocial: acordo.clientes.razao_social,
      nomeFantasia: acordo.clientes.nome_fantasia,
      cpfCnpj: acordo.clientes.tipo_pessoa === 'fisica'
        ? acordo.clientes.cpf
        : acordo.clientes.cnpj,
      tipoPessoa: acordo.clientes.tipo_pessoa,
    };
  }

  if (acordo?.acervo) {
    obrigacao.processo = {
      id: acordo.acervo.id,
      numeroProcesso: acordo.acervo.numero_processo,
      autor: acordo.acervo.autor,
      reu: acordo.acervo.reu,
      vara: acordo.acervo.vara,
      tribunal: acordo.acervo.tribunal,
    };
  }

  if (acordo) {
    obrigacao.acordo = {
      id: acordo.id,
      tipo: acordo.tipo,
      direcao: acordo.direcao,
      valorTotal: Number(acordo.valor_total),
      numeroParcelas: acordo.numero_parcelas,
      status: acordo.status,
    };
  }

  obrigacao.parcela = {
    id: parcela.id,
    numeroParcela: parcela.numero_parcela,
    valorBrutoCreditoPrincipal: parcela.valor_bruto_credito_principal,
    honorariosContratuais: parcela.honorarios_contratuais,
    honorariosSucumbenciais: parcela.honorarios_sucumbenciais,
    dataVencimento: parcela.data_vencimento,
    dataEfetivacao: parcela.data_efetivacao,
    status: parcela.status,
    formaPagamento: parcela.forma_pagamento,
  };

  if (lancamentoVinculado) {
    obrigacao.lancamento = {
      id: lancamentoVinculado.id,
      tipo: lancamentoVinculado.tipo,
      descricao: lancamentoVinculado.descricao,
      valor: lancamentoVinculado.valor,
      dataLancamento: lancamentoVinculado.data_lancamento,
      dataVencimento: lancamentoVinculado.data_vencimento,
      dataEfetivacao: lancamentoVinculado.data_efetivacao,
      status: lancamentoVinculado.status,
    };

    if (lancamentoVinculado.plano_contas) {
      obrigacao.contaContabil = {
        id: lancamentoVinculado.plano_contas.id,
        codigo: lancamentoVinculado.plano_contas.codigo,
        nome: lancamentoVinculado.plano_contas.nome,
      };
    }
  }

  return obrigacao;
};

/**
 * Mapeia registro de lançamento (sem parcela) para interface Obrigacao
 */
const mapearLancamentoParaObrigacao = (lancamento: LancamentoRecord): ObrigacaoComDetalhes => {
  const tipoObrigacao: TipoObrigacao = lancamento.tipo === 'receita'
    ? 'conta_receber'
    : 'conta_pagar';

  const statusObrigacao = determinarStatusObrigacao(
    lancamento.status,
    lancamento.data_vencimento,
    lancamento.data_efetivacao
  );

  // Validar origem do lançamento, fallback para 'manual' se inválida
  let origemValidada: OrigemObrigacao;
  if (isOrigemObrigacaoValida(lancamento.origem)) {
    origemValidada = lancamento.origem;
  } else {
    console.warn(
      `Origem inválida "${lancamento.origem}" no lançamento ${lancamento.id}. Usando fallback 'manual'.`
    );
    origemValidada = 'manual';
  }

  const obrigacao: ObrigacaoComDetalhes = {
    id: `lancamento_${lancamento.id}`,
    tipoEntidade: 'lancamento',
    entidadeId: lancamento.id,
    tipo: tipoObrigacao,
    status: statusObrigacao,
    origem: origemValidada,
    statusSincronizacao: 'nao_aplicavel', // Lançamentos avulsos não precisam sincronização
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor),
    dataVencimento: lancamento.data_vencimento || lancamento.data_competencia,
    dataEfetivacao: lancamento.data_efetivacao,
    dataLancamento: lancamento.data_lancamento,
    dataCompetencia: lancamento.data_competencia,
    diasAteVencimento: lancamento.data_vencimento
      ? calcularDiasAteVencimento(lancamento.data_vencimento)
      : null,
    percentualHonorarios: null,
    clienteId: lancamento.cliente_id,
    processoId: null,
    acordoId: lancamento.acordo_condenacao_id,
    parcelaId: lancamento.parcela_id,
    lancamentoId: lancamento.id,
    contaContabilId: lancamento.conta_contabil_id,
    centroCustoId: lancamento.centro_custo_id,
    contaBancariaId: lancamento.conta_bancaria_id,
    createdAt: lancamento.created_at,
    updatedAt: lancamento.updated_at,
    createdBy: lancamento.created_by,
  };

  // Adicionar cliente se disponível
  if (lancamento.cliente) {
    obrigacao.cliente = {
      id: lancamento.cliente.id,
      nome: lancamento.cliente.nome,
      razaoSocial: lancamento.cliente.razao_social,
      nomeFantasia: lancamento.cliente.nome_fantasia,
      cpfCnpj: lancamento.cliente.tipo_pessoa === 'fisica'
        ? lancamento.cliente.cpf
        : lancamento.cliente.cnpj,
      tipoPessoa: lancamento.cliente.tipo_pessoa,
    };
  }

  // Adicionar lançamento
  obrigacao.lancamento = {
    id: lancamento.id,
    tipo: lancamento.tipo,
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor),
    dataLancamento: lancamento.data_lancamento,
    dataVencimento: lancamento.data_vencimento,
    dataEfetivacao: lancamento.data_efetivacao,
    status: lancamento.status,
  };

  // Adicionar conta contábil se disponível
  if (lancamento.plano_contas) {
    obrigacao.contaContabil = {
      id: lancamento.plano_contas.id,
      codigo: lancamento.plano_contas.codigo,
      nome: lancamento.plano_contas.nome,
    };
  }

  return obrigacao;
};

// ============================================================================
// Cache Keys
// ============================================================================

const getObrigacoesListKey = (params: ListarObrigacoesParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:list`, params as Record<string, unknown>);
};

// ============================================================================
// Operações de Leitura - Parcelas
// ============================================================================

/**
 * Busca parcelas de acordos com dados relacionados
 */
export const buscarParcelasComLancamentos = async (
  filtros: ListarObrigacoesParams
): Promise<ParcelaRecord[]> => {
  const supabase = createServiceClient();

  let query = supabase
    .from('parcelas')
    .select(`
      *,
      acordos_condenacoes!inner(
        id,
        tipo,
        direcao,
        valor_total,
        numero_parcelas,
        status,
        acervo_id,
        cliente_id,
        acervo(id, numero_processo, autor, reu, vara, tribunal),
        clientes(id, nome, razao_social, nome_fantasia, cpf, cnpj, tipo_pessoa)
      ),
      lancamentos_financeiros(
        id,
        tipo,
        descricao,
        valor,
        data_lancamento,
        data_vencimento,
        data_efetivacao,
        status,
        conta_contabil_id,
        plano_contas(id, codigo, nome)
      )
    `)
    .order('data_vencimento', { ascending: true });

  // Filtro de data de vencimento
  if (filtros.dataVencimentoInicio) {
    query = query.gte('data_vencimento', filtros.dataVencimentoInicio);
  }
  if (filtros.dataVencimentoFim) {
    query = query.lte('data_vencimento', filtros.dataVencimentoFim);
  }

  // Filtro de cliente (via acordo)
  if (filtros.clienteId) {
    query = query.eq('acordos_condenacoes.cliente_id', filtros.clienteId);
  }

  // Filtro de processo (via acordo)
  if (filtros.processoId) {
    query = query.eq('acordos_condenacoes.acervo_id', filtros.processoId);
  }

  // Filtro de acordo específico
  if (filtros.acordoId) {
    query = query.eq('acordo_condenacao_id', filtros.acordoId);
  }

  // Filtro de busca textual
  if (filtros.busca) {
    // Busca apenas no número do processo
    query = query.ilike('acordos_condenacoes.acervo.numero_processo', `%${filtros.busca}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar parcelas: ${error.message}`);
  }

  return (data || []) as ParcelaRecord[];
};

/**
 * Busca parcelas por ID de acordo
 */
export const buscarParcelasPorAcordo = async (acordoId: number): Promise<ParcelaRecord[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('parcelas')
    .select(`
      *,
      acordos_condenacoes(
        id,
        tipo,
        direcao,
        valor_total,
        numero_parcelas,
        status,
        processo_id,
        acervo(id, numero_processo, nome_parte_autora, nome_parte_re, classe_judicial, trt)
      ),
      lancamentos_financeiros(
        id,
        tipo,
        descricao,
        valor,
        data_lancamento,
        data_vencimento,
        data_efetivacao,
        status,
        conta_contabil_id,
        plano_contas(id, codigo, nome)
      )
    `)
    .eq('acordo_condenacao_id', acordoId)
    .order('numero_parcela', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar parcelas do acordo: ${error.message}`);
  }

  return (data || []) as ParcelaRecord[];
};

/**
 * Busca parcela por ID
 */
export const buscarParcelaPorId = async (parcelaId: number): Promise<ParcelaRecord | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('parcelas')
    .select(`
      *,
      acordos_condenacoes(
        id,
        tipo,
        direcao,
        valor_total,
        numero_parcelas,
        status,
        processo_id,
        acervo(id, numero_processo, nome_parte_autora, nome_parte_re, classe_judicial, trt)
      ),
      lancamentos_financeiros(
        id,
        tipo,
        descricao,
        valor,
        data_lancamento,
        data_vencimento,
        data_efetivacao,
        status,
        conta_contabil_id,
        plano_contas(id, codigo, nome)
      )
    `)
    .eq('id', parcelaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar parcela: ${error.message}`);
  }

  return data as ParcelaRecord;
};

// ============================================================================
// Operações de Leitura - Lançamentos Avulsos
// ============================================================================

/**
 * Busca lançamentos financeiros sem parcela vinculada (contas avulsas)
 */
export const buscarLancamentosAvulsos = async (
  filtros: ListarObrigacoesParams,
  tipo: 'receita' | 'despesa'
): Promise<LancamentoRecord[]> => {
  const supabase = createServiceClient();

  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      cliente:clientes(id, nome, razao_social, nome_fantasia, cpf, cnpj, tipo_pessoa),
      plano_contas(id, codigo, nome)
    `)
    .eq('tipo', tipo)
    .is('parcela_id', null) // Apenas lançamentos sem parcela (avulsos)
    .order('data_vencimento', { ascending: true, nullsFirst: false });

  // Filtro de data de vencimento
  if (filtros.dataVencimentoInicio) {
    query = query.gte('data_vencimento', filtros.dataVencimentoInicio);
  }
  if (filtros.dataVencimentoFim) {
    query = query.lte('data_vencimento', filtros.dataVencimentoFim);
  }

  // Filtro de data de competência
  if (filtros.dataCompetenciaInicio) {
    query = query.gte('data_competencia', filtros.dataCompetenciaInicio);
  }
  if (filtros.dataCompetenciaFim) {
    query = query.lte('data_competencia', filtros.dataCompetenciaFim);
  }

  // Filtro de cliente
  if (filtros.clienteId) {
    query = query.eq('cliente_id', filtros.clienteId);
  }

  // Filtro de conta contábil
  if (filtros.contaContabilId) {
    query = query.eq('conta_contabil_id', filtros.contaContabilId);
  }

  // Filtro de centro de custo
  if (filtros.centroCustoId) {
    query = query.eq('centro_custo_id', filtros.centroCustoId);
  }

  // Filtro de busca textual
  if (filtros.busca) {
    query = query.or(`descricao.ilike.%${filtros.busca}%,documento.ilike.%${filtros.busca}%`);
  }

  // Filtro de status
  if (filtros.status && filtros.status.length > 0) {
    // Mapear status de obrigação para status de lançamento
    const statusLancamento = filtros.status.map(s => {
      if (s === 'efetivada') return 'confirmado';
      if (s === 'vencida') return 'pendente'; // Vencidas são pendentes com data passada
      return s;
    });
    query = query.in('status', [...new Set(statusLancamento)]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar lançamentos: ${error.message}`);
  }

  return (data || []) as LancamentoRecord[];
};

/**
 * Busca lançamento por parcela ID (retorna o mais recente)
 */
export const buscarLancamentoPorParcela = async (parcelaId: number): Promise<LancamentoRecord | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      cliente:clientes(id, nome, razao_social, nome_fantasia, cpf, cnpj, tipo_pessoa),
      plano_contas(id, codigo, nome)
    `)
    .eq('parcela_id', parcelaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar lançamento da parcela: ${error.message}`);
  }

  return data as LancamentoRecord | null;
};

/**
 * Busca TODOS os lançamentos vinculados a uma parcela
 * Usado para detectar duplicidades criadas por outros sistemas
 */
export const buscarTodosLancamentosPorParcela = async (parcelaId: number): Promise<LancamentoRecord[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      cliente:clientes(id, nome, razao_social, nome_fantasia, cpf, cnpj, tipo_pessoa),
      plano_contas(id, codigo, nome)
    `)
    .eq('parcela_id', parcelaId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar lançamentos da parcela: ${error.message}`);
  }

  return (data || []) as LancamentoRecord[];
};

// ============================================================================
// Operações de Leitura - Consolidadas
// ============================================================================

/**
 * Lista obrigações consolidadas (parcelas + lançamentos avulsos)
 */
export const listarObrigacoesConsolidadas = async (
  params: ListarObrigacoesParams
): Promise<ObrigacaoComDetalhes[]> => {
  const cacheKey = getObrigacoesListKey(params);
  const cached = await getCached<ObrigacaoComDetalhes[]>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarObrigacoesConsolidadas: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarObrigacoesConsolidadas: ${cacheKey}`);

  const obrigacoes: ObrigacaoComDetalhes[] = [];

  // Determinar quais tipos buscar
  const tiposParaBuscar = params.tipos || [
    'acordo_recebimento',
    'acordo_pagamento',
    'conta_receber',
    'conta_pagar',
  ];

  const incluirAcordos = tiposParaBuscar.some(t =>
    t === 'acordo_recebimento' || t === 'acordo_pagamento'
  );
  const incluirContasReceber = tiposParaBuscar.includes('conta_receber');
  const incluirContasPagar = tiposParaBuscar.includes('conta_pagar');

  // Buscar parcelas de acordos
  if (incluirAcordos) {
    const parcelas = await buscarParcelasComLancamentos(params);

    for (const parcela of parcelas) {
      const obrigacao = mapearParcelaParaObrigacao(parcela);

      // Filtrar por tipo específico
      if (tiposParaBuscar.includes(obrigacao.tipo)) {
        obrigacoes.push(obrigacao);
      }
    }
  }

  // Buscar contas a receber avulsas
  if (incluirContasReceber) {
    const contasReceber = await buscarLancamentosAvulsos(params, 'receita');
    for (const lancamento of contasReceber) {
      obrigacoes.push(mapearLancamentoParaObrigacao(lancamento));
    }
  }

  // Buscar contas a pagar avulsas
  if (incluirContasPagar) {
    const contasPagar = await buscarLancamentosAvulsos(params, 'despesa');
    for (const lancamento of contasPagar) {
      obrigacoes.push(mapearLancamentoParaObrigacao(lancamento));
    }
  }

  // Filtrar por status
  let resultado = obrigacoes;
  if (params.status && params.status.length > 0) {
    resultado = resultado.filter(o => params.status!.includes(o.status));
  }

  // Filtrar apenas vencidas
  if (params.apenasVencidas) {
    resultado = resultado.filter(o => o.status === 'vencida');
  }

  // Filtrar apenas inconsistentes
  if (params.apenasInconsistentes) {
    resultado = resultado.filter(o => o.statusSincronizacao === 'inconsistente');
  }

  // Filtrar por statusSincronizacao específico
  if (params.statusSincronizacao && params.statusSincronizacao.length > 0) {
    resultado = resultado.filter(o => params.statusSincronizacao!.includes(o.statusSincronizacao));
  }

  // Ordenar por data de vencimento
  resultado.sort((a, b) => {
    const ordem = params.ordem === 'desc' ? -1 : 1;
    if (params.ordenarPor === 'valor') {
      return (a.valor - b.valor) * ordem;
    }
    if (params.ordenarPor === 'descricao') {
      return a.descricao.localeCompare(b.descricao) * ordem;
    }
    if (params.ordenarPor === 'tipo') {
      return a.tipo.localeCompare(b.tipo) * ordem;
    }
    // Default: data_vencimento
    return (new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()) * ordem;
  });

  await setCached(cacheKey, resultado, CACHE_TTL);
  return resultado;
};

/**
 * Busca obrigações vencidas
 * Usa a mesma lógica de cutoff que listarObrigacoesVencidas:
 * filtra por status === 'vencida' (calculado quando dataVencimento < hoje)
 */
export const buscarObrigacoesVencidas = async (dataReferencia?: Date): Promise<ObrigacaoComDetalhes[]> => {
  // Usa apenasVencidas: true que filtra por status === 'vencida'
  // O status 'vencida' é calculado em determinarStatusObrigacao quando:
  // statusOriginal === 'pendente' && calcularDiasAteVencimento(dataVencimento) < 0
  return listarObrigacoesConsolidadas({
    apenasVencidas: true,
  });
};

/**
 * Busca obrigações que vencem em N dias
 */
export const buscarObrigacoesVencendoEm = async (dias: number): Promise<ObrigacaoComDetalhes[]> => {
  const hoje = new Date();
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + dias);

  const hojeStr = hoje.toISOString().split('T')[0];
  const dataLimiteStr = dataLimite.toISOString().split('T')[0];

  const obrigacoes = await listarObrigacoesConsolidadas({
    dataVencimentoInicio: hojeStr,
    dataVencimentoFim: dataLimiteStr,
    status: ['pendente'] as StatusObrigacao[],
  });

  return obrigacoes;
};

/**
 * Busca obrigações por cliente
 */
export const buscarObrigacoesPorCliente = async (clienteId: number): Promise<ObrigacaoComDetalhes[]> => {
  return listarObrigacoesConsolidadas({ clienteId });
};

/**
 * Busca obrigações por processo
 */
export const buscarObrigacoesPorProcesso = async (processoId: number): Promise<ObrigacaoComDetalhes[]> => {
  return listarObrigacoesConsolidadas({ processoId });
};

// ============================================================================
// Operações de Cálculo
// ============================================================================

/**
 * Calcula totais de obrigações (query agregada)
 */
export const calcularTotaisObrigacoes = async (
  filtros?: ListarObrigacoesParams
): Promise<{
  totalPendente: number;
  totalVencido: number;
  totalEfetivado: number;
  valorTotalPendente: number;
  valorTotalVencido: number;
  valorTotalEfetivado: number;
  porTipo: Record<TipoObrigacao, { quantidade: number; valor: number }>;
}> => {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:totais`, (filtros || {}) as Record<string, unknown>);
  const cached = await getCached<ReturnType<typeof calcularTotaisObrigacoes>>(cacheKey);
  if (cached) {
    return cached;
  }

  const obrigacoes = await listarObrigacoesConsolidadas(filtros || {});

  const resultado = {
    totalPendente: 0,
    totalVencido: 0,
    totalEfetivado: 0,
    valorTotalPendente: 0,
    valorTotalVencido: 0,
    valorTotalEfetivado: 0,
    porTipo: {
      acordo_recebimento: { quantidade: 0, valor: 0 },
      acordo_pagamento: { quantidade: 0, valor: 0 },
      conta_receber: { quantidade: 0, valor: 0 },
      conta_pagar: { quantidade: 0, valor: 0 },
    } as Record<TipoObrigacao, { quantidade: number; valor: number }>,
  };

  for (const obrigacao of obrigacoes) {
    // Por status
    if (obrigacao.status === 'pendente') {
      resultado.totalPendente++;
      resultado.valorTotalPendente += obrigacao.valor;
    } else if (obrigacao.status === 'vencida') {
      resultado.totalVencido++;
      resultado.valorTotalVencido += obrigacao.valor;
    } else if (obrigacao.status === 'efetivada') {
      resultado.totalEfetivado++;
      resultado.valorTotalEfetivado += obrigacao.valor;
    }

    // Por tipo
    if (resultado.porTipo[obrigacao.tipo]) {
      resultado.porTipo[obrigacao.tipo].quantidade++;
      resultado.porTipo[obrigacao.tipo].valor += obrigacao.valor;
    }
  }

  await setCached(cacheKey, resultado, CACHE_TTL);
  return resultado;
};

// ============================================================================
// Operações de Verificação
// ============================================================================

/**
 * Detecta inconsistências em um acordo
 */
export const detectarInconsistenciasAcordo = async (
  acordoId: number
): Promise<InconsistenciaObrigacao[]> => {
  const inconsistencias: InconsistenciaObrigacao[] = [];
  const parcelas = await buscarParcelasPorAcordo(acordoId);

  for (const parcela of parcelas) {
    const lancamentos = parcela.lancamentos_financeiros || [];
    const lancamentoVinculado = lancamentos[0];

    // Verificar parcelas efetivadas sem lançamento
    if ((parcela.status === 'recebida' || parcela.status === 'paga') && !lancamentoVinculado) {
      inconsistencias.push({
        tipo: 'parcela_sem_lancamento',
        descricao: `Parcela ${parcela.numero_parcela} está marcada como ${parcela.status} mas não possui lançamento financeiro vinculado`,
        parcelaId: parcela.id,
        valorParcela: parcela.valor_bruto_credito_principal + (parcela.honorarios_sucumbenciais || 0),
        statusParcela: parcela.status,
        sugestao: 'Execute a sincronização manual para criar o lançamento financeiro',
      });
    }

    // Verificar divergência de valores
    if (lancamentoVinculado) {
      const valorParcela = parcela.valor_bruto_credito_principal + (parcela.honorarios_sucumbenciais || 0);
      const valorLancamento = lancamentoVinculado.valor;

      if (Math.abs(valorParcela - valorLancamento) > 0.01) {
        inconsistencias.push({
          tipo: 'valor_divergente',
          descricao: `Valor da parcela (R$ ${valorParcela.toFixed(2)}) difere do lançamento (R$ ${valorLancamento.toFixed(2)})`,
          parcelaId: parcela.id,
          lancamentoId: lancamentoVinculado.id,
          valorParcela,
          valorLancamento,
          sugestao: 'Verifique e corrija os valores manualmente ou force a ressincronização',
        });
      }

      // Verificar divergência de status
      const statusEsperado = parcela.status === 'recebida' || parcela.status === 'paga'
        ? 'confirmado'
        : 'pendente';

      if (lancamentoVinculado.status !== statusEsperado) {
        inconsistencias.push({
          tipo: 'status_divergente',
          descricao: `Status da parcela (${parcela.status}) não corresponde ao status do lançamento (${lancamentoVinculado.status})`,
          parcelaId: parcela.id,
          lancamentoId: lancamentoVinculado.id,
          statusParcela: parcela.status,
          statusLancamento: lancamentoVinculado.status,
          sugestao: 'Sincronize os status ou corrija manualmente',
        });
      }
    }
  }

  return inconsistencias;
};

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalida todo o cache de obrigações
 */
export const invalidateObrigacoesCache = async (): Promise<void> => {
  await deletePattern(`${CACHE_PREFIX}:*`);
};

// Re-export mappers for use in other services
export { mapearParcelaParaObrigacao, mapearLancamentoParaObrigacao };
