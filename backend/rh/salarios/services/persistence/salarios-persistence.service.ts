/**
 * Serviço de persistência para Salários
 * Gerencia operações de CRUD na tabela salarios
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import type {
  Salario,
  SalarioComDetalhes,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  ListarSalariosParams,
  ListarSalariosResponse,
  UsuarioResumo,
  CargoResumo,
} from '@/backend/types/financeiro/salarios.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'salarios';
const CACHE_TTL = 600; // 10 minutos

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

interface SalarioRecord {
  id: number;
  usuario_id: number;
  cargo_id: number | null;
  salario_bruto: number;
  data_inicio_vigencia: string;
  data_fim_vigencia: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface SalarioComRelacionamentos extends SalarioRecord {
  usuarios?: {
    id: number;
    nome_exibicao: string;
    email: string;
    cargo?: string;
  } | null;
  cargos?: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro do banco para interface Salario
 */
const mapearSalario = (registro: SalarioRecord): Salario => {
  return {
    id: registro.id,
    usuarioId: registro.usuario_id,
    cargoId: registro.cargo_id,
    salarioBruto: Number(registro.salario_bruto),
    dataInicioVigencia: registro.data_inicio_vigencia,
    dataFimVigencia: registro.data_fim_vigencia,
    observacoes: registro.observacoes,
    ativo: registro.ativo,
    createdBy: registro.created_by,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  };
};

/**
 * Converte registro com relacionamentos para SalarioComDetalhes
 */
const mapearSalarioComDetalhes = (registro: SalarioComRelacionamentos): SalarioComDetalhes => {
  const salario = mapearSalario(registro);

  const usuario: UsuarioResumo | undefined = registro.usuarios
    ? {
        id: registro.usuarios.id,
        nomeExibicao: registro.usuarios.nome_exibicao,
        email: registro.usuarios.email,
        cargo: registro.usuarios.cargo,
      }
    : undefined;

  const cargo: CargoResumo | undefined = registro.cargos
    ? {
        id: registro.cargos.id,
        nome: registro.cargos.nome,
        descricao: registro.cargos.descricao,
      }
    : undefined;

  return {
    ...salario,
    usuario,
    cargo,
  };
};

// ============================================================================
// Cache Keys
// ============================================================================

const getSalariosListKey = (params: ListarSalariosParams): string => {
  return generateCacheKey(`${CACHE_PREFIX}:list`, params as Record<string, unknown>);
};

const getSalarioByIdKey = (id: number): string => {
  return `${CACHE_PREFIX}:id:${id}`;
};

