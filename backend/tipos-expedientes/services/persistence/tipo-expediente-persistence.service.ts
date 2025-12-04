// Serviço de persistência de tipos de expedientes
// Gerencia operações de CRUD na tabela tipos_expedientes

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  TipoExpediente,
  CriarTipoExpedienteParams,
  AtualizarTipoExpedienteParams,
  ListarTiposExpedientesParams,
  ListarTiposExpedientesResult,
} from '@/backend/types/tipos-expedientes/types';
import { getCached, setCached, getTiposExpedientesListKey, invalidateCacheOnUpdate, CACHE_PREFIXES } from '@/backend/utils/redis';

/**
 * Criar um novo tipo de expediente
 */
export async function criarTipoExpediente(params: CriarTipoExpedienteParams): Promise<TipoExpediente> {
  const supabase = createServiceClient();

  // Validar nome único
  const { data: existente } = await supabase
    .from('tipos_expedientes')
    .select('id')
    .eq('tipo_expediente', params.tipo_expediente.trim())
    .single();

  if (existente) {
    throw new Error('Tipo de expediente já cadastrado');
  }

  const { data, error } = await supabase
    .from('tipos_expedientes')
    .insert({
      tipo_expediente: params.tipo_expediente.trim(),
      created_by: params.created_by,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar tipo de expediente: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar tipo de expediente: nenhum dado retornado');
  }

  // Invalidar cache após criação
  await invalidateCacheOnUpdate('tiposExpedientes', data.id.toString());

  return data as TipoExpediente;
}

/**
 * Buscar tipo de expediente por ID
 */
export async function buscarTipoExpediente(id: number): Promise<TipoExpediente | null> {
  const cacheKey = `${CACHE_PREFIXES.tiposExpedientes}:id:${id}`;

  const cached = await getCached<TipoExpediente>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for tipo expediente id ${id}`);
    return cached;
  }

  console.debug(`Cache miss for tipo expediente id ${id}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tipos_expedientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar tipo de expediente: ${error.message}`);
  }

  const result = data as TipoExpediente;

  // Cache o resultado se encontrado
  if (result) {
    await setCached(cacheKey, result, 3600);
  }

  return result;
}

/**
 * Buscar tipo de expediente por nome
 */
export async function buscarTipoExpedientePorNome(nome: string): Promise<TipoExpediente | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tipos_expedientes')
    .select('*')
    .eq('tipo_expediente', nome.trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar tipo de expediente: ${error.message}`);
  }

  return data as TipoExpediente;
}

/**
 * Atualizar tipo de expediente
 */
export async function atualizarTipoExpediente(
  id: number,
  params: AtualizarTipoExpedienteParams
): Promise<TipoExpediente> {
  const supabase = createServiceClient();

  // Se nome está sendo atualizado, verificar unicidade
  if (params.tipo_expediente) {
    const { data: existente } = await supabase
      .from('tipos_expedientes')
      .select('id')
      .eq('tipo_expediente', params.tipo_expediente.trim())
      .neq('id', id)
      .single();

    if (existente) {
      throw new Error('Tipo de expediente já cadastrado');
    }
  }

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Partial<TipoExpediente> = {};
  if (params.tipo_expediente !== undefined) {
    updateData.tipo_expediente = params.tipo_expediente.trim();
  }

  const { data, error } = await supabase
    .from('tipos_expedientes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Tipo de expediente não encontrado');
    }
    throw new Error(`Erro ao atualizar tipo de expediente: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar tipo de expediente: nenhum dado retornado');
  }

  // Invalidar cache após atualização
  await invalidateCacheOnUpdate('tiposExpedientes', id.toString());

  return data as TipoExpediente;
}

/**
 * Verificar se tipo de expediente está em uso
 */
export async function tipoExpedienteEmUso(id: number): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('expedientes')
    .select('id')
    .eq('tipo_expediente_id', id)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false; // Não está em uso
    }
    throw new Error(`Erro ao verificar uso do tipo de expediente: ${error.message}`);
  }

  return !!data;
}

/**
 * Deletar tipo de expediente
 */
export async function deletarTipoExpediente(id: number): Promise<void> {
  const supabase = createServiceClient();

  // Verificar se está em uso
  const emUso = await tipoExpedienteEmUso(id);
  if (emUso) {
    throw new Error('Tipo de expediente não pode ser deletado pois está em uso');
  }

  const { error } = await supabase
    .from('tipos_expedientes')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Tipo de expediente não encontrado');
    }
    throw new Error(`Erro ao deletar tipo de expediente: ${error.message}`);
  }

  // Invalidar cache após deleção
  await invalidateCacheOnUpdate('tiposExpedientes', id.toString());
}

/**
 * Listar tipos de expedientes com filtros e paginação
 */
export async function listarTiposExpedientes(
  params: ListarTiposExpedientesParams = {}
): Promise<ListarTiposExpedientesResult> {
  const cacheKey = getTiposExpedientesListKey(params);

  const cached = await getCached<ListarTiposExpedientesResult>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for tipos expedientes list: ${cacheKey}`);
    return cached;
  }

  console.debug(`Cache miss for tipos expedientes list: ${cacheKey}`);

  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  let query = supabase.from('tipos_expedientes').select('*', { count: 'exact' });

  // Filtro de busca textual
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.ilike('tipo_expediente', `%${busca}%`);
  }

  // Filtro por criador
  if (params.created_by !== undefined) {
    query = query.eq('created_by', params.created_by);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'tipo_expediente';
  const ordem = params.ordem ?? 'asc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar tipos de expedientes: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarTiposExpedientesResult = {
    tipos_expedientes: (data || []) as TipoExpediente[],
    total,
    pagina,
    limite,
    totalPaginas,
  };

  // Cache o resultado
  await setCached(cacheKey, result, 3600);

  return result;
}