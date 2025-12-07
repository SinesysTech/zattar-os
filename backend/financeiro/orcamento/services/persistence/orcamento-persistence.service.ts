/**
 * Serviço de persistência para Orçamentos
 * Gerencia operações de CRUD nas tabelas orcamentos e orcamento_itens
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import type {
  Orcamento,
  OrcamentoItem,
  OrcamentoComItens,
  OrcamentoComDetalhes,
  OrcamentoItemComDetalhes,
  CriarOrcamentoDTO,
  AtualizarOrcamentoDTO,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
  ListarOrcamentosParams,
  ListarOrcamentosResponse,
  BuscarItensParams,
  StatusOrcamento,
  PeriodoOrcamento,
  ContaContabilResumo,
  CentroCustoResumo,
  UsuarioResumo,
} from '@/backend/types/financeiro/orcamento.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'orcamentos';
const CACHE_TTL = 600; // 10 minutos
const CACHE_TTL_SHORT = 300; // 5 minutos para dados que mudam frequentemente

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

interface OrcamentoRecord {
  id: number;
  nome: string;
  descricao: string | null;
  ano: number;
  periodo: PeriodoOrcamento;
  data_inicio: string;
  data_fim: string;
  status: StatusOrcamento;
  observacoes: string | null;
  created_by: number | null;
  aprovado_por: number | null;
  aprovado_em: string | null;
  iniciado_por: number | null;
  iniciado_em: string | null;
  encerrado_por: number | null;
  encerrado_em: string | null;
  created_at: string;
  updated_at: string;
}

interface OrcamentoItemRecord {
  id: number;
  orcamento_id: number;
  conta_contabil_id: number;
  centro_custo_id: number | null;
  mes: number | null;
  valor_orcado: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrcamentoItemComRelacionamentos extends OrcamentoItemRecord {
  plano_contas?: {
    id: number;
    codigo: string;
    nome: string;
    tipo_conta: string;
  } | null;
  centros_custo?: {
    id: number;
    codigo: string;
    nome: string;
  } | null;
}

interface OrcamentoComRelacionamentos extends OrcamentoRecord {
  orcamento_itens?: OrcamentoItemComRelacionamentos[];
  criado_por_usuario?: {
    id: number;
    nome_completo: string;
    nome_exibicao: string;
  } | null;
  aprovado_por_usuario?: {
    id: number;
    nome_completo: string;
    nome_exibicao: string;
  } | null;
  iniciado_por_usuario?: {
    id: number;
    nome_completo: string;
    nome_exibicao: string;
  } | null;
  encerrado_por_usuario?: {
    id: number;
    nome_completo: string;
    nome_exibicao: string;
  } | null;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro do banco para interface Orcamento
 */