const getSalarioVigenteUsuarioKey = (usuarioId: number): string => {
  return `${CACHE_PREFIX}:usuario:${usuarioId}:vigente`;
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Listar salários com filtros e paginação
 */
export const listarSalarios = async (
  params: ListarSalariosParams
): Promise<ListarSalariosResponse> => {
  const cacheKey = getSalariosListKey(params);
  const cached = await getCached<ListarSalariosResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarSalarios: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarSalarios: ${cacheKey}`);

  const {
    pagina = 1,
    limite = 50,
    busca,
    usuarioId,
    cargoId,
    ativo,
    vigente,
    ordenarPor = 'data_inicio_vigencia',
    ordem = 'desc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase
    .from('salarios')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email, cargo),
      cargos(id, nome, descricao)
    `,
      { count: 'exact' }
    );

  // Filtro de busca (nome do usuário ou observações)
  if (busca) {
    query = query.or(`observacoes.ilike.%${busca}%,usuarios.nome_exibicao.ilike.%${busca}%`);
  }

  // Filtro de usuário
  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId);
  }

  // Filtro de cargo
  if (cargoId) {
    query = query.eq('cargo_id', cargoId);
  }

  // Filtro de ativo
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  // Filtro de vigente (salários sem data_fim_vigencia ou com data_fim_vigencia >= hoje)
  if (vigente) {
    const hoje = new Date().toISOString().split('T')[0];
    query = query
      .lte('data_inicio_vigencia', hoje)
      .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);
  }

  // Ordenação
  let campoOrdenacao = ordenarPor;
  if (ordenarPor === 'usuario') {
    campoOrdenacao = 'usuario_id';
  }
  query = query.order(campoOrdenacao, { ascending: ordem === 'asc', nullsFirst: false });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar salários: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarSalariosResponse = {
    items: (data || []).map(mapearSalarioComDetalhes),
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
 * Buscar salário por ID com detalhes
 */
export const buscarSalarioPorId = async (id: number): Promise<SalarioComDetalhes | null> => {
  const cacheKey = getSalarioByIdKey(id);
  const cached = await getCached<SalarioComDetalhes>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarSalarioPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarSalarioPorId: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email, cargo),
      cargos(id, nome, descricao)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar salário: ${error.message}`);
  }

  const result = mapearSalarioComDetalhes(data);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar todos os salários de um usuário (histórico completo)
 */
export const buscarSalariosDoUsuario = async (usuarioId: number): Promise<SalarioComDetalhes[]> => {
  const cacheKey = `${CACHE_PREFIX}:usuario:${usuarioId}:historico`;
  const cached = await getCached<SalarioComDetalhes[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email, cargo),
      cargos(id, nome, descricao)
    `
    )
    .eq('usuario_id', usuarioId)
    .order('data_inicio_vigencia', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar salários do usuário: ${error.message}`);
  }

  const result = (data || []).map(mapearSalarioComDetalhes);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar salário vigente de um usuário em uma data específica
 */
export const buscarSalarioVigente = async (
  usuarioId: number,
  dataReferencia?: string
): Promise<SalarioComDetalhes | null> => {
  const data = dataReferencia || new Date().toISOString().split('T')[0];
  const cacheKey = `${CACHE_PREFIX}:usuario:${usuarioId}:vigente:${data}`;
  const cached = await getCached<SalarioComDetalhes>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  // Buscar salário onde:
  // - data_inicio_vigencia <= dataReferencia
  // - data_fim_vigencia IS NULL OR data_fim_vigencia >= dataReferencia
  // - ativo = true
  const { data: salarios, error } = await supabase
    .from('salarios')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email, cargo),
      cargos(id, nome, descricao)
    `
    )
    .eq('usuario_id', usuarioId)
    .eq('ativo', true)
    .lte('data_inicio_vigencia', data)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${data}`)
    .order('data_inicio_vigencia', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Erro ao buscar salário vigente: ${error.message}`);
  }

  if (!salarios || salarios.length === 0) {
    return null;
  }

  const result = mapearSalarioComDetalhes(salarios[0]);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar todos os salários vigentes em um determinado mês/ano
 * Usado para geração de folha de pagamento
 */
export const buscarSalariosVigentesNoMes = async (
  mes: number,
  ano: number
): Promise<SalarioComDetalhes[]> => {
  const cacheKey = `${CACHE_PREFIX}:vigentes:${ano}:${mes}`;
  const cached = await getCached<SalarioComDetalhes[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Primeiro dia do mês
  const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
  // Último dia do mês
  const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];

  const supabase = createServiceClient();

  // Buscar salários que estavam vigentes em qualquer ponto do mês
  // - data_inicio_vigencia <= ultimo dia do mês
  // - data_fim_vigencia IS NULL OR data_fim_vigencia >= primeiro dia do mês
  // - ativo = true
  const { data, error } = await supabase
    .from('salarios')
    .select(
      `
      *,
      usuarios(id, nome_exibicao, email, cargo),
      cargos(id, nome, descricao)
    `
    )
    .eq('ativo', true)
    .lte('data_inicio_vigencia', ultimoDia)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${primeiroDia}`)
    .order('usuario_id', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar salários vigentes no mês: ${error.message}`);
  }

  // Agrupar por usuário e pegar o salário mais recente de cada um
  const salariosPorUsuario = new Map<number, SalarioComDetalhes>();
  for (const registro of data || []) {
    const salario = mapearSalarioComDetalhes(registro);
    const existente = salariosPorUsuario.get(salario.usuarioId);
    if (!existente || salario.dataInicioVigencia > existente.dataInicioVigencia) {
      salariosPorUsuario.set(salario.usuarioId, salario);
    }
  }

  const result = Array.from(salariosPorUsuario.values());
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Verificar se existe sobreposição de vigências para um usuário
 */
