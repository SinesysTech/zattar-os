/**
 * Serviço de Persistência para Endereços
 * Implementa todas as operações CRUD com validação e type safety
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import type {
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
  EntidadeTipoEndereco,
  SituacaoEndereco,
} from '@/backend/types/partes/enderecos-types';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Valida formato de CEP brasileiro
 */
export function validarCEP(cep: string): boolean {
  // Remove non-numeric characters
  const cleaned = cep.replace(/\D/g, '');

  // Check length (8 digits)
  return cleaned.length === 8;
}

/**
 * Valida código UF brasileiro
 */
export function validarUF(uf: string): boolean {
  const validUFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  return validUFs.includes(uf.toUpperCase());
}

// ============================================================================
// Type Converter
// ============================================================================

/**
 * Converte row do banco para tipo Endereco
 */
export function converterParaEndereco(data: Record<string, unknown>): Endereco {
  return {
    id: data.id as number,
    id_pje: (data.id_pje as number) ?? null,
    entidade_tipo: data.entidade_tipo as EntidadeTipoEndereco,
    entidade_id: data.entidade_id as number,
    trt: (data.trt as string) ?? null,
    grau: (data.grau as 'primeiro_grau' | 'segundo_grau') ?? null,
    numero_processo: (data.numero_processo as string) ?? null,
    logradouro: data.logradouro as string | null,
    numero: data.numero as string | null,
    complemento: data.complemento as string | null,
    bairro: data.bairro as string | null,
    id_municipio_pje: data.id_municipio_pje as number | null,
    municipio: data.municipio as string | null,
    municipio_ibge: data.municipio_ibge as string | null,
    estado_id_pje: data.estado_id_pje as number | null,
    estado_sigla: data.estado_sigla as string | null,
    estado_descricao: data.estado_descricao as string | null,
    estado: (data.estado as string) ?? null,
    pais_id_pje: data.pais_id_pje as number | null,
    pais_codigo: data.pais_codigo as string | null,
    pais_descricao: data.pais_descricao as string | null,
    pais: (data.pais as string) ?? null,
    cep: data.cep as string | null,
    classificacoes_endereco: (data.classificacoes_endereco as any[]) ?? null,
    correspondencia: data.correspondencia as boolean | null,
    situacao: data.situacao as SituacaoEndereco | null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown>) ?? null,
    id_usuario_cadastrador_pje: data.id_usuario_cadastrador_pje as number | null,
    data_alteracao_pje: data.data_alteracao_pje as string | null,
    ativo: data.ativo as boolean | null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Endereço já cadastrado para esta entidade';
  }
  if (error.code === '23503') {
    return 'Entidade não encontrada';
  }
  if (error.code === '23502') {
    return 'Campo obrigatório não informado';
  }
  if (error.code === '23514') {
    return 'Valor inválido para campo';
  }
  return error.message || 'Erro ao processar operação';
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Criar novo endereço
 */
export async function criarEndereco(
  params: CriarEnderecoParams
): Promise<{ sucesso: boolean; endereco?: Endereco; erro?: string }> {
  try {
    // Validate required fields
    if (!params.entidade_tipo || !params.entidade_id) {
      return {
        sucesso: false,
        erro: 'Tipo e ID da entidade são obrigatórios',
      };
    }

    // Validate CEP if provided
    if (params.cep && !validarCEP(params.cep)) {
      return { sucesso: false, erro: 'CEP inválido' };
    }

    // Validate UF if provided
    if (params.estado_sigla && !validarUF(params.estado_sigla)) {
      return { sucesso: false, erro: 'UF inválida' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enderecos')
      .insert(params)
      .select()
      .single();

    if (error) {
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      endereco: converterParaEndereco(data),
    };
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar endereço',
    };
  }
}

/**
 * Atualizar endereço existente
 */
export async function atualizarEndereco(
  params: AtualizarEnderecoParams
): Promise<{ sucesso: boolean; endereco?: Endereco; erro?: string }> {
  try {
    if (!params.id) {
      return { sucesso: false, erro: 'ID é obrigatório' };
    }

    // Check for immutable fields
    if ('entidade_tipo' in params || 'entidade_id' in params) {
      return {
        sucesso: false,
        erro: 'Campos entidade_tipo e entidade_id não podem ser alterados',
      };
    }

    // Validate CEP if provided
    if (params.cep && !validarCEP(params.cep)) {
      return { sucesso: false, erro: 'CEP inválido' };
    }

    // Validate UF if provided
    if (params.estado_sigla && !validarUF(params.estado_sigla)) {
      return { sucesso: false, erro: 'UF inválida' };
    }

    const supabase = await createClient();

    const { id, ...updates } = params;

    const { data, error } = await supabase
      .from('enderecos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Endereço não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      endereco: converterParaEndereco(data),
    };
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar endereço',
    };
  }
}

