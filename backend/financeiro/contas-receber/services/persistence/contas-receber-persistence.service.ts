/**
 * Serviço de persistência para Contas a Receber
 * Gerencia operações de CRUD na tabela lancamentos_financeiros
 * filtrando por tipo = 'receita'
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import { invalidateObrigacoesCache } from '@/backend/financeiro/obrigacoes/services/persistence/obrigacoes-persistence.service';
import type {
  ContaReceber,
  ContaReceberComDetalhes,
  CriarContaReceberDTO,
  AtualizarContaReceberDTO,
  ListarContasReceberParams,
  ListarContasReceberResponse,
  StatusContaReceber,
  OrigemContaReceber,
  FormaRecebimentoContaReceber,
  FrequenciaRecorrencia,
  AnexoContaReceber,
  ClienteResumo,
  ContratoResumo,
  ContaContabilResumo,
  CentroCustoResumo,
  ContaBancariaResumo,
  ResumoInadimplencia,
  RecebimentoRegistro,
  HistoricoRecebimentos,
} from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'contas_receber';
const CACHE_TTL = 600; // 10 minutos

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

interface LancamentoFinanceiroRecord {
  id: number;
  tipo: 'receita';
  descricao: string;
  valor: number;
  data_lancamento: string;
  data_competencia: string;
  data_vencimento: string | null;
  data_efetivacao: string | null;
  status: StatusContaReceber;
  origem: OrigemContaReceber;
  forma_pagamento: FormaRecebimentoContaReceber | null;
  conta_bancaria_id: number | null;
  conta_contabil_id: number;
  centro_custo_id: number | null;
  categoria: string | null;
  documento: string | null;
  observacoes: string | null;
  anexos: AnexoContaReceber[];
  dados_adicionais: Record<string, unknown>;
  cliente_id: number | null;
  contrato_id: number | null;
  acordo_condenacao_id: number | null;
  parcela_id: number | null;
  usuario_id: number | null;
  recorrente: boolean;
  frequencia_recorrencia: FrequenciaRecorrencia | null;
  lancamento_origem_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface LancamentoComRelacionamentos extends LancamentoFinanceiroRecord {
  cliente?: {
    id: number;
    nome: string;
    nome_social_fantasia: string | null;
    cpf: string | null;
    cnpj: string | null;
    tipo_pessoa: 'fisica' | 'juridica';
  } | null;
  contrato?: {
    id: number;
    area_direito: string | null;
    tipo_contrato: string | null;
  } | null;
  plano_contas?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
  centros_custo?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
  contas_bancarias?: {
    id: number;
    nome: string;
    banco: string | null;
    agencia: string | null;
    conta: string | null;
  } | null;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro do banco para interface ContaReceber
 */