export const verificarSobreposicaoVigencia = async (
  usuarioId: number,
  dataInicioVigencia: string,
  dataFimVigencia: string | null,
  excluirSalarioId?: number
): Promise<boolean> => {
  const supabase = createServiceClient();

  let query = supabase
    .from('salarios')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('ativo', true);

  // Excluir o próprio salário se for uma edição
  if (excluirSalarioId) {
    query = query.neq('id', excluirSalarioId);
  }

  // Verificar sobreposição de períodos
  // Um período [A, B] sobrepõe [C, D] se A <= D AND B >= C (onde null = infinito)
  if (dataFimVigencia) {
    // Tem data fim: verificar sobreposição normal
    query = query
      .lte('data_inicio_vigencia', dataFimVigencia)
      .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${dataInicioVigencia}`);
  } else {
    // Sem data fim (vigente até agora): verifica se existe qualquer salário que começa depois
    // ou que termina depois do início
    query = query.or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${dataInicioVigencia}`);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Erro ao verificar sobreposição de vigência: ${error.message}`);
  }

  return (count || 0) > 0;
};

// ============================================================================
// Operações de Escrita
// ============================================================================

/**
 * Criar novo salário
 */
export const criarSalario = async (
  dados: CriarSalarioDTO,
  createdBy: number
): Promise<Salario> => {
  const supabase = createServiceClient();

  // Validar se usuário existe
  const { data: usuario, error: erroUsuario } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao, ativo')
    .eq('id', dados.usuarioId)
    .single();

  if (erroUsuario || !usuario) {
    throw new Error('Usuário não encontrado');
  }

  if (!usuario.ativo) {
    throw new Error('Usuário está inativo');
  }

  // Validar se não há sobreposição de vigências
  const temSobreposicao = await verificarSobreposicaoVigencia(
    dados.usuarioId,
    dados.dataInicioVigencia,
    null // Novo salário sem data fim
  );

  if (temSobreposicao) {
    throw new Error('Já existe um salário vigente para este usuário no período informado. Encerre a vigência do salário atual antes de criar um novo.');
  }

  // Validar cargo se fornecido
  if (dados.cargoId) {
    const { data: cargo, error: erroCargo } = await supabase
      .from('cargos')
      .select('id, nome')
      .eq('id', dados.cargoId)
      .single();

    if (erroCargo || !cargo) {
      throw new Error('Cargo não encontrado');
    }
  }

  const { data, error } = await supabase
    .from('salarios')
    .insert({
      usuario_id: dados.usuarioId,
      cargo_id: dados.cargoId || null,
      salario_bruto: dados.salarioBruto,
      data_inicio_vigencia: dados.dataInicioVigencia,
      data_fim_vigencia: null,
      observacoes: dados.observacoes?.trim() || null,
      ativo: true,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um salário cadastrado para este usuário com esta data de início');
    }
    throw new Error(`Erro ao criar salário: ${error.message}`);
  }

  await invalidateSalariosCache();
  return mapearSalario(data);
};

/**
 * Atualizar salário existente
 */
export const atualizarSalario = async (
  id: number,
  dados: AtualizarSalarioDTO
): Promise<Salario> => {
  const supabase = createServiceClient();

  // Buscar salário atual
  const { data: salarioAtual, error: erroConsulta } = await supabase
    .from('salarios')
    .select('*')
    .eq('id', id)
    .single();

  if (erroConsulta || !salarioAtual) {
    throw new Error('Salário não encontrado');
  }

  // Verificar se o salário foi usado em alguma folha de pagamento aprovada/paga
  const { count: contaFolhas, error: erroFolhas } = await supabase
    .from('itens_folha_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('salario_id', id);

  if (erroFolhas) {
    throw new Error(`Erro ao verificar uso do salário: ${erroFolhas.message}`);
  }

  // Se foi usado em folha e está tentando alterar valor, não permitir
  if ((contaFolhas || 0) > 0 && dados.salarioBruto !== undefined && dados.salarioBruto !== salarioAtual.salario_bruto) {
    throw new Error('Não é possível alterar o valor de um salário que já foi usado em folha de pagamento. Encerre a vigência e crie um novo salário.');
  }

  // Se está encerrando a vigência, validar que a data fim é maior que a data início
  if (dados.dataFimVigencia !== undefined && dados.dataFimVigencia !== null) {
    if (dados.dataFimVigencia <= salarioAtual.data_inicio_vigencia) {
      throw new Error('Data de fim da vigência deve ser posterior à data de início');
    }
  }

  const updateData: Record<string, unknown> = {};

  if (dados.salarioBruto !== undefined) {
    updateData.salario_bruto = dados.salarioBruto;
  }
  if (dados.cargoId !== undefined) {
    updateData.cargo_id = dados.cargoId;
  }
  if (dados.dataFimVigencia !== undefined) {
    updateData.data_fim_vigencia = dados.dataFimVigencia;
  }
  if (dados.observacoes !== undefined) {
    updateData.observacoes = dados.observacoes?.trim() || null;
  }
  if (dados.ativo !== undefined) {
    updateData.ativo = dados.ativo;
  }

  const { data, error } = await supabase
    .from('salarios')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar salário: ${error.message}`);
  }

  await invalidateSalariosCache();
  return mapearSalario(data);
};

