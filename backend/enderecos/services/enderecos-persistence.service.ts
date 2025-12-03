/**
 * Serviço de Persistência para Endereços
 * Implementa todas as operações CRUD com validação e type safety
 *
 * Responsabilidades:
 * - Criar/atualizar/deletar endereços
 * - Buscar endereços por entidade (cliente, parte_contraria, terceiro)
 * - Upsert por id_pje (deduplicação)
 * - Definir endereço principal
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Endereco,
  EntidadeTipoEndereco,
  SituacaoEndereco,
} from '@/types/domain/enderecos';
import type { GrauProcesso } from '@/types/domain/common';
import type {
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
} from '@/types/contracts/enderecos';

/**
 * Resultado de operação de endereço
 */
export interface OperacaoEnderecoResult {
  sucesso: boolean;
  endereco?: Endereco;
  erro?: string;
}

/**
 * Parâmetros para upsert por id_pje + entidade
 */
export interface UpsertEnderecoPorIdPjeParams extends CriarEnderecoParams {
  id_pje: number;
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
    grau: (data.grau as GrauProcesso) ?? null,
    numero_processo: (data.numero_processo as string) ?? null,
    logradouro: (data.logradouro as string) ?? null,
    numero: (data.numero as string) ?? null,
    complemento: (data.complemento as string) ?? null,
    bairro: (data.bairro as string) ?? null,
    id_municipio_pje: (data.id_municipio_pje as number) ?? null,
    municipio: (data.municipio as string) ?? null,
    municipio_ibge: (data.municipio_ibge as string) ?? null,
    estado_id_pje: (data.estado_id_pje as number) ?? null,
    estado_sigla: (data.estado_sigla as string) ?? null,
    estado_descricao: (data.estado_descricao as string) ?? null,
    estado: (data.estado as string) ?? null,
    pais_id_pje: (data.pais_id_pje as number) ?? null,
    pais_codigo: (data.pais_codigo as string) ?? null,
    pais_descricao: (data.pais_descricao as string) ?? null,
    pais: (data.pais as string) ?? null,
    cep: (data.cep as string) ?? null,
    classificacoes_endereco: (data.classificacoes_endereco as unknown[]) ?? null,
    correspondencia: (data.correspondencia as boolean) ?? null,
    situacao: (data.situacao as SituacaoEndereco | null) ?? null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown>) ?? null,
    id_usuario_cadastrador_pje: (data.id_usuario_cadastrador_pje as number) ?? null,
    data_alteracao_pje: (data.data_alteracao_pje as string) ?? null,
    ativo: (data.ativo as boolean) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Endereço já existe para esta entidade e ID PJE';
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
// Validation Helper
// ============================================================================

/**
 * Valida se o endereço tem pelo menos um campo mínimo preenchido
 */
