/**
 * Serviço de persistência para Folhas de Pagamento
 * Gerencia operações de CRUD nas tabelas folhas_pagamento e itens_folha_pagamento
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import { invalidateSalariosCache } from './salarios-persistence.service';
import type {
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento,
  ItemFolhaComDetalhes,
  ListarFolhasParams,
  ListarFolhasResponse,
  StatusFolhaPagamento,
  TotaisFolhasPorStatus,
  UsuarioResumo,
  Salario,
  LancamentoFinanceiroResumo,
} from '@/backend/types/financeiro/salarios.types';
import { isTransicaoStatusValida } from '@/backend/types/financeiro/salarios.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'folhas_pagamento';
const CACHE_TTL = 600; // 10 minutos

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

interface FolhaPagamentoRecord {
  id: number;
  mes_referencia: number;
  ano_referencia: number;
  data_geracao: string;
  data_pagamento: string | null;
  valor_total: number;
  status: StatusFolhaPagamento;
  observacoes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface ItemFolhaPagamentoRecord {
  id: number;
  folha_pagamento_id: number;
  usuario_id: number;
  salario_id: number;
  valor_bruto: number;
  lancamento_financeiro_id: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemFolhaComRelacionamentos extends ItemFolhaPagamentoRecord {
  usuarios?: {
    id: number;
    nome_exibicao: string;
    email_corporativo: string;
    cargo_id?: number;
    cargos?: {
      nome: string;
    } | null;
  } | null;
  salarios?: {
    id: number;
    salario_bruto: number;
    data_inicio_vigencia: string;
    data_fim_vigencia: string | null;
  } | null;
  lancamentos_financeiros?: {
    id: number;
    descricao: string;
    valor: number;
    status: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
  } | null;
}

interface FolhaComRelacionamentos extends FolhaPagamentoRecord {
  itens_folha_pagamento?: ItemFolhaComRelacionamentos[];
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro do banco para interface FolhaPagamento
 */
