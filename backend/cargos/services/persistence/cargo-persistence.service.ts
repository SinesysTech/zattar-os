/**
 * Serviço de persistência para Cargos
 * Gerencia operações de CRUD na tabela cargos
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCached, setCached, deletePattern, CACHE_PREFIXES, getCargosListKey } from '@/lib/redis';
import type {
  Cargo,
  CriarCargoDTO,
  AtualizarCargoDTO,
  ListarCargosParams,
  ListarCargosResponse,
} from '@/backend/types/cargos/types';

/**
 * Converte registro do banco para interface Cargo
 */
const mapearCargo = (registro: any): Cargo => {
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

/**
 * Listar cargos com filtros e paginação
 */
export const listarCargos = async (
  params: ListarCargosParams
): Promise<ListarCargosResponse> => {
  const cacheKey = getCargosListKey(params);
  const cached = await getCached<ListarCargosResponse>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for listarCargos: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for listarCargos: ${cacheKey}`);

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
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

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
    console.debug(`Cache hit for buscarCargoPorId: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarCargoPorId: ${cacheKey}`);

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
      return null; // Não encontrado
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
    // Erro de unicidade
    if (error.code === '23505') {
      throw new Error('Cargo com este nome já existe');
    }
    throw new Error(`Erro ao criar cargo: ${error.message}`);
  }

  const result = mapearCargo(registro);
  await deletePattern(`${CACHE_PREFIXES.cargos}:*`); // Invalidate all cargos cache
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

  const updateData: any = {};

  if (data.nome !== undefined) {
    updateData.nome = data.nome.trim();
  }
  if (data.descricao !== undefined) {
    updateData.descricao = data.descricao.trim() || null;
  }
  if (data.ativo !== undefined) {
    updateData.ativo = data.ativo;
  }

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
  await deletePattern(`${CACHE_PREFIXES.cargos}:*`); // Invalidate all cargos cache
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

  await deletePattern(`${CACHE_PREFIXES.cargos}:*`); // Invalidate all cargos cache
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