function validarEnderecoMinimo(params: CriarEnderecoParams): { valido: boolean; avisos: string[] } {
  const avisos: string[] = [];
  const hasLogradouro = !!params.logradouro;
  const hasMunicipio = !!params.municipio;
  const hasCep = !!params.cep;

  if (!hasLogradouro) avisos.push('Endereço sem logradouro');
  if (!hasMunicipio) avisos.push('Endereço sem município');
  if (!hasCep) avisos.push('Endereço sem CEP');

  const valido = hasLogradouro || hasMunicipio || hasCep;
  return { valido, avisos };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Criar novo endereço
 */
export async function criarEndereco(
  params: CriarEnderecoParams
): Promise<OperacaoEnderecoResult> {
  try {
    // Validação básica
    if (!params.entidade_tipo || !params.entidade_id) {
      return {
        sucesso: false,
        erro: 'entidade_tipo e entidade_id são obrigatórios',
      };
    }

    // Validação de campos mínimos
    const { avisos } = validarEnderecoMinimo(params);
    if (avisos.length > 0) {
      console.warn('[ENDERECOS] Endereço incompleto:', avisos);
    }

    const supabase = createServiceClient();

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
): Promise<OperacaoEnderecoResult> {
  try {
    if (!params.id) {
      return { sucesso: false, erro: 'ID é obrigatório' };
    }

    const supabase = createServiceClient();
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
    const supabase = createServiceClient();

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
 * Buscar endereços por entidade
 */
export async function buscarEnderecosPorEntidade(
  params: BuscarEnderecosPorEntidadeParams
): Promise<Endereco[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('enderecos')
      .select('*')
      .eq('entidade_tipo', params.entidade_tipo)
      .eq('entidade_id', params.entidade_id)
      .eq('ativo', true)
      .order('correspondencia', { ascending: false }) // Endereço de correspondência primeiro
      .order('situacao', { ascending: true }); // P=Principal, depois outros

    if (error || !data) return [];

    return data.map(converterParaEndereco);
  } catch (error) {
    console.error('Erro ao buscar endereços por entidade:', error);
    return [];
  }
}

/**
 * Buscar endereço principal de uma entidade
 */
export async function buscarEnderecoPrincipal(
  entidade_tipo: EntidadeTipoEndereco,
  entidade_id: number
): Promise<Endereco | null> {
  try {
    const supabase = createServiceClient();

    // Busca endereço com correspondencia=true OU situacao=P (Principal)
    const { data, error } = await supabase
      .from('enderecos')
      .select('*')
      .eq('entidade_tipo', entidade_tipo)
      .eq('entidade_id', entidade_id)
      .eq('ativo', true)
      .or('correspondencia.eq.true,situacao.eq.P')
      .order('correspondencia', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return converterParaEndereco(data);
  } catch (error) {
    console.error('Erro ao buscar endereço principal:', error);
    return null;
  }
}

/**
 * Listar endereços com paginação e filtros
 */
export async function listarEnderecos(
  params: ListarEnderecosParams
): Promise<ListarEnderecosResult> {
  try {
    const supabase = createServiceClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    let query = supabase.from('enderecos').select('*', { count: 'exact' });

    // Filtros
    if (params.entidade_tipo) {
      query = query.eq('entidade_tipo', params.entidade_tipo);
    }
    if (params.entidade_id) {
      query = query.eq('entidade_id', params.entidade_id);
    }
    if (params.trt) {
      query = query.eq('trt', params.trt);
    }
    if (params.grau) {
      query = query.eq('grau', params.grau);
    }
    if (params.numero_processo) {
      query = query.eq('numero_processo', params.numero_processo);
    }
    if (params.municipio) {
      query = query.ilike('municipio', `%${params.municipio}%`);
    }
    if (params.estado_sigla) {
      query = query.eq('estado_sigla', params.estado_sigla);
    }
    if (params.estado) {
      query = query.ilike('estado', `%${params.estado}%`);
    }
    if (params.pais_codigo) {
      query = query.eq('pais_codigo', params.pais_codigo);
    }
    if (params.pais) {
      query = query.ilike('pais', `%${params.pais}%`);
    }
    if (params.cep) {
      query = query.eq('cep', params.cep);
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
      query = query.or(
        `logradouro.ilike.%${params.busca}%,bairro.ilike.%${params.busca}%,municipio.ilike.%${params.busca}%,estado_sigla.ilike.%${params.busca}%`
      );
    }

    // Ordenação
    const ordenarPor = params.ordenar_por || 'created_at';
    const ordem = params.ordem === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(ordenarPor, ordem);

    // Paginação
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
 * Upsert endereço por id_pje + entidade (idempotente)
 */
export async function upsertEnderecoPorIdPje(
  params: UpsertEnderecoPorIdPjeParams
): Promise<OperacaoEnderecoResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('enderecos')
      .upsert(params, {
        onConflict: 'id_pje,entidade_tipo,entidade_id',
        ignoreDuplicates: false // Always update on conflict
      })
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
    console.error('Erro ao fazer upsert de endereço:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upsert de endereço',
    };
  }
}

/**
 * Deletar endereço (soft delete - marca como inativo)
 */
export async function deletarEndereco(id: number): Promise<OperacaoEnderecoResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('enderecos')
      .update({ ativo: false })
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
    console.error('Erro ao deletar endereço:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar endereço',
    };
  }
}

/**
 * Deletar endereço permanentemente (hard delete)
 */
export async function deletarEnderecoPermanentemente(
  id: number
): Promise<OperacaoEnderecoResult> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from('enderecos').delete().eq('id', id);

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
    console.error('Erro ao deletar endereço permanentemente:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar endereço permanentemente',
    };
  }
}