const mapearFolhaPagamento = (registro: FolhaPagamentoRecord): FolhaPagamento => {
  return {
    id: registro.id,
    mesReferencia: registro.mes_referencia,
    anoReferencia: registro.ano_referencia,
    dataGeracao: registro.data_geracao,
    dataPagamento: registro.data_pagamento,
    valorTotal: Number(registro.valor_total),
    status: registro.status,
    observacoes: registro.observacoes,
    createdBy: registro.created_by,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro do banco para interface ItemFolhaPagamento
 */
const mapearItemFolha = (registro: ItemFolhaPagamentoRecord): ItemFolhaPagamento => {
  return {
    id: registro.id,
    folhaPagamentoId: registro.folha_pagamento_id,
    usuarioId: registro.usuario_id,
    salarioId: registro.salario_id,
    valorBruto: Number(registro.valor_bruto),
    lancamentoFinanceiroId: registro.lancamento_financeiro_id,
    observacoes: registro.observacoes,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro com relacionamentos para ItemFolhaComDetalhes
 */
const mapearItemFolhaComDetalhes = (registro: ItemFolhaComRelacionamentos): ItemFolhaComDetalhes => {
  const item = mapearItemFolha(registro);

  const usuario: UsuarioResumo | undefined = registro.usuarios
    ? {
      id: registro.usuarios.id,
      nomeExibicao: registro.usuarios.nome_exibicao,
      email: registro.usuarios.email_corporativo,
      cargo: registro.usuarios.cargos?.nome,
    }
    : undefined;

  const salario: Salario | undefined = registro.salarios
    ? {
      id: registro.salarios.id,
      usuarioId: registro.usuario_id,
      cargoId: null,
      salarioBruto: Number(registro.salarios.salario_bruto),
      dataInicioVigencia: registro.salarios.data_inicio_vigencia,
      dataFimVigencia: registro.salarios.data_fim_vigencia,
      observacoes: null,
      ativo: true,
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    }
    : undefined;

  const lancamento: LancamentoFinanceiroResumo | undefined = registro.lancamentos_financeiros
    ? {
      id: registro.lancamentos_financeiros.id,
      descricao: registro.lancamentos_financeiros.descricao,
      valor: Number(registro.lancamentos_financeiros.valor),
      status: registro.lancamentos_financeiros.status,
      dataVencimento: registro.lancamentos_financeiros.data_vencimento,
      dataEfetivacao: registro.lancamentos_financeiros.data_efetivacao,
    }
    : undefined;

  return {
    ...item,
    usuario,
    salario,
    lancamento,
  };
};

/**
 * Converte registro com relacionamentos para FolhaPagamentoComDetalhes
 */
const mapearFolhaComDetalhes = (registro: FolhaComRelacionamentos): FolhaPagamentoComDetalhes => {
  const folha = mapearFolhaPagamento(registro);

  const itens = (registro.itens_folha_pagamento || []).map(mapearItemFolhaComDetalhes);

  return {
    ...folha,
    itens,
    totalFuncionarios: itens.length,
  };
};

// ============================================================================
// Cache Keys
// ============================================================================

const getFolhasListKey = (params: ListarFolhasParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:list`, params as Record<string, unknown>);
};

const getFolhaByIdKey = (id: number): string => {
  return `${CACHE_PREFIX}:id:${id}`;
};

const getFolhaPorPeriodoKey = (ano: number, mes: number): string => {
  return `${CACHE_PREFIX}:periodo:${ano}:${mes}`;
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Listar folhas de pagamento com filtros e paginação
 */
export const listarFolhasPagamento = async (
  params: ListarFolhasParams
): Promise<ListarFolhasResponse> => {
  const cacheKey = getFolhasListKey(params);
  const cached = await getCached<ListarFolhasResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarFolhasPagamento: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarFolhasPagamento: ${cacheKey}`);

  const {
    pagina = 1,
    limite = 50,
    mesReferencia,
    anoReferencia,
    status,
    ordenarPor = 'periodo',
    ordem = 'desc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('folhas_pagamento')
    .select(
      `
      *,
      itens_folha_pagamento(
        *,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `,
      { count: 'exact' }
    );

  // Filtro de mês
  if (mesReferencia) {
    query = query.eq('mes_referencia', mesReferencia);
  }

  // Filtro de ano
  if (anoReferencia) {
    query = query.eq('ano_referencia', anoReferencia);
  }

  // Filtro de status
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  // Ordenação
  if (ordenarPor === 'periodo') {
    query = query
      .order('ano_referencia', { ascending: ordem === 'asc' })
      .order('mes_referencia', { ascending: ordem === 'asc' });
  } else {
    query = query.order(ordenarPor, { ascending: ordem === 'asc' });
  }

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar folhas de pagamento: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarFolhasResponse = {
    items: (data || []).map(mapearFolhaComDetalhes),
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
 * Buscar folha de pagamento por ID com detalhes
 */
export const buscarFolhaPorId = async (id: number): Promise<FolhaPagamentoComDetalhes | null> => {
  const cacheKey = getFolhaByIdKey(id);
  const cached = await getCached<FolhaPagamentoComDetalhes>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarFolhaPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarFolhaPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select(
      `
      *,
      itens_folha_pagamento(
        *,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar folha de pagamento: ${error.message}`);
  }

  const result = mapearFolhaComDetalhes(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar folha de pagamento por período (mês/ano)
 */
export const buscarFolhaPorPeriodo = async (
  mes: number,
  ano: number
): Promise<FolhaPagamentoComDetalhes | null> => {
  const cacheKey = getFolhaPorPeriodoKey(ano, mes);
  const cached = await getCached<FolhaPagamentoComDetalhes>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select(
      `
      *,
      itens_folha_pagamento(
        *,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `
    )
    .eq('mes_referencia', mes)
    .eq('ano_referencia', ano)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar folha por período: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const result = mapearFolhaComDetalhes(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Verificar se já existe folha para o período
 */
export const verificarFolhaExistente = async (
  mes: number,
  ano: number
): Promise<boolean> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('folhas_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('mes_referencia', mes)
    .eq('ano_referencia', ano);

  if (error) {
    throw new Error(`Erro ao verificar folha existente: ${error.message}`);
  }

  return (count || 0) > 0;
};

/**
 * Buscar itens de uma folha específica
 */
export const buscarItensDaFolha = async (folhaId: number): Promise<ItemFolhaComDetalhes[]> => {
  const cacheKey = `${CACHE_PREFIX}:itens:${folhaId}`;
  const cached = await getCached<ItemFolhaComDetalhes[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('itens_folha_pagamento')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos(nome)),
      salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
      lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
    `
    )
    .eq('folha_pagamento_id', folhaId)
    .order('usuarios(nome_exibicao)', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar itens da folha: ${error.message}`);
  }

  const result = (data || []).map(mapearItemFolhaComDetalhes);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Calcular totais por status (para dashboards)
 */
export const calcularTotaisPorStatus = async (): Promise<TotaisFolhasPorStatus> => {
  const cacheKey = `${CACHE_PREFIX}:totais_status`;
  const cached = await getCached<TotaisFolhasPorStatus>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select('status, valor_total');

  if (error) {
    throw new Error(`Erro ao calcular totais: ${error.message}`);
  }

  const totais: TotaisFolhasPorStatus = {
    rascunho: { quantidade: 0, valorTotal: 0 },
    aprovada: { quantidade: 0, valorTotal: 0 },
    paga: { quantidade: 0, valorTotal: 0 },
    cancelada: { quantidade: 0, valorTotal: 0 },
  };

  for (const item of data || []) {
    const status = item.status as StatusFolhaPagamento;
    if (totais[status]) {
      totais[status].quantidade++;
      totais[status].valorTotal += Number(item.valor_total);
    }
  }

  await setCached(cacheKey, totais, 300); // 5 minutos
  return totais;
};

// ============================================================================
// Operações de Escrita
// ============================================================================

/**
 * Criar nova folha de pagamento (apenas o registro principal, sem itens)
 */
export const criarFolhaPagamento = async (
  dados: {
    mesReferencia: number;
    anoReferencia: number;
    dataPagamento?: string;
    observacoes?: string;
  },
  createdBy: number
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  // Verificar se já existe folha para o período
  const existe = await verificarFolhaExistente(dados.mesReferencia, dados.anoReferencia);
  if (existe) {
    throw new Error(`Já existe uma folha de pagamento para ${dados.mesReferencia}/${dados.anoReferencia}`);
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .insert({
      mes_referencia: dados.mesReferencia,
      ano_referencia: dados.anoReferencia,
      data_geracao: new Date().toISOString(),
      data_pagamento: dados.dataPagamento || null,
      valor_total: 0,
      status: 'rascunho',
      observacoes: dados.observacoes?.trim() || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Já existe uma folha de pagamento para ${dados.mesReferencia}/${dados.anoReferencia}`);
    }
    throw new Error(`Erro ao criar folha de pagamento: ${error.message}`);
  }

  await invalidateFolhasCache();
  return mapearFolhaPagamento(data);
};

/**
 * Criar item de folha de pagamento
 */
export const criarItemFolha = async (
  folhaId: number,
  usuarioId: number,
  salarioId: number,
  valorBruto: number,
  observacoes?: string
): Promise<ItemFolhaPagamento> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('itens_folha_pagamento')
    .insert({
      folha_pagamento_id: folhaId,
      usuario_id: usuarioId,
      salario_id: salarioId,
      valor_bruto: valorBruto,
      lancamento_financeiro_id: null,
      observacoes: observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este funcionário já está incluído nesta folha de pagamento');
    }
    throw new Error(`Erro ao criar item da folha: ${error.message}`);
  }

  await invalidateFolhasCache();
  return mapearItemFolha(data);
};

/**
 * Atualizar valor total da folha
 */
export const atualizarValorTotalFolha = async (folhaId: number): Promise<void> => {
  const supabase = createServiceClient();

  // Somar valores dos itens
  const { data: itens, error: erroItens } = await supabase
    .from('itens_folha_pagamento')
    .select('valor_bruto')
    .eq('folha_pagamento_id', folhaId);

  if (erroItens) {
    throw new Error(`Erro ao calcular total: ${erroItens.message}`);
  }

  const valorTotal = (itens || []).reduce((acc, item) => acc + Number(item.valor_bruto), 0);

  const { error } = await supabase
    .from('folhas_pagamento')
    .update({ valor_total: valorTotal })
    .eq('id', folhaId);

  if (error) {
    throw new Error(`Erro ao atualizar valor total: ${error.message}`);
  }

  await invalidateFolhasCache();
};

/**
 * Atualizar folha de pagamento (apenas rascunho)
 */
export const atualizarFolhaPagamento = async (
  id: number,
  dados: {
    dataPagamento?: string | null;
    observacoes?: string | null;
  }
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  // Verificar status atual
  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folhaAtual.status !== 'rascunho') {
    throw new Error('Apenas folhas em rascunho podem ser editadas');
  }

  const updateData: Record<string, unknown> = {};

  if (dados.dataPagamento !== undefined) {
    updateData.data_pagamento = dados.dataPagamento;
  }
  if (dados.observacoes !== undefined) {
    updateData.observacoes = dados.observacoes?.trim() || null;
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar folha: ${error.message}`);
  }

  await invalidateFolhasCache();
  return mapearFolhaPagamento(data);
};

/**
 * Atualizar status da folha de pagamento
 */
export const atualizarStatusFolha = async (
  id: number,
  novoStatus: StatusFolhaPagamento,
  dadosAdicionais?: {
    dataPagamento?: string;
    observacoes?: string;
  }
): Promise<FolhaPagamento> => {
  const supabase = createServiceClient();

  // Verificar status atual
  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status, observacoes')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  // Validar transição de status
  if (!isTransicaoStatusValida(folhaAtual.status as StatusFolhaPagamento, novoStatus)) {
    throw new Error(`Transição de status inválida: ${folhaAtual.status} -> ${novoStatus}`);
  }

  const updateData: Record<string, unknown> = {
    status: novoStatus,
  };

  if (dadosAdicionais?.dataPagamento) {
    updateData.data_pagamento = dadosAdicionais.dataPagamento;
  }

  // Mesclar observações
  if (dadosAdicionais?.observacoes) {
    const obsAtuais = folhaAtual.observacoes || '';
    const novasObs = dadosAdicionais.observacoes;
    updateData.observacoes = obsAtuais ? `${obsAtuais}\n\n${novasObs}` : novasObs;
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }

  await invalidateFolhasCache();
  return mapearFolhaPagamento(data);
};

/**
 * Vincular lançamento financeiro a um item da folha
 */
export const vincularLancamentoAoItem = async (
  itemId: number,
  lancamentoId: number
): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('itens_folha_pagamento')
    .update({ lancamento_financeiro_id: lancamentoId })
    .eq('id', itemId);

  if (error) {
    throw new Error(`Erro ao vincular lançamento: ${error.message}`);
  }

  await invalidateFolhasCache();
};

/**
 * Deletar folha de pagamento (apenas rascunho)
 */
export const deletarFolhaPagamento = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Verificar status atual
  const { data: folhaAtual, error: erroConsulta } = await supabase
    .from('folhas_pagamento')
    .select('status')
    .eq('id', id)
    .single();

  if (erroConsulta || !folhaAtual) {
    throw new Error('Folha de pagamento não encontrada');
  }

  if (folhaAtual.status !== 'rascunho') {
    throw new Error('Apenas folhas em rascunho podem ser excluídas. Para folhas aprovadas ou pagas, use a opção de cancelamento.');
  }

  // Deletar itens primeiro (cascade deveria cuidar, mas fazemos explícito)
  const { error: erroItens } = await supabase
    .from('itens_folha_pagamento')
    .delete()
    .eq('folha_pagamento_id', id);

  if (erroItens) {
    throw new Error(`Erro ao excluir itens: ${erroItens.message}`);
  }

  // Deletar folha
  const { error } = await supabase
    .from('folhas_pagamento')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir folha: ${error.message}`);
  }

  await invalidateFolhasCache();
};

/**
 * Deletar item de folha (apenas se folha em rascunho)
 */
export const deletarItemFolha = async (itemId: number): Promise<void> => {
  const supabase = createServiceClient();

  // Buscar item e verificar status da folha
  const { data: item, error: erroItem } = await supabase
    .from('itens_folha_pagamento')
    .select('folha_pagamento_id')
    .eq('id', itemId)
    .single();

  if (erroItem || !item) {
    throw new Error('Item não encontrado');
  }

  const { data: folha, error: erroFolha } = await supabase
    .from('folhas_pagamento')
    .select('status')
    .eq('id', item.folha_pagamento_id)
    .single();

  if (erroFolha || !folha) {
    throw new Error('Folha não encontrada');
  }

  if (folha.status !== 'rascunho') {
    throw new Error('Itens só podem ser removidos de folhas em rascunho');
  }

  const { error } = await supabase
    .from('itens_folha_pagamento')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(`Erro ao excluir item: ${error.message}`);
  }

  // Atualizar valor total da folha
  await atualizarValorTotalFolha(item.folha_pagamento_id);

  await invalidateFolhasCache();
};

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalidar todo o cache de folhas de pagamento
 * Também invalida o cache de salários (pois podem estar relacionados)
 */
export const invalidateFolhasCache = async (): Promise<void> => {
  await deletePattern(`${CACHE_PREFIX}:*`);
  // Invalidar cache de salários também, pois podem ter sido usados em folhas
  await invalidateSalariosCache();
};

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Buscar histórico de folhas por ano
 */
export const buscarFolhasPorAno = async (ano: number): Promise<FolhaPagamentoComDetalhes[]> => {
  const cacheKey = `${CACHE_PREFIX}:ano:${ano}`;
  const cached = await getCached<FolhaPagamentoComDetalhes[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select(
      `
      *,
      itens_folha_pagamento(
        *,
        usuarios(id, nome_exibicao, email_corporativo, cargo_id, cargos(nome)),
        salarios(id, salario_bruto, data_inicio_vigencia, data_fim_vigencia),
        lancamentos_financeiros(id, descricao, valor, status, data_vencimento, data_efetivacao)
      )
    `
    )
    .eq('ano_referencia', ano)
    .order('mes_referencia', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar folhas por ano: ${error.message}`);
  }

  const result = (data || []).map(mapearFolhaComDetalhes);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Calcular evolução mensal (últimos N meses)
 */
export const calcularEvolucaoMensal = async (
  meses: number = 12
): Promise<Array<{
  mes: number;
  ano: number;
  valorTotal: number;
  status: StatusFolhaPagamento;
  totalFuncionarios: number;
}>> => {
  const cacheKey = `${CACHE_PREFIX}:evolucao:${meses}`;
  const cached = await getCached<Array<{
    mes: number;
    ano: number;
    valorTotal: number;
    status: StatusFolhaPagamento;
    totalFuncionarios: number;
  }>>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  // Calcular período
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  // Calcular data de início (N meses atrás)
  let mesInicio = mesAtual - meses + 1;
  let anoInicio = anoAtual;
  while (mesInicio <= 0) {
    mesInicio += 12;
    anoInicio--;
  }

  const { data, error } = await supabase
    .from('folhas_pagamento')
    .select('id, mes_referencia, ano_referencia, valor_total, status')
    .gte('ano_referencia', anoInicio)
    .order('ano_referencia', { ascending: true })
    .order('mes_referencia', { ascending: true });

  if (error) {
    throw new Error(`Erro ao calcular evolução: ${error.message}`);
  }

  // Contar funcionários por folha usando o ID real da folha
  const folhaIds = (data || []).map((f) => f.id);
  const { data: contagens, error: erroContagens } = await supabase
    .from('itens_folha_pagamento')
    .select('folha_pagamento_id')
    .in('folha_pagamento_id', folhaIds);

  const contagensPorFolha = new Map<number, number>();
  for (const item of contagens || []) {
    const count = contagensPorFolha.get(item.folha_pagamento_id) || 0;
    contagensPorFolha.set(item.folha_pagamento_id, count + 1);
  }

  const result = (data || []).map((folha) => ({
    mes: folha.mes_referencia,
    ano: folha.ano_referencia,
    valorTotal: Number(folha.valor_total),
    status: folha.status as StatusFolhaPagamento,
    totalFuncionarios: contagensPorFolha.get(folha.id) || 0,
  }));

  await setCached(cacheKey, result, 300); // 5 minutos
  return result;
};
