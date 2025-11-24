/**
 * Serviço de Persistência para Processo-Partes (Relacionamento N:N)
 * Implementa todas as operações CRUD com validação e type safety
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import type {
  ProcessoParte,
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  BuscarProcessosPorEntidadeParams,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
  EntidadeTipoProcessoParte,
  TipoParteProcesso,
  PoloProcessoParte,
  GrauProcessoParte,
} from '@/backend/types/partes/processo-partes-types';

// ============================================================================
// Type Converter
// ============================================================================

/**
 * Converte row do banco para tipo ProcessoParte
 */
export function converterParaProcessoParte(data: Record<string, unknown>): ProcessoParte {
  return {
    id: data.id as number,
    processo_id: data.processo_id as number,
    tipo_entidade: data.tipo_entidade as EntidadeTipoProcessoParte,
    entidade_id: data.entidade_id as number,
    id_pje: data.id_pje as number,
    id_pessoa_pje: data.id_pessoa_pje as number | null,
    id_tipo_parte: data.id_tipo_parte as number | null,
    tipo_parte: data.tipo_parte as TipoParteProcesso,
    polo: data.polo as PoloProcessoParte,
    principal: data.principal as boolean | null,
    ordem: data.ordem as number | null,
    status_pje: data.status_pje as string | null,
    situacao_pje: data.situacao_pje as string | null,
    autoridade: data.autoridade as boolean | null,
    endereco_desconhecido: data.endereco_desconhecido as boolean | null,
    dados_pje_completo: data.dados_pje_completo as Record<string, unknown> | null,
    trt: data.trt as string,
    grau: data.grau as GrauProcessoParte,
    numero_processo: data.numero_processo as string,
    ultima_atualizacao_pje: data.ultima_atualizacao_pje as string | null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Vínculo já existe entre esta parte e processo';
  }
  if (error.code === '23503') {
    return 'Processo ou entidade não encontrada';
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
 * Criar novo vínculo processo-parte
 */
export async function criarProcessoParte(
  params: CriarProcessoParteParams
): Promise<{ sucesso: boolean; processoParte?: ProcessoParte; erro?: string }> {
  try {
    // Validate required fields
    if (!params.processo_id || !params.tipo_entidade || !params.entidade_id ||
        !params.id_pje || !params.tipo_parte || !params.polo ||
        !params.trt || !params.grau || !params.numero_processo) {
      return {
        sucesso: false,
        erro: 'Campos obrigatórios não informados',
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('processo_partes')
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
      processoParte: converterParaProcessoParte(data),
    };
  } catch (error) {
    console.error('Erro ao criar vínculo processo-parte:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar vínculo processo-parte',
    };
  }
}

/**
 * Atualizar vínculo processo-parte existente
 */
export async function atualizarProcessoParte(
  params: AtualizarProcessoParteParams
): Promise<{ sucesso: boolean; processoParte?: ProcessoParte; erro?: string }> {
  try {
    if (!params.id) {
      return { sucesso: false, erro: 'ID é obrigatório' };
    }

    // Check for immutable fields
    if ('tipo_entidade' in params || 'entidade_id' in params || 'processo_id' in params) {
      return {
        sucesso: false,
        erro: 'Campos tipo_entidade, entidade_id e processo_id não podem ser alterados',
      };
    }

    const supabase = await createClient();

    const { id, ...updates } = params;

    const { data, error } = await supabase
      .from('processo_partes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Vínculo não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      processoParte: converterParaProcessoParte(data),
    };
  } catch (error) {
    console.error('Erro ao atualizar vínculo processo-parte:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar vínculo processo-parte',
    };
  }
}

/**
 * Buscar vínculo por ID
 */
export async function buscarProcessoPartePorId(id: number): Promise<ProcessoParte | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('processo_partes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return converterParaProcessoParte(data);
  } catch (error) {
    console.error('Erro ao buscar vínculo processo-parte:', error);
    return null;
  }
}

/**
 * Buscar partes de um processo
 */
export async function buscarPartesPorProcesso(
  params: BuscarPartesPorProcessoParams
): Promise<ProcessoParte[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('processo_partes')
      .select('*')
      .eq('processo_id', params.processo_id);

    if (params.polo) {
      query = query.eq('polo', params.polo);
    }

    query = query
      .order('polo', { ascending: true })
      .order('principal', { ascending: false })
      .order('ordem', { ascending: true });

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(converterParaProcessoParte);
  } catch (error) {
    console.error('Erro ao buscar partes por processo:', error);
    return [];
  }
}

/**
 * Buscar processos de uma entidade
 */
export async function buscarProcessosPorEntidade(
  params: BuscarProcessosPorEntidadeParams
): Promise<ProcessoParte[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('processo_partes')
      .select('*')
      .eq('tipo_entidade', params.tipo_entidade)
      .eq('entidade_id', params.entidade_id)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(converterParaProcessoParte);
  } catch (error) {
    console.error('Erro ao buscar processos por entidade:', error);
    return [];
  }
}

/**
 * Listar vínculos com paginação e filtros
 */
export async function listarProcessoPartes(
  params: ListarProcessoPartesParams
): Promise<ListarProcessoPartesResult> {
  try {
    const supabase = await createClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    // Build query with filters
    let query = supabase.from('processo_partes').select('*', { count: 'exact' });

    if (params.tipo_entidade) {
      query = query.eq('tipo_entidade', params.tipo_entidade);
    }
    if (params.entidade_id) {
      query = query.eq('entidade_id', params.entidade_id);
    }
    if (params.processo_id) {
      query = query.eq('processo_id', params.processo_id);
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
    if (params.polo) {
      query = query.eq('polo', params.polo);
    }
    if (params.tipo_parte) {
      query = query.eq('tipo_parte', params.tipo_parte);
    }
    if (params.principal !== undefined) {
      query = query.eq('principal', params.principal);
    }

    // Apply ordering
    const ordenarPor = params.ordenar_por || 'created_at';
    const ordem = params.ordem === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(ordenarPor, ordem);

    // Apply pagination
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar vínculos processo-partes:', error);
      return {
        processoPartes: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      processoPartes: (data || []).map(converterParaProcessoParte),
      total,
      pagina,
      limite,
      totalPaginas,
    };
  } catch (error) {
    console.error('Erro ao listar vínculos processo-partes:', error);
    return {
      processoPartes: [],
      total: 0,
      pagina: params.pagina || 1,
      limite: params.limite || 50,
      totalPaginas: 0,
    };
  }
}

/**
 * Vincular entidade a processo (alias para criar)
 */
export async function vincularParteProcesso(
  params: VincularParteProcessoParams
): Promise<{ sucesso: boolean; processoParte?: ProcessoParte; erro?: string }> {
  return await criarProcessoParte(params);
}

/**
 * Desvincular entidade de processo
 */
export async function desvincularParteProcesso(
  params: DesvincularParteProcessoParams
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('processo_partes')
      .delete()
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Vínculo não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao desvincular parte de processo:', error);
    return {
      sucesso: false,
      erro: 'Erro ao desvincular parte de processo',
    };
  }
}

/**
 * Deletar vínculo processo-parte (alias para desvincular)
 */
export async function deletarProcessoParte(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  return await desvincularParteProcesso({ id });
}