const mapearOrcamento = (registro: OrcamentoRecord): Orcamento => {
  return {
    id: registro.id,
    nome: registro.nome,
    descricao: registro.descricao,
    ano: registro.ano,
    periodo: registro.periodo,
    dataInicio: registro.data_inicio,
    dataFim: registro.data_fim,
    status: registro.status,
    observacoes: registro.observacoes,
    createdBy: registro.created_by,
    aprovadoPor: registro.aprovado_por,
    aprovadoEm: registro.aprovado_em,
    iniciadoPor: registro.iniciado_por,
    iniciadoEm: registro.iniciado_em,
    encerradoPor: registro.encerrado_por,
    encerradoEm: registro.encerrado_em,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro do banco para interface OrcamentoItem
 */
const mapearOrcamentoItem = (registro: OrcamentoItemRecord): OrcamentoItem => {
  return {
    id: registro.id,
    orcamentoId: registro.orcamento_id,
    contaContabilId: registro.conta_contabil_id,
    centroCustoId: registro.centro_custo_id,
    mes: registro.mes,
    valorOrcado: Number(registro.valor_orcado),
    observacoes: registro.observacoes,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro com relacionamentos para OrcamentoItemComDetalhes
 */
const mapearOrcamentoItemComDetalhes = (
  registro: OrcamentoItemComRelacionamentos
): OrcamentoItemComDetalhes => {
  const item = mapearOrcamentoItem(registro);

  const contaContabil: ContaContabilResumo | undefined = registro.plano_contas
    ? {
        id: registro.plano_contas.id,
        codigo: registro.plano_contas.codigo,
        nome: registro.plano_contas.nome,
        tipoConta: registro.plano_contas.tipo_conta,
      }
    : undefined;

  const centroCusto: CentroCustoResumo | undefined = registro.centros_custo
    ? {
        id: registro.centros_custo.id,
        codigo: registro.centros_custo.codigo,
        nome: registro.centros_custo.nome,
      }
    : undefined;

  return {
    ...item,
    contaContabil,
    centroCusto,
  };
};

/**
 * Mapeia usuário para resumo
 */
const mapearUsuarioResumo = (
  usuario: { id: number; nome_completo: string; nome_exibicao: string } | null | undefined
): UsuarioResumo | undefined => {
  if (!usuario) return undefined;
  return {
    id: usuario.id,
    nomeCompleto: usuario.nome_completo,
    nomeExibicao: usuario.nome_exibicao,
  };
};

/**
 * Converte registro com relacionamentos para OrcamentoComDetalhes
 */
const mapearOrcamentoComDetalhes = (
  registro: OrcamentoComRelacionamentos
): OrcamentoComDetalhes => {
  const orcamento = mapearOrcamento(registro);
  const itens = (registro.orcamento_itens || []).map(mapearOrcamentoItemComDetalhes);
  const totalOrcado = itens.reduce((acc, item) => acc + item.valorOrcado, 0);

  return {
    ...orcamento,
    itens,
    totalOrcado,
    criadoPor: mapearUsuarioResumo(registro.criado_por_usuario),
    aprovadoPorUsuario: mapearUsuarioResumo(registro.aprovado_por_usuario),
    iniciadoPorUsuario: mapearUsuarioResumo(registro.iniciado_por_usuario),
    encerradoPorUsuario: mapearUsuarioResumo(registro.encerrado_por_usuario),
  };
};

// ============================================================================
// Cache Keys
// ============================================================================

const getOrcamentosListKey = (params: ListarOrcamentosParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:list`, params as Record<string, unknown>);
};

const getOrcamentoByIdKey = (id: number): string => {
  return `${CACHE_PREFIX}:id:${id}`;
};

const getOrcamentoDetalhesKey = (id: number): string => {
  return `${CACHE_PREFIX}:detalhes:${id}`;
};

const getOrcamentoItensKey = (orcamentoId: number, filtros?: BuscarItensParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:${orcamentoId}:itens`, filtros as Record<string, unknown>);
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Listar orçamentos com filtros e paginação
 */
export const listarOrcamentos = async (
  params: ListarOrcamentosParams
): Promise<ListarOrcamentosResponse> => {
  const cacheKey = getOrcamentosListKey(params);
  const cached = await getCached<ListarOrcamentosResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarOrcamentos: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarOrcamentos: ${cacheKey}`);

  const {
    pagina = 1,
    limite = 50,
    busca,
    ano,
    periodo,
    status,
    ordenarPor = 'ano',
    ordem = 'desc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('orcamentos')
    .select(
      `
      *,
      orcamento_itens(
        *,
        plano_contas(id, codigo, nome, tipo_conta),
        centros_custo(id, codigo, nome)
      ),
      criado_por_usuario:usuarios!orcamentos_created_by_fkey(id, nome_completo, nome_exibicao),
      aprovado_por_usuario:usuarios!orcamentos_aprovado_por_fkey(id, nome_completo, nome_exibicao),
      iniciado_por_usuario:usuarios!orcamentos_iniciado_por_fkey(id, nome_completo, nome_exibicao),
      encerrado_por_usuario:usuarios!orcamentos_encerrado_por_fkey(id, nome_completo, nome_exibicao)
    `,
      { count: 'exact' }
    );

  // Filtro de busca (nome, descrição)
  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  // Filtro de ano
  if (ano) {
    query = query.eq('ano', ano);
  }

  // Filtro de período
  if (periodo) {
    query = query.eq('periodo', periodo);
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
  const campoOrdenacao = ordenarPor === 'data_inicio' ? 'data_inicio' : ordenarPor;
  query = query.order(campoOrdenacao, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar orçamentos: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarOrcamentosResponse = {
    items: (data || []).map(mapearOrcamentoComDetalhes),
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
 * Buscar orçamento por ID
 */
export const buscarOrcamentoPorId = async (id: number): Promise<Orcamento | null> => {
  const cacheKey = getOrcamentoByIdKey(id);
  const cached = await getCached<Orcamento>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarOrcamentoPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarOrcamentoPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar orçamento: ${error.message}`);
  }

  const result = mapearOrcamento(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar orçamento por ID com detalhes completos
 */
export const buscarOrcamentoComDetalhes = async (id: number): Promise<OrcamentoComDetalhes | null> => {
  const cacheKey = getOrcamentoDetalhesKey(id);
  const cached = await getCached<OrcamentoComDetalhes>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarOrcamentoComDetalhes: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarOrcamentoComDetalhes: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orcamentos')
    .select(
      `
      *,
      orcamento_itens(
        *,
        plano_contas(id, codigo, nome, tipo_conta),
        centros_custo(id, codigo, nome)
      ),
      criado_por_usuario:usuarios!orcamentos_created_by_fkey(id, nome_completo, nome_exibicao),
      aprovado_por_usuario:usuarios!orcamentos_aprovado_por_fkey(id, nome_completo, nome_exibicao),
      iniciado_por_usuario:usuarios!orcamentos_iniciado_por_fkey(id, nome_completo, nome_exibicao),
      encerrado_por_usuario:usuarios!orcamentos_encerrado_por_fkey(id, nome_completo, nome_exibicao)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar orçamento com detalhes: ${error.message}`);
  }

  const result = mapearOrcamentoComDetalhes(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar orçamento por ano e período
 */
export const buscarOrcamentoPorPeriodo = async (
  ano: number,
  periodo: PeriodoOrcamento
): Promise<Orcamento | null> => {
  const cacheKey = `${CACHE_PREFIX}:periodo:${ano}:${periodo}`;
  const cached = await getCached<Orcamento>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('ano', ano)
    .eq('periodo', periodo)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar orçamento por período: ${error.message}`);
  }

  if (!data) return null;

  const result = mapearOrcamento(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar orçamento em execução atual
 */
export const buscarOrcamentoEmExecucao = async (): Promise<Orcamento | null> => {
  const cacheKey = `${CACHE_PREFIX}:em_execucao`;
  const cached = await getCached<Orcamento>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();
  const hoje = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('status', 'em_execucao')
    .lte('data_inicio', hoje)
    .gte('data_fim', hoje)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar orçamento em execução: ${error.message}`);
  }

  if (!data) return null;

  const result = mapearOrcamento(data);
  await setCached(cacheKey, result, CACHE_TTL_SHORT);
  return result;
};

/**
 * Buscar itens de um orçamento
 */
export const buscarItensOrcamento = async (
  orcamentoId: number,
  filtros?: BuscarItensParams
): Promise<OrcamentoItemComDetalhes[]> => {
  const cacheKey = getOrcamentoItensKey(orcamentoId, filtros);
  const cached = await getCached<OrcamentoItemComDetalhes[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  let query = supabase
    .from('orcamento_itens')
    .select(
      `
      *,
      plano_contas(id, codigo, nome, tipo_conta),
      centros_custo(id, codigo, nome)
    `
    )
    .eq('orcamento_id', orcamentoId);

  if (filtros?.contaContabilId) {
    query = query.eq('conta_contabil_id', filtros.contaContabilId);
  }
  if (filtros?.centroCustoId) {
    query = query.eq('centro_custo_id', filtros.centroCustoId);
  }
  if (filtros?.mes) {
    query = query.eq('mes', filtros.mes);
  }

  query = query.order('id', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar itens do orçamento: ${error.message}`);
  }

  const result = (data || []).map(mapearOrcamentoItemComDetalhes);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

// ============================================================================
// Operações de Escrita
// ============================================================================

/**
 * Criar novo orçamento
 */
export const criarOrcamento = async (
  dados: CriarOrcamentoDTO,
  usuarioId: number
): Promise<Orcamento> => {
  const supabase = createServiceClient();

  // Verificar se já existe orçamento para o mesmo ano/período
  const { data: existente } = await supabase
    .from('orcamentos')
    .select('id')
    .eq('ano', dados.ano)
    .eq('periodo', dados.periodo)
    .maybeSingle();

  if (existente) {
    throw new Error(`Já existe um orçamento para ${dados.ano} - ${dados.periodo}`);
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim() || null,
      ano: dados.ano,
      periodo: dados.periodo,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
      status: 'rascunho',
      observacoes: dados.observacoes?.trim() || null,
      created_by: usuarioId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache();
  return mapearOrcamento(data);
};

/**
 * Atualizar orçamento existente
 */
export const atualizarOrcamento = async (
  id: number,
  dados: AtualizarOrcamentoDTO
): Promise<Orcamento> => {
  const supabase = createServiceClient();

  // Buscar orçamento atual
  const { data: orcamentoAtual, error: erroConsulta } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (erroConsulta || !orcamentoAtual) {
    throw new Error('Orçamento não encontrado');
  }

  // Não permitir atualizar orçamentos encerrados
  if (orcamentoAtual.status === 'encerrado') {
    throw new Error('Não é possível alterar orçamento encerrado');
  }

  // Não permitir alterar orçamentos em execução (exceto observações)
  if (orcamentoAtual.status === 'em_execucao') {
    if (dados.nome !== undefined || dados.dataInicio !== undefined || dados.dataFim !== undefined) {
      throw new Error('Não é possível alterar nome ou datas de orçamento em execução');
    }
  }

  const updateData: Record<string, unknown> = {};

  if (dados.nome !== undefined) {
    updateData.nome = dados.nome.trim();
  }
  if (dados.descricao !== undefined) {
    updateData.descricao = dados.descricao?.trim() || null;
  }
  if (dados.dataInicio !== undefined) {
    updateData.data_inicio = dados.dataInicio;
  }
  if (dados.dataFim !== undefined) {
    updateData.data_fim = dados.dataFim;
  }
  if (dados.observacoes !== undefined) {
    updateData.observacoes = dados.observacoes?.trim() || null;
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(id);
  return mapearOrcamento(data);
};

/**
 * Aprovar orçamento
 */
export const aprovarOrcamento = async (
  id: number,
  usuarioId: number,
  observacoes?: string
): Promise<Orcamento> => {
  const supabase = createServiceClient();

  // Buscar orçamento atual
  const { data: orcamentoAtual, error: erroConsulta } = await supabase
    .from('orcamentos')
    .select('*, orcamento_itens(id)')
    .eq('id', id)
    .single();

  if (erroConsulta || !orcamentoAtual) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamentoAtual.status !== 'rascunho') {
    throw new Error('Apenas orçamentos em rascunho podem ser aprovados');
  }

  // Verificar se tem pelo menos um item
  if (!orcamentoAtual.orcamento_itens || orcamentoAtual.orcamento_itens.length === 0) {
    throw new Error('O orçamento deve ter pelo menos um item para ser aprovado');
  }

  const updateData: Record<string, unknown> = {
    status: 'aprovado',
    aprovado_por: usuarioId,
    aprovado_em: new Date().toISOString(),
  };

  if (observacoes) {
    const obsAtual = orcamentoAtual.observacoes || '';
    updateData.observacoes = obsAtual
      ? `${obsAtual}\n\n[Aprovação] ${observacoes}`
      : `[Aprovação] ${observacoes}`;
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao aprovar orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(id);
  return mapearOrcamento(data);
};

/**
 * Iniciar execução do orçamento
 */
export const iniciarExecucao = async (
  id: number,
  usuarioId: number
): Promise<Orcamento> => {
  const supabase = createServiceClient();

  // Buscar orçamento atual
  const { data: orcamentoAtual, error: erroConsulta } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (erroConsulta || !orcamentoAtual) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamentoAtual.status !== 'aprovado') {
    throw new Error('Apenas orçamentos aprovados podem iniciar execução');
  }

  // Verificar se há outro orçamento em execução no mesmo período
  const { data: emExecucao } = await supabase
    .from('orcamentos')
    .select('id, nome')
    .eq('status', 'em_execucao')
    .eq('ano', orcamentoAtual.ano)
    .maybeSingle();

  if (emExecucao) {
    throw new Error(`Já existe um orçamento em execução para ${orcamentoAtual.ano}: ${emExecucao.nome}`);
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update({
      status: 'em_execucao',
      iniciado_por: usuarioId,
      iniciado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao iniciar execução do orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(id);
  return mapearOrcamento(data);
};

/**
 * Encerrar orçamento
 */
export const encerrarOrcamento = async (
  id: number,
  usuarioId: number,
  observacoes?: string
): Promise<Orcamento> => {
  const supabase = createServiceClient();

  // Buscar orçamento atual
  const { data: orcamentoAtual, error: erroConsulta } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (erroConsulta || !orcamentoAtual) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamentoAtual.status !== 'em_execucao') {
    throw new Error('Apenas orçamentos em execução podem ser encerrados');
  }

  const updateData: Record<string, unknown> = {
    status: 'encerrado',
    encerrado_por: usuarioId,
    encerrado_em: new Date().toISOString(),
  };

  if (observacoes) {
    const obsAtual = orcamentoAtual.observacoes || '';
    updateData.observacoes = obsAtual
      ? `${obsAtual}\n\n[Encerramento] ${observacoes}`
      : `[Encerramento] ${observacoes}`;
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao encerrar orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(id);
  return mapearOrcamento(data);
};

/**
 * Deletar orçamento (apenas rascunho)
 */
export const deletarOrcamento = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Buscar orçamento atual
  const { data: orcamentoAtual, error: erroConsulta } = await supabase
    .from('orcamentos')
    .select('status')
    .eq('id', id)
    .single();

  if (erroConsulta || !orcamentoAtual) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamentoAtual.status !== 'rascunho') {
    throw new Error('Apenas orçamentos em rascunho podem ser excluídos');
  }

  // Os itens serão excluídos automaticamente pelo CASCADE
  const { error } = await supabase.from('orcamentos').delete().eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(id);
};

// ============================================================================
// Operações de Itens
// ============================================================================

/**
 * Criar item de orçamento
 */
export const criarOrcamentoItem = async (
  orcamentoId: number,
  dados: CriarOrcamentoItemDTO
): Promise<OrcamentoItem> => {
  const supabase = createServiceClient();

  // Verificar se orçamento existe e está em rascunho
  const { data: orcamento, error: erroOrcamento } = await supabase
    .from('orcamentos')
    .select('status')
    .eq('id', orcamentoId)
    .single();

  if (erroOrcamento || !orcamento) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamento.status !== 'rascunho') {
    throw new Error('Apenas orçamentos em rascunho podem ter itens adicionados');
  }

  // Verificar se conta contábil é analítica
  const { data: conta, error: erroConta } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome, aceita_lancamento, ativo')
    .eq('id', dados.contaContabilId)
    .single();

  if (erroConta || !conta) {
    throw new Error('Conta contábil não encontrada');
  }

  if (!conta.ativo) {
    throw new Error('Conta contábil está inativa');
  }

  if (!conta.aceita_lancamento) {
    throw new Error(
      `Conta contábil "${conta.codigo} - ${conta.nome}" é sintética e não aceita lançamentos. Selecione uma conta analítica.`
    );
  }

  // Verificar duplicidade
  const { data: existente } = await supabase
    .from('orcamento_itens')
    .select('id')
    .eq('orcamento_id', orcamentoId)
    .eq('conta_contabil_id', dados.contaContabilId)
    .eq('centro_custo_id', dados.centroCustoId ?? null)
    .eq('mes', dados.mes ?? null)
    .maybeSingle();

  if (existente) {
    throw new Error('Já existe um item com a mesma conta, centro de custo e mês');
  }

  const { data, error } = await supabase
    .from('orcamento_itens')
    .insert({
      orcamento_id: orcamentoId,
      conta_contabil_id: dados.contaContabilId,
      centro_custo_id: dados.centroCustoId || null,
      mes: dados.mes || null,
      valor_orcado: dados.valorOrcado,
      observacoes: dados.observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar item do orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(orcamentoId);
  return mapearOrcamentoItem(data);
};

/**
 * Atualizar item de orçamento
 */
export const atualizarOrcamentoItem = async (
  itemId: number,
  dados: AtualizarOrcamentoItemDTO
): Promise<OrcamentoItem> => {
  const supabase = createServiceClient();

  // Buscar item atual
  const { data: itemAtual, error: erroItem } = await supabase
    .from('orcamento_itens')
    .select('*, orcamentos!inner(status)')
    .eq('id', itemId)
    .single();

  if (erroItem || !itemAtual) {
    throw new Error('Item não encontrado');
  }

  if (itemAtual.orcamentos.status !== 'rascunho') {
    throw new Error('Apenas itens de orçamentos em rascunho podem ser alterados');
  }

  const updateData: Record<string, unknown> = {};

  if (dados.contaContabilId !== undefined) {
    // Verificar se nova conta é analítica
    const { data: conta, error: erroConta } = await supabase
      .from('plano_contas')
      .select('aceita_lancamento, ativo')
      .eq('id', dados.contaContabilId)
      .single();

    if (erroConta || !conta) {
      throw new Error('Conta contábil não encontrada');
    }
    if (!conta.ativo) {
      throw new Error('Conta contábil está inativa');
    }
    if (!conta.aceita_lancamento) {
      throw new Error('Conta contábil é sintética e não aceita lançamentos');
    }

    updateData.conta_contabil_id = dados.contaContabilId;
  }
  if (dados.centroCustoId !== undefined) {
    updateData.centro_custo_id = dados.centroCustoId;
  }
  if (dados.mes !== undefined) {
    updateData.mes = dados.mes;
  }
  if (dados.valorOrcado !== undefined) {
    updateData.valor_orcado = dados.valorOrcado;
  }
  if (dados.observacoes !== undefined) {
    updateData.observacoes = dados.observacoes?.trim() || null;
  }

  const { data, error } = await supabase
    .from('orcamento_itens')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar item do orçamento: ${error.message}`);
  }

  await invalidateOrcamentoCache(itemAtual.orcamento_id);
  return mapearOrcamentoItem(data);
};

/**
 * Deletar item de orçamento
 */
export const deletarOrcamentoItem = async (itemId: number): Promise<void> => {
  const supabase = createServiceClient();

  // Buscar item atual
  const { data: itemAtual, error: erroItem } = await supabase
    .from('orcamento_itens')
    .select('orcamento_id, orcamentos!inner(status)')
    .eq('id', itemId)
    .single();

  if (erroItem || !itemAtual) {
    throw new Error('Item não encontrado');
  }

  if (itemAtual.orcamentos.status !== 'rascunho') {
    throw new Error('Apenas itens de orçamentos em rascunho podem ser excluídos');
  }

  const { error } = await supabase.from('orcamento_itens').delete().eq('id', itemId);

  if (error) {
    throw new Error(`Erro ao excluir item: ${error.message}`);
  }

  await invalidateOrcamentoCache(itemAtual.orcamento_id);
};

/**
 * Criar itens em lote
 */
export const criarItensEmLote = async (
  orcamentoId: number,
  itens: CriarOrcamentoItemDTO[]
): Promise<OrcamentoItem[]> => {
  const supabase = createServiceClient();

  // Verificar se orçamento existe e está em rascunho
  const { data: orcamento, error: erroOrcamento } = await supabase
    .from('orcamentos')
    .select('status')
    .eq('id', orcamentoId)
    .single();

  if (erroOrcamento || !orcamento) {
    throw new Error('Orçamento não encontrado');
  }

  if (orcamento.status !== 'rascunho') {
    throw new Error('Apenas orçamentos em rascunho podem ter itens adicionados');
  }

  const registros = itens.map((item) => ({
    orcamento_id: orcamentoId,
    conta_contabil_id: item.contaContabilId,
    centro_custo_id: item.centroCustoId || null,
    mes: item.mes || null,
    valor_orcado: item.valorOrcado,
    observacoes: item.observacoes?.trim() || null,
  }));

  const { data, error } = await supabase
    .from('orcamento_itens')
    .insert(registros)
    .select();

  if (error) {
    throw new Error(`Erro ao criar itens em lote: ${error.message}`);
  }

  await invalidateOrcamentoCache(orcamentoId);
  return (data || []).map(mapearOrcamentoItem);
};

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Calcular total orçado de um orçamento
 */
export const calcularTotalOrcado = async (orcamentoId: number): Promise<number> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orcamento_itens')
    .select('valor_orcado')
    .eq('orcamento_id', orcamentoId);

  if (error) {
    throw new Error(`Erro ao calcular total orçado: ${error.message}`);
  }

  return (data || []).reduce((acc, item) => acc + Number(item.valor_orcado), 0);
};

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalidar todo o cache de orçamentos
 */
export const invalidateOrcamentoCache = async (orcamentoId?: number): Promise<void> => {
  if (orcamentoId) {
    // Invalidar cache específico
    await deletePattern(`${CACHE_PREFIX}:id:${orcamentoId}`);
    await deletePattern(`${CACHE_PREFIX}:detalhes:${orcamentoId}`);
    await deletePattern(`${CACHE_PREFIX}:${orcamentoId}:itens:*`);
  }
  // Invalidar listagens e caches gerais
  await deletePattern(`${CACHE_PREFIX}:list:*`);
  await deletePattern(`${CACHE_PREFIX}:periodo:*`);
  await deletePattern(`${CACHE_PREFIX}:em_execucao`);
  // Invalidar cache de análise também
  await deletePattern('analise_orcamentaria:*');
};