const mapearContaReceber = (registro: LancamentoFinanceiroRecord): ContaReceber => {
  return {
    id: registro.id,
    descricao: registro.descricao,
    valor: Number(registro.valor),
    dataLancamento: registro.data_lancamento,
    dataCompetencia: registro.data_competencia,
    dataVencimento: registro.data_vencimento,
    dataEfetivacao: registro.data_efetivacao,
    status: registro.status,
    origem: registro.origem,
    formaRecebimento: registro.forma_pagamento,
    contaBancariaId: registro.conta_bancaria_id,
    contaContabilId: registro.conta_contabil_id,
    centroCustoId: registro.centro_custo_id,
    categoria: registro.categoria,
    documento: registro.documento,
    observacoes: registro.observacoes,
    anexos: registro.anexos || [],
    dadosAdicionais: registro.dados_adicionais || {},
    clienteId: registro.cliente_id,
    contratoId: registro.contrato_id,
    acordoCondenacaoId: registro.acordo_condenacao_id,
    parcelaId: registro.parcela_id,
    usuarioId: registro.usuario_id,
    recorrente: registro.recorrente,
    frequenciaRecorrencia: registro.frequencia_recorrencia,
    lancamentoOrigemId: registro.lancamento_origem_id,
    createdBy: registro.created_by,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro com relacionamentos para ContaReceberComDetalhes
 */
const mapearContaReceberComDetalhes = (registro: LancamentoComRelacionamentos): ContaReceberComDetalhes => {
  const contaReceber = mapearContaReceber(registro);

  const cliente: ClienteResumo | undefined = registro.cliente
    ? {
      id: registro.cliente.id,
      nome: registro.cliente.nome,
      razaoSocial: registro.cliente.tipo_pessoa === 'juridica' ? registro.cliente.nome : null,
      nomeFantasia: registro.cliente.nome_social_fantasia,
      cpfCnpj: registro.cliente.tipo_pessoa === 'fisica' ? registro.cliente.cpf : registro.cliente.cnpj,
      cnpj: registro.cliente.cnpj,
      tipoPessoa: registro.cliente.tipo_pessoa,
    }
    : undefined;

  const contrato: ContratoResumo | undefined = registro.contrato
    ? {
      id: registro.contrato.id,
      areaDireito: registro.contrato.area_direito,
      tipoContrato: registro.contrato.tipo_contrato,
    }
    : undefined;

  const contaContabil: ContaContabilResumo | undefined = registro.plano_contas
    ? {
      id: registro.plano_contas.id,
      codigo: registro.plano_contas.codigo,
      nome: registro.plano_contas.nome,
    }
    : undefined;

  const centroCusto: CentroCustoResumo | undefined = registro.centros_custo
    ? {
      id: registro.centros_custo.id,
      codigo: registro.centros_custo.codigo,
      nome: registro.centros_custo.nome,
    }
    : undefined;

  const contaBancaria: ContaBancariaResumo | undefined = registro.contas_bancarias
    ? {
      id: registro.contas_bancarias.id,
      nome: registro.contas_bancarias.nome,
      banco: registro.contas_bancarias.banco,
      agencia: registro.contas_bancarias.agencia,
      conta: registro.contas_bancarias.conta,
    }
    : undefined;

  return {
    ...contaReceber,
    cliente,
    contrato,
    contaContabil,
    centroCusto,
    contaBancaria,
  };
};

// ============================================================================
// Cache Keys
// ============================================================================

const getContasReceberListKey = (params: ListarContasReceberParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:list`, params as Record<string, unknown>);
};

const getContaReceberByIdKey = (id: number): string => {
  return `${CACHE_PREFIX}:id:${id}`;
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Listar contas a receber com filtros e paginação
 */
export const listarContasReceber = async (
  params: ListarContasReceberParams
): Promise<ListarContasReceberResponse> => {
  const cacheKey = getContasReceberListKey(params);
  const cached = await getCached<ListarContasReceberResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarContasReceber: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarContasReceber: ${cacheKey}`);

  const {
    pagina = 1,
    limite = 50,
    busca,
    status,
    dataVencimentoInicio,
    dataVencimentoFim,
    dataCompetenciaInicio,
    dataCompetenciaFim,
    clienteId,
    contratoId,
    contaContabilId,
    centroCustoId,
    contaBancariaId,
    categoria,
    origem,
    recorrente,
    ordenarPor = 'data_vencimento',
    ordem = 'asc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('lancamentos_financeiros')
    .select(
      `
      *,
      cliente:clientes(id, nome, nome_social_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, area_direito, tipo_contrato),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome),
      contas_bancarias(id, nome, banco, agencia, conta)
    `,
      { count: 'exact' }
    )
    .eq('tipo', 'receita'); // Filtrar apenas receitas (contas a receber)

  // Filtro de busca (descrição, documento, categoria)
  if (busca) {
    query = query.or(`descricao.ilike.%${busca}%,documento.ilike.%${busca}%,categoria.ilike.%${busca}%`);
  }

  // Filtro de status
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  // Filtro de data de vencimento
  if (dataVencimentoInicio) {
    query = query.gte('data_vencimento', dataVencimentoInicio);
  }
  if (dataVencimentoFim) {
    query = query.lte('data_vencimento', dataVencimentoFim);
  }

  // Filtro de data de competência
  if (dataCompetenciaInicio) {
    query = query.gte('data_competencia', dataCompetenciaInicio);
  }
  if (dataCompetenciaFim) {
    query = query.lte('data_competencia', dataCompetenciaFim);
  }

  // Filtro de cliente
  if (clienteId) {
    query = query.eq('cliente_id', clienteId);
  }

  // Filtro de contrato
  if (contratoId) {
    query = query.eq('contrato_id', contratoId);
  }

  // Filtro de conta contábil
  if (contaContabilId) {
    query = query.eq('conta_contabil_id', contaContabilId);
  }

  // Filtro de centro de custo
  if (centroCustoId) {
    query = query.eq('centro_custo_id', centroCustoId);
  }

  // Filtro de conta bancária
  if (contaBancariaId) {
    query = query.eq('conta_bancaria_id', contaBancariaId);
  }

  // Filtro de categoria
  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  // Filtro de origem
  if (origem) {
    query = query.eq('origem', origem);
  }

  // Filtro de recorrente
  if (recorrente !== undefined) {
    query = query.eq('recorrente', recorrente);
  }

  // Ordenação
  const campoOrdenacao = ordenarPor === 'created_at' ? 'created_at' : ordenarPor;
  query = query.order(campoOrdenacao, { ascending: ordem === 'asc', nullsFirst: false });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar contas a receber: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarContasReceberResponse = {
    items: (data || []).map(mapearContaReceberComDetalhes),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
  };

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar conta a receber por ID com detalhes
 */
export const buscarContaReceberPorId = async (id: number): Promise<ContaReceberComDetalhes | null> => {
  const cacheKey = getContaReceberByIdKey(id);
  const cached = await getCached<ContaReceberComDetalhes>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarContaReceberPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarContaReceberPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(
      `
      *,
      cliente:clientes(id, nome, nome_social_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, area_direito, tipo_contrato),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome),
      contas_bancarias(id, nome, banco, agencia, conta)
    `
    )
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar conta a receber: ${error.message}`);
  }

  const result = mapearContaReceberComDetalhes(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar contas vencidas (para alertas de inadimplência)
 */
export const buscarContasReceberVencidas = async (): Promise<ContaReceberComDetalhes[]> => {
  const supabase = createServiceClient();
  const hoje = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(
      `
      *,
      cliente:clientes(id, nome, nome_social_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, area_direito, tipo_contrato),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome),
      contas_bancarias(id, nome, banco, agencia, conta)
    `
    )
    .eq('tipo', 'receita')
    .eq('status', 'pendente')
    .lt('data_vencimento', hoje)
    .order('data_vencimento', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas vencidas: ${error.message}`);
  }

  return (data || []).map(mapearContaReceberComDetalhes);
};