/**
 * Buscar endereço por ID
 */
export async function buscarEnderecoPorId(id: number): Promise<Endereco | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enderecos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return converterParaEndereco(data);
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return null;
  }
}

/**
 * Buscar endereços de uma entidade específica
 */
export async function buscarEnderecosPorEntidade(
  params: BuscarEnderecosPorEntidadeParams
): Promise<Endereco[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enderecos')
      .select('*')
      .eq('entidade_tipo', params.entidade_tipo)
      .eq('entidade_id', params.entidade_id)
      .order('correspondencia', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(converterParaEndereco);
  } catch (error) {
    console.error('Erro ao buscar endereços por entidade:', error);
    return [];
  }
}

/**
 * Listar endereços com paginação e filtros
 */
export async function listarEnderecos(
  params: ListarEnderecosParams
): Promise<ListarEnderecosResult> {
  try {
    const supabase = await createClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    // Build query with filters
    let query = supabase.from('enderecos').select('*', { count: 'exact' });

    if (params.entidade_tipo) {
      query = query.eq('entidade_tipo', params.entidade_tipo);
    }
    if (params.entidade_id) {
      query = query.eq('entidade_id', params.entidade_id);
    }
    if (params.municipio) {
      query = query.ilike('municipio', `%${params.municipio}%`);
    }
    if (params.estado_sigla) {
      query = query.eq('estado_sigla', params.estado_sigla);
    }
    if (params.pais_codigo) {
      query = query.eq('pais_codigo', params.pais_codigo);
    }
    if (params.cep) {
      query = query.eq('cep', params.cep.replace(/\D/g, ''));
    }
    if (params.correspondencia !== undefined) {
      query = query.eq('correspondencia', params.correspondencia);
    }
    if (params.situacao) {
      query = query.eq('situacao', params.situacao);
    }
    if (params.ativo !== undefined) {
      query = query.eq('ativo', params.ativo);
    }
    if (params.busca) {
      query = query.or(`logradouro.ilike.%${params.busca}%,bairro.ilike.%${params.busca}%,municipio.ilike.%${params.busca}%,estado_sigla.ilike.%${params.busca}%`);
    }

    // Apply ordering
    const ordenarPor = params.ordenar_por || 'created_at';
    const ordem = params.ordem === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(ordenarPor, ordem);

    // Apply pagination
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar endereços:', error);
      return {
        enderecos: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      enderecos: (data || []).map(converterParaEndereco),
      total,
      pagina,
      limite,
      totalPaginas,
    };
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    return {
      enderecos: [],
      total: 0,
      pagina: params.pagina || 1,
      limite: params.limite || 50,
      totalPaginas: 0,
    };
  }
}

/**
 * Definir endereço como principal (correspondência)
 */
export async function definirEnderecoPrincipal(
  params: DefinirEnderecoPrincipalParams
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const supabase = await createClient();

    // First, unset all correspondencia for this entity
    await supabase
      .from('enderecos')
      .update({ correspondencia: false })
      .eq('entidade_tipo', params.entidade_tipo)
      .eq('entidade_id', params.entidade_id);

    // Then set the specified one as correspondencia
    const { error } = await supabase
      .from('enderecos')
      .update({ correspondencia: true })
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Endereço não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao definir endereço principal:', error);
    return {
      sucesso: false,
      erro: 'Erro ao definir endereço principal',
    };
  }
}

/**
 * Deletar endereço
 */
export async function deletarEndereco(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('enderecos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Endereço não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar endereço',
    };
  }
}
