/**
 * Repository Layer for Cargos Feature
 * Data access and persistence operations
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCached, setCached, deletePattern, CACHE_PREFIXES } from '@/lib/redis'; // Maintain backend import for now if not migrated
import type {
  Cargo,
  CriarCargoDTO,
  AtualizarCargoDTO,
  ListarCargosParams,
  ListarCargosResponse,
} from './types';

// Helper to map DB record to Domain entity
const mapearCargo = (registro: Record<string, unknown>): Cargo => {
  return {
    id: registro.id,
    nome: registro.nome,
    descricao: registro.descricao || undefined,
    ativo: registro.ativo,
    created_by: registro.created_by || undefined,
    created_at: registro.created_at,
    updated_at: registro.updated_at,
  };
};

const getCargosListKey = (params: ListarCargosParams) => {
    return `${CACHE_PREFIXES.cargos}:list:${JSON.stringify(params)}`;
};

/**
 * Listar cargos com filtros e paginação
 */
export const listarCargos = async (
  params: ListarCargosParams
): Promise<ListarCargosResponse> => {
  const cacheKey = getCargosListKey(params);
  const cached = await getCached<ListarCargosResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const {
    pagina = 1,
    limite = 50,
    busca,
    ativo,
    ordenarPor = 'nome',
    ordem = 'asc',
  } = params;

  const supabase = createServiceClient();

  let query = supabase.from('cargos').select('*', { count: 'exact' });

  // Filtro de busca
  if (busca) {
    query = query.ilike('nome', `%${busca}%`);
  }

  // Filtro de ativo
  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  // Ordenação
  // Check if map needed, assuming DB columns match except maybe camelCase in params
  // Params defines 'createdAt' but repo assumes DB column 'created_at'.
  let sortColumn = ordenarPor;
  if (ordenarPor === 'createdAt') sortColumn = 'created_at';
  if (ordenarPor === 'updatedAt') sortColumn = 'updated_at';
  
  query = query.order(sortColumn, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar cargos: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  const result: ListarCargosResponse = {
    items: (data || []).map(mapearCargo),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
  };

  await setCached(cacheKey, result, 3600); // 1 hour TTL
  return result;
};

/**
 * Buscar cargo por ID
 */
export const buscarCargoPorId = async (id: number): Promise<Cargo | null> => {
  const cacheKey = `${CACHE_PREFIXES.cargos}:id:${id}`;
  const cached = await getCached<Cargo>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar cargo: ${error.message}`);
  }

  const result = mapearCargo(data);
  await setCached(cacheKey, result, 3600); // 1 hour TTL
  return result;
};

/**
 * Buscar cargo por nome (case-insensitive)
 */
export const buscarCargoPorNome = async (nome: string): Promise<Cargo | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .ilike('nome', nome)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar cargo por nome: ${error.message}`);
  }

  return mapearCargo(data);
};

/**
 * Criar novo cargo
 */
export const criarCargo = async (
  data: CriarCargoDTO,
  usuarioId: number
): Promise<Cargo> => {
  const supabase = createServiceClient();

  const { data: registro, error } = await supabase
    .from('cargos')
    .insert({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      created_by: usuarioId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cargo com este nome já existe');
    }
    throw new Error(`Erro ao criar cargo: ${error.message}`);
  }

  const result = mapearCargo(registro);
  await deletePattern(`${CACHE_PREFIXES.cargos}:*`);
  return result;
};

/**
 * Atualizar cargo
 */
export const atualizarCargo = async (
  id: number,
  data: AtualizarCargoDTO
): Promise<Cargo> => {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (data.nome !== undefined) {
    updateData.nome = data.nome.trim();
  }
  if (data.descricao !== undefined) {
    updateData.descricao = data.descricao.trim() || null;
  }
  if (data.ativo !== undefined) {
    updateData.ativo = data.ativo;
  }
  
  // Set updated_at explicitly or let Trigger handle it? Supabase usually handle triggers.
  // But explicit update is safer if trigger missing.

  const { data: registro, error } = await supabase
    .from('cargos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cargo com este nome já existe');
    }
    throw new Error(`Erro ao atualizar cargo: ${error.message}`);
  }

  const result = mapearCargo(registro);
  await deletePattern(`${CACHE_PREFIXES.cargos}:*`);
  return result;
};

/**
 * Deletar cargo
 */
export const deletarCargo = async (id: number): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase.from('cargos').delete().eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar cargo: ${error.message}`);
  }

  await deletePattern(`${CACHE_PREFIXES.cargos}:*`);
};

/**
 * Contar usuários associados a um cargo
 */
export const contarUsuariosComCargo = async (cargoId: number): Promise<number> => {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('cargo_id', cargoId);

  if (error) {
    throw new Error(`Erro ao contar usuários com cargo: ${error.message}`);
  }

  return count || 0;
};

/**
 * Listar usuários associados a um cargo
 */
export const listarUsuariosComCargo = async (cargoId: number) => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome_completo, email_corporativo')
    .eq('cargo_id', cargoId)
    .order('nome_completo', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar usuários com cargo: ${error.message}`);
  }

  return data || [];
};