/**
 * Buscar resumo de inadimplência (para dashboard/alertas)
 */
export const buscarResumoInadimplencia = async (): Promise<ResumoInadimplencia> => {
  const cacheKey = `${CACHE_PREFIX}:resumo_inadimplencia`;
  const cached = await getCached<ResumoInadimplencia>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  const em7Dias = new Date(hoje);
  em7Dias.setDate(em7Dias.getDate() + 7);
  const em7DiasStr = em7Dias.toISOString().split('T')[0];

  const em30Dias = new Date(hoje);
  em30Dias.setDate(em30Dias.getDate() + 30);
  const em30DiasStr = em30Dias.toISOString().split('T')[0];

  // Buscar todas as contas pendentes
  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(
      `
      *,
      cliente:clientes(id, nome, nome_social_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, area_direito, tipo_contrato),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome),
      contas_bancarias(id, nome, banco, agencia, conta)
    `
    )
    .eq('tipo', 'receita')
    .eq('status', 'pendente')
    .not('data_vencimento', 'is', null)
    .lte('data_vencimento', em30DiasStr)
    .order('data_vencimento', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar resumo de inadimplência: ${error.message}`);
  }

  const contas = (data || []).map(mapearContaReceberComDetalhes);

  const vencidas = contas.filter((c) => c.dataVencimento && c.dataVencimento < hojeStr);
  const vencendoHoje = contas.filter((c) => c.dataVencimento === hojeStr);
  const vencendoEm7Dias = contas.filter(
    (c) => c.dataVencimento && c.dataVencimento > hojeStr && c.dataVencimento <= em7DiasStr
  );
  const vencendoEm30Dias = contas.filter(
    (c) => c.dataVencimento && c.dataVencimento > em7DiasStr && c.dataVencimento <= em30DiasStr
  );

  const calcularTotal = (lista: ContaReceberComDetalhes[]) =>
    lista.reduce((acc, c) => acc + c.valor, 0);

  const result: ResumoInadimplencia = {
    vencidas: {
      quantidade: vencidas.length,
      valorTotal: calcularTotal(vencidas),
      itens: vencidas,
    },
    vencendoHoje: {
      quantidade: vencendoHoje.length,
      valorTotal: calcularTotal(vencendoHoje),
      itens: vencendoHoje,
    },
    vencendoEm7Dias: {
      quantidade: vencendoEm7Dias.length,
      valorTotal: calcularTotal(vencendoEm7Dias),
      itens: vencendoEm7Dias,
    },
    vencendoEm30Dias: {
      quantidade: vencendoEm30Dias.length,
      valorTotal: calcularTotal(vencendoEm30Dias),
      itens: vencendoEm30Dias,
    },
  };

  await setCached(cacheKey, result, 300); // 5 minutos
  return result;
};

/**
 * Buscar última conta gerada a partir de um template recorrente
 * Otimizado com filtro direto por lancamento_origem_id
 */
export const buscarUltimaContaGeradaPorTemplate = async (templateId: number): Promise<ContaReceber | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('tipo', 'receita')
    .eq('lancamento_origem_id', templateId)
    .order('data_vencimento', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar última conta gerada: ${error.message}`);
  }

  return data ? mapearContaReceber(data) : null;
};