/**
 * Encerrar vigência de um salário (define data_fim_vigencia)
 */
export const encerrarVigenciaSalario = async (
  id: number,
  dataFim: string
): Promise<Salario> => {
  return atualizarSalario(id, { dataFimVigencia: dataFim });
};

/**
 * Inativar salário (soft delete)
 */
export const inativarSalario = async (id: number): Promise<Salario> => {
  return atualizarSalario(id, { ativo: false });
};

/**
 * Deletar salário (hard delete - apenas se não foi usado em folha)
 */
export const deletarSalario = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  // Verificar se foi usado em alguma folha
  const { count, error: erroCount } = await supabase
    .from('itens_folha_pagamento')
    .select('id', { count: 'exact', head: true })
    .eq('salario_id', id);

  if (erroCount) {
    throw new Error(`Erro ao verificar uso do salário: ${erroCount.message}`);
  }

  if ((count || 0) > 0) {
    throw new Error('Não é possível excluir um salário que já foi usado em folha de pagamento');
  }

  const { error } = await supabase
    .from('salarios')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir salário: ${error.message}`);
  }

  await invalidateSalariosCache();
};

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalidar todo o cache de salários
 */
export const invalidateSalariosCache = async (): Promise<void> => {
  await deletePattern(`${CACHE_PREFIX}:*`);
};

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Calcular totais de salários ativos
 */
export const calcularTotaisSalariosAtivos = async (): Promise<{
  totalFuncionarios: number;
  totalBrutoMensal: number;
}> => {
  const cacheKey = `${CACHE_PREFIX}:totais_ativos`;
  const cached = await getCached<{ totalFuncionarios: number; totalBrutoMensal: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const hoje = new Date().toISOString().split('T')[0];
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salarios')
    .select('usuario_id, salario_bruto')
    .eq('ativo', true)
    .lte('data_inicio_vigencia', hoje)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);

  if (error) {
    throw new Error(`Erro ao calcular totais: ${error.message}`);
  }

  // Agrupar por usuário (pegar o mais recente de cada)
  const salariosPorUsuario = new Map<number, number>();
  for (const item of data || []) {
    salariosPorUsuario.set(item.usuario_id, Number(item.salario_bruto));
  }

  const result = {
    totalFuncionarios: salariosPorUsuario.size,
    totalBrutoMensal: Array.from(salariosPorUsuario.values()).reduce((a, b) => a + b, 0),
  };

  await setCached(cacheKey, result, 300); // 5 minutos
  return result;
};

/**
 * Listar usuários sem salário vigente cadastrado
 */
export const listarUsuariosSemSalarioVigente = async (): Promise<UsuarioResumo[]> => {
  const cacheKey = `${CACHE_PREFIX}:usuarios_sem_salario`;
  const cached = await getCached<UsuarioResumo[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const hoje = new Date().toISOString().split('T')[0];
  const supabase = createServiceClient();

  // Buscar usuários ativos
  const { data: usuarios, error: erroUsuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao, email, cargo')
    .eq('ativo', true);

  if (erroUsuarios) {
    throw new Error(`Erro ao buscar usuários: ${erroUsuarios.message}`);
  }

  // Buscar IDs de usuários com salário vigente
  const { data: salarios, error: erroSalarios } = await supabase
    .from('salarios')
    .select('usuario_id')
    .eq('ativo', true)
    .lte('data_inicio_vigencia', hoje)
    .or(`data_fim_vigencia.is.null,data_fim_vigencia.gte.${hoje}`);

  if (erroSalarios) {
    throw new Error(`Erro ao buscar salários: ${erroSalarios.message}`);
  }

  const idsComSalario = new Set((salarios || []).map((s) => s.usuario_id));

  const result = (usuarios || [])
    .filter((u) => !idsComSalario.has(u.id))
    .map((u) => ({
      id: u.id,
      nomeExibicao: u.nome_exibicao,
      email: u.email,
      cargo: u.cargo,
    }));

  await setCached(cacheKey, result, 300); // 5 minutos
  return result;
};
