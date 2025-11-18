// Serviço de persistência de advogados
// Gerencia operações de CRUD na tabela advogados

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Advogado,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarAdvogadosParams,
  ListarAdvogadosResult,
} from '@/backend/types/advogados/types';

/**
 * Criar um novo advogado
 */
export async function criarAdvogado(params: CriarAdvogadoParams): Promise<Advogado> {
  const supabase = createServiceClient();

  // Validar CPF único
  const { data: existente } = await supabase
    .from('advogados')
    .select('id')
    .eq('cpf', params.cpf.trim())
    .single();

  if (existente) {
    throw new Error('CPF já cadastrado para outro advogado');
  }

  const { data, error } = await supabase
    .from('advogados')
    .insert({
      nome_completo: params.nome_completo.trim(),
      cpf: params.cpf.trim(),
      oab: params.oab.trim(),
      uf_oab: params.uf_oab.trim().toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar advogado: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar advogado: nenhum dado retornado');
  }

  return data as Advogado;
}

/**
 * Buscar advogado por ID
 */
export async function buscarAdvogado(id: number): Promise<Advogado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('advogados')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar advogado: ${error.message}`);
  }

  return data as Advogado;
}

/**
 * Atualizar advogado
 */
export async function atualizarAdvogado(
  id: number,
  params: AtualizarAdvogadoParams
): Promise<Advogado> {
  const supabase = createServiceClient();

  // Se CPF está sendo atualizado, verificar unicidade
  if (params.cpf) {
    const { data: existente } = await supabase
      .from('advogados')
      .select('id')
      .eq('cpf', params.cpf.trim())
      .neq('id', id)
      .single();

    if (existente) {
      throw new Error('CPF já cadastrado para outro advogado');
    }
  }

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Partial<Advogado> = {};
  if (params.nome_completo !== undefined) {
    updateData.nome_completo = params.nome_completo.trim();
  }
  if (params.cpf !== undefined) {
    updateData.cpf = params.cpf.trim();
  }
  if (params.oab !== undefined) {
    updateData.oab = params.oab.trim();
  }
  if (params.uf_oab !== undefined) {
    updateData.uf_oab = params.uf_oab.trim().toUpperCase();
  }

  const { data, error } = await supabase
    .from('advogados')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Advogado não encontrado');
    }
    throw new Error(`Erro ao atualizar advogado: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar advogado: nenhum dado retornado');
  }

  return data as Advogado;
}

/**
 * Listar advogados com filtros e paginação
 */
export async function listarAdvogados(
  params: ListarAdvogadosParams = {}
): Promise<ListarAdvogadosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  let query = supabase.from('advogados').select('*', { count: 'exact' });

  // Filtro de busca (nome, CPF, OAB)
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%,oab.ilike.%${busca}%`
    );
  }

  // Filtro por OAB
  if (params.oab) {
    query = query.eq('oab', params.oab.trim());
  }

  // Filtro por UF OAB
  if (params.uf_oab) {
    query = query.eq('uf_oab', params.uf_oab.trim().toUpperCase());
  }

  // Filtro por advogados com credenciais ativas
  if (params.com_credenciais === true) {
    // Buscar IDs de advogados com credenciais ativas primeiro
    const { data: credenciaisAtivas } = await supabase
      .from('credenciais')
      .select('advogado_id')
      .eq('active', true);

    if (credenciaisAtivas && credenciaisAtivas.length > 0) {
      const idsUnicos = Array.from(
        new Set(credenciaisAtivas.map((c: { advogado_id: number }) => c.advogado_id))
      );
      query = query.in('id', idsUnicos);
    } else {
      // Se não há credenciais ativas, retornar lista vazia
      return {
        advogados: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }
  }

  // Ordenação
  query = query.order('nome_completo', { ascending: true });

  // Paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar advogados: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    advogados: (data || []) as Advogado[],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