/**
 * Verificar se existe conta para um template em uma data específica
 * Otimizado com filtro direto por lancamento_origem_id e data_vencimento
 */
export const verificarContaExistentePorTemplateEData = async (
  templateId: number,
  dataVencimento: string
): Promise<boolean> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'receita')
    .eq('lancamento_origem_id', templateId)
    .eq('data_vencimento', dataVencimento);

  if (error) {
    throw new Error(`Erro ao verificar conta existente: ${error.message}`);
  }

  return (count || 0) > 0;
};

/**
 * Buscar templates recorrentes ativos
 */
export const buscarContasReceberRecorrentes = async (): Promise<ContaReceber[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('tipo', 'receita')
    .eq('recorrente', true)
    .neq('status', 'cancelado')
    .order('descricao', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas recorrentes: ${error.message}`);
  }

  return (data || []).map(mapearContaReceber);
};

/**
 * Buscar contas a receber por contrato
 */
export const buscarContasReceberPorContrato = async (contratoId: number): Promise<ContaReceberComDetalhes[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select(
      `
      *,
      cliente:clientes(id, nome, nome_social_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, area_direito, tipo_contrato),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome),
      contas_bancarias(id, nome, banco, agencia, conta)
    `
    )
    .eq('tipo', 'receita')
    .eq('contrato_id', contratoId)
    .order('data_vencimento', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas do contrato: ${error.message}`);
  }

  return (data || []).map(mapearContaReceberComDetalhes);
};

// ============================================================================
// Operações de Escrita
// ============================================================================

/**
 * Criar nova conta a receber
 */
export const criarContaReceber = async (
  dados: CriarContaReceberDTO,
  usuarioId: number
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Validar se conta contábil existe e é analítica (aceita lançamentos)
  if (dados.contaContabilId) {
    const { data: contaContabil, error: erroContaContabil } = await supabase
      .from('plano_contas')
      .select('id, codigo, nome, nivel, aceita_lancamento, ativo')
      .eq('id', dados.contaContabilId)
      .single();

    if (erroContaContabil || !contaContabil) {
      throw new Error('Conta contábil não encontrada');
    }

    if (!contaContabil.ativo) {
      throw new Error('Conta contábil está inativa');
    }

    if (!contaContabil.aceita_lancamento) {
      throw new Error(
        `Conta contábil "${contaContabil.codigo} - ${contaContabil.nome}" é sintética e não aceita lançamentos. Selecione uma conta analítica.`
      );
    }
  }

  const hoje = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .insert({
      tipo: 'receita',
      descricao: dados.descricao.trim(),
      valor: dados.valor,
      data_lancamento: hoje,
      data_competencia: dados.dataCompetencia || dados.dataVencimento,
      data_vencimento: dados.dataVencimento,
      status: 'pendente',
      origem: dados.origem || 'manual',
      forma_pagamento: dados.formaRecebimento || null,
      conta_bancaria_id: dados.contaBancariaId || null,
      conta_contabil_id: dados.contaContabilId,
      centro_custo_id: dados.centroCustoId || null,
      categoria: dados.categoria?.trim() || null,
      documento: dados.documento?.trim() || null,
      observacoes: dados.observacoes?.trim() || null,
      anexos: dados.anexos || [],
      dados_adicionais: dados.dadosAdicionais || {},
      cliente_id: dados.clienteId || null,
      contrato_id: dados.contratoId || null,
      acordo_condenacao_id: dados.acordoCondenacaoId || null,
      parcela_id: dados.parcelaId || null,
      usuario_id: dados.usuarioId || null,
      recorrente: dados.recorrente || false,
      frequencia_recorrencia: dados.frequenciaRecorrencia || null,
      created_by: usuarioId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar conta a receber: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Atualizar conta a receber existente
 */
export const atualizarContaReceber = async (
  id: number,
  dados: AtualizarContaReceberDTO
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  // Não permitir atualizar contas confirmadas ou canceladas
  if (contaAtual.status === 'confirmado') {
    throw new Error('Não é possível alterar conta já recebida');
  }
  if (contaAtual.status === 'cancelado') {
    throw new Error('Não é possível alterar conta cancelada');
  }

  const updateData: Record<string, unknown> = {};

  if (dados.descricao !== undefined) {
    updateData.descricao = dados.descricao.trim();
  }
  if (dados.valor !== undefined) {
    updateData.valor = dados.valor;
  }
  if (dados.dataVencimento !== undefined) {
    updateData.data_vencimento = dados.dataVencimento;
  }
  if (dados.dataCompetencia !== undefined) {
    updateData.data_competencia = dados.dataCompetencia;
  }
  if (dados.formaRecebimento !== undefined) {
    updateData.forma_pagamento = dados.formaRecebimento;
  }
  if (dados.contaBancariaId !== undefined) {
    updateData.conta_bancaria_id = dados.contaBancariaId;
  }
  if (dados.contaContabilId !== undefined) {
    updateData.conta_contabil_id = dados.contaContabilId;
  }
  if (dados.centroCustoId !== undefined) {
    updateData.centro_custo_id = dados.centroCustoId;
  }
  if (dados.categoria !== undefined) {
    updateData.categoria = dados.categoria?.trim() || null;
  }
  if (dados.documento !== undefined) {
    updateData.documento = dados.documento?.trim() || null;
  }
  if (dados.observacoes !== undefined) {
    updateData.observacoes = dados.observacoes?.trim() || null;
  }
  if (dados.anexos !== undefined) {
    updateData.anexos = dados.anexos;
  }
  if (dados.dadosAdicionais !== undefined) {
    updateData.dados_adicionais = dados.dadosAdicionais;
  }
  if (dados.clienteId !== undefined) {
    updateData.cliente_id = dados.clienteId;
  }
  if (dados.contratoId !== undefined) {
    updateData.contrato_id = dados.contratoId;
  }
  if (dados.recorrente !== undefined) {
    updateData.recorrente = dados.recorrente;
  }
  if (dados.frequenciaRecorrencia !== undefined) {
    updateData.frequencia_recorrencia = dados.frequenciaRecorrencia;
  }

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar conta a receber: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Confirmar recebimento de conta (pagamento total)
 * Atualiza o histórico de recebimentos e muda status para 'confirmado'
 */
export const confirmarRecebimentoContaReceber = async (
  id: number,
  dados: {
    formaRecebimento: FormaRecebimentoContaReceber;
    contaBancariaId: number;
    dataEfetivacao?: string;
    observacoes?: string;
    comprovante?: AnexoContaReceber;
    registroRecebimento?: RecebimentoRegistro;
  }
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  if (contaAtual.status !== 'pendente') {
    throw new Error('Apenas contas pendentes podem ser recebidas');
  }

  const dataEfetivacao = dados.dataEfetivacao || new Date().toISOString();
  const anexos = contaAtual.anexos || [];

  // Adicionar comprovante aos anexos se fornecido
  if (dados.comprovante) {
    anexos.push(dados.comprovante);
  }

  // Mesclar observações
  let observacoes = contaAtual.observacoes || '';
  if (dados.observacoes) {
    observacoes = observacoes ? `${observacoes}\n\n[Recebimento] ${dados.observacoes}` : dados.observacoes;
  }

  // Atualizar histórico de recebimentos em dados_adicionais
  const dadosAdicionais = (contaAtual.dados_adicionais || {}) as Record<string, unknown>;
  const historicoExistente = dadosAdicionais.historicoRecebimentos as HistoricoRecebimentos | undefined;

  // Calcular valores para o histórico
  const recebimentosAnteriores = historicoExistente?.recebimentos || [];
  const valorTotalAnterior = historicoExistente?.valorTotalRecebido || 0;
  const valorRecebidoAgora = dados.registroRecebimento?.valor || (Number(contaAtual.valor) - valorTotalAnterior);

  // Criar registro de recebimento se não fornecido
  const registroRecebimento: RecebimentoRegistro = dados.registroRecebimento || {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    valor: valorRecebidoAgora,
    dataRecebimento: (dataEfetivacao || new Date().toISOString()).split('T')[0],
    formaRecebimento: dados.formaRecebimento,
    contaBancariaId: dados.contaBancariaId,
    observacoes: dados.observacoes,
    comprovante: dados.comprovante,
    registradoEm: new Date().toISOString(),
  };

  const historicoAtualizado: HistoricoRecebimentos = {
    recebimentos: [...recebimentosAnteriores, registroRecebimento],
    valorTotalRecebido: valorTotalAnterior + valorRecebidoAgora,
    valorPendente: 0, // Confirmado = tudo pago
  };

  dadosAdicionais.historicoRecebimentos = historicoAtualizado;

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update({
      status: 'confirmado',
      forma_pagamento: dados.formaRecebimento,
      conta_bancaria_id: dados.contaBancariaId,
      data_efetivacao: dataEfetivacao,
      observacoes: observacoes.trim() || null,
      anexos,
      dados_adicionais: dadosAdicionais,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao confirmar recebimento: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Registrar recebimento parcial de conta
 * Adiciona o registro ao histórico mas mantém o status 'pendente'
 */
export const registrarRecebimentoParcialContaReceber = async (
  id: number,
  registro: RecebimentoRegistro
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  if (contaAtual.status !== 'pendente') {
    throw new Error('Apenas contas pendentes podem receber pagamentos parciais');
  }

  const valorTotal = Number(contaAtual.valor);
  const anexos = contaAtual.anexos || [];

  // Adicionar comprovante aos anexos se fornecido
  if (registro.comprovante) {
    anexos.push(registro.comprovante);
  }

  // Mesclar observações
  let observacoes = contaAtual.observacoes || '';
  if (registro.observacoes) {
    const dataFormatada = new Date(registro.dataRecebimento).toLocaleDateString('pt-BR');
    observacoes = observacoes
      ? `${observacoes}\n\n[Pagamento parcial ${dataFormatada}] R$ ${registro.valor.toFixed(2)} - ${registro.observacoes}`
      : `[Pagamento parcial ${dataFormatada}] R$ ${registro.valor.toFixed(2)} - ${registro.observacoes}`;
  }

  // Atualizar histórico de recebimentos em dados_adicionais
  const dadosAdicionais = (contaAtual.dados_adicionais || {}) as Record<string, unknown>;
  const historicoExistente = dadosAdicionais.historicoRecebimentos as HistoricoRecebimentos | undefined;

  const recebimentosAnteriores = historicoExistente?.recebimentos || [];
  const valorTotalAnterior = historicoExistente?.valorTotalRecebido || 0;
  const novoValorTotalRecebido = valorTotalAnterior + registro.valor;
  const novoValorPendente = valorTotal - novoValorTotalRecebido;

  const historicoAtualizado: HistoricoRecebimentos = {
    recebimentos: [...recebimentosAnteriores, registro],
    valorTotalRecebido: novoValorTotalRecebido,
    valorPendente: novoValorPendente,
  };

  dadosAdicionais.historicoRecebimentos = historicoAtualizado;

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update({
      observacoes: observacoes.trim() || null,
      anexos,
      dados_adicionais: dadosAdicionais,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao registrar recebimento parcial: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Cancelar conta a receber
 */
export const cancelarContaReceber = async (
  id: number,
  motivo?: string
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  if (contaAtual.status === 'confirmado') {
    throw new Error('Não é possível cancelar conta já recebida');
  }
  if (contaAtual.status === 'cancelado') {
    throw new Error('Conta já está cancelada');
  }

  // Adicionar motivo às observações
  let observacoes = contaAtual.observacoes || '';
  if (motivo) {
    observacoes = observacoes
      ? `${observacoes}\n\n[Cancelamento] ${motivo}`
      : `[Cancelamento] ${motivo}`;
  }

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update({
      status: 'cancelado',
      observacoes: observacoes.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cancelar conta: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Deletar conta a receber (hard delete - apenas se pendente)
 */
export const deletarContaReceber = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('status')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  if (contaAtual.status !== 'pendente') {
    throw new Error('Apenas contas pendentes podem ser excluídas');
  }

  const { error } = await supabase
    .from('lancamentos_financeiros')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir conta: ${error.message}`);
  }

  await invalidateContasReceberCache();
};

/**
 * Adicionar anexo a conta existente
 */
export const adicionarAnexoContaReceber = async (
  id: number,
  anexo: AnexoContaReceber
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('anexos')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  const anexos = contaAtual.anexos || [];
  anexos.push(anexo);

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update({ anexos })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar anexo: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

/**
 * Remover anexo de conta existente
 */
export const removerAnexoContaReceber = async (
  id: number,
  urlAnexo: string
): Promise<ContaReceber> => {
  const supabase = createServiceClient();

  // Buscar conta atual
  const { data: contaAtual, error: erroConsulta } = await supabase
    .from('lancamentos_financeiros')
    .select('anexos')
    .eq('id', id)
    .eq('tipo', 'receita')
    .single();

  if (erroConsulta || !contaAtual) {
    throw new Error('Conta a receber não encontrada');
  }

  const anexos = (contaAtual.anexos || []).filter(
    (a: AnexoContaReceber) => a.url !== urlAnexo
  );

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .update({ anexos })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao remover anexo: ${error.message}`);
  }

  await invalidateContasReceberCache();
  return mapearContaReceber(data);
};

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalidar todo o cache de contas a receber
 * Também invalida o cache de obrigações consolidadas
 */
export const invalidateContasReceberCache = async (): Promise<void> => {
  await deletePattern(`${CACHE_PREFIX}:*`);
  // Invalidar cache de obrigações para manter consistência
  await invalidateObrigacoesCache();
};

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Buscar categorias distintas usadas
 */
export const buscarCategoriasUsadas = async (): Promise<string[]> => {
  const cacheKey = `${CACHE_PREFIX}:categorias`;
  const cached = await getCached<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('categoria')
    .eq('tipo', 'receita')
    .not('categoria', 'is', null)
    .order('categoria', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar categorias: ${error.message}`);
  }

  // Remover duplicatas
  const categorias = [...new Set((data || []).map((d) => d.categoria as string))];

  await setCached(cacheKey, categorias, 1800); // 30 minutos
  return categorias;
};

/**
 * Calcular totais por status
 */
export const calcularTotaisPorStatus = async (): Promise<Record<StatusContaReceber, { quantidade: number; valor: number }>> => {
  const cacheKey = `${CACHE_PREFIX}:totais_status`;
  const cached = await getCached<Record<StatusContaReceber, { quantidade: number; valor: number }>>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('status, valor')
    .eq('tipo', 'receita');

  if (error) {
    throw new Error(`Erro ao calcular totais: ${error.message}`);
  }

  const totais: Record<StatusContaReceber, { quantidade: number; valor: number }> = {
    pendente: { quantidade: 0, valor: 0 },
    confirmado: { quantidade: 0, valor: 0 },
    cancelado: { quantidade: 0, valor: 0 },
    estornado: { quantidade: 0, valor: 0 },
  };

  for (const item of data || []) {
    const status = item.status as StatusContaReceber;
    if (totais[status]) {
      totais[status].quantidade++;
      totais[status].valor += Number(item.valor);
    }
  }

  await setCached(cacheKey, totais, 300); // 5 minutos
  return totais;
};
