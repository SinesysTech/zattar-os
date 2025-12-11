/**
 * ENDERECOS REPOSITORY - Camada de Persistencia
 *
 * Implementa operacoes de banco de dados para Enderecos usando Supabase.
 */

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError } from '@/lib/types';
import type {
  Endereco,
  EntidadeTipoEndereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
} from './types';
import type { Database } from '@/lib/supabase/database.types';

// ============================================================================
// CONVERSORES
// ============================================================================

function converterParaEndereco(data: Record<string, unknown>): Endereco {
  // Conversão segura com defaults
  return {
    id: data.id as number,
    id_pje: (data.id_pje as number) ?? null,
    entidade_tipo: data.entidade_tipo as EntidadeTipoEndereco,
    entidade_id: data.entidade_id as number,
    trt: (data.trt as string) ?? null,
    grau: (data.grau as any) ?? null, // Cast para any pois GrauProcesso pode variar
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
    classificacoes_endereco: (data.classificacoes_endereco as any[]) ?? null,
    correspondencia: (data.correspondencia as boolean) ?? null,
    situacao: (data.situacao as any) ?? null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown>) ?? null,
    id_usuario_cadastrador_pje: (data.id_usuario_cadastrador_pje as number) ?? null,
    data_alteracao_pje: (data.data_alteracao_pje as string) ?? null,
    ativo: (data.ativo as boolean) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// ============================================================================
// REPOSITORY METHODS
// ============================================================================

export async function criarEndereco(
  params: CriarEnderecoParams
): Promise<Result<Endereco>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('enderecos')
      .insert(params as any) // Cast safely to DB insert type
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(appError('CONFLICT', 'Endereço duplicado', { internal: error }));
      }
      return err(appError('DATABASE_ERROR', error.message, { internal: error }));
    }

    return ok(converterParaEndereco(data as Record<string, unknown>));
  } catch (error) {
    return err(appError('INTERNAL_ERROR', 'Erro ao criar endereço', undefined, error as Error));
  }
}

export async function atualizarEndereco(
  params: AtualizarEnderecoParams
): Promise<Result<Endereco>> {
  try {
    const db = createDbClient();
    const { id, ...updates } = params;

    const { data, error } = await db
      .from('enderecos')
      .update({
         ...updates,
         updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
       if (error.code === 'PGRST116') {
         return err(appError('NOT_FOUND', `Endereço ${id} não encontrado`));
       }
       return err(appError('DATABASE_ERROR', error.message, { internal: error }));
    }

    return ok(converterParaEndereco(data as Record<string, unknown>));
  } catch (error) {
    return err(appError('INTERNAL_ERROR', 'Erro ao atualizar endereço', undefined, error as Error));
  }
}

export async function buscarEnderecoPorId(id: number): Promise<Result<Endereco>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('enderecos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
       if (error.code === 'PGRST116') {
         return err(appError('NOT_FOUND', `Endereço ${id} não encontrado`));
       }
       return err(appError('DATABASE_ERROR', error.message, { internal: error }));
    }

    return ok(converterParaEndereco(data as Record<string, unknown>));
  } catch (error) {
     return err(appError('INTERNAL_ERROR', 'Erro ao buscar endereço', undefined, error as Error));
  }
}

export async function buscarEnderecosPorEntidade(
  params: BuscarEnderecosPorEntidadeParams
): Promise<Result<Endereco[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('enderecos')
      .select('*')
      .eq('entidade_tipo', params.entidade_tipo)
      .eq('entidade_id', params.entidade_id)
      .eq('ativo', true)
      .order('correspondencia', { ascending: false })
      .order('situacao', { ascending: true });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { internal: error }));
    }

    return ok((data || []).map(d => converterParaEndereco(d as Record<string, unknown>)));
  } catch (error) {
    return err(appError('INTERNAL_ERROR', 'Erro ao buscar endereços', undefined, error as Error));
  }
}

export async function listarEnderecos(
  params: ListarEnderecosParams
): Promise<Result<ListarEnderecosResult>> {
  try {
    const db = createDbClient();
    const { pagina = 1, limite = 50, ordenar_por = 'created_at', ordem = 'desc', busca } = params;
    const offset = (pagina - 1) * limite;

    let query = db.from('enderecos').select('*', { count: 'exact' });

    if (params.entidade_tipo) query = query.eq('entidade_tipo', params.entidade_tipo);
    if (params.entidade_id) query = query.eq('entidade_id', params.entidade_id);
    if (params.ativo !== undefined) query = query.eq('ativo', params.ativo);
    
    // Filtro de busca genérica
    if (busca) {
      query = query.or(`logradouro.ilike.%${busca}%,municipio.ilike.%${busca}%,cep.ilike.%${busca}%`);
    }

    query = query
      .order(ordenar_por, { ascending: ordem === 'asc' })
      .range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
       return err(appError('DATABASE_ERROR', error.message, { internal: error }));
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return ok({
      enderecos: (data || []).map(d => converterParaEndereco(d as Record<string, unknown>)),
      total,
      pagina: pagina,
      limite: limite,
      totalPaginas,
    });
  } catch (error) {
     return err(appError('INTERNAL_ERROR', 'Erro ao listar endereços', undefined, error as Error));
  }
}

export async function deletarEndereco(id: number): Promise<Result<void>> {
   try {
     const db = createDbClient();
     // Soft delete
     const { error } = await db
       .from('enderecos')
       .update({ ativo: false })
       .eq('id', id);

     if (error) {
        return err(appError('DATABASE_ERROR', error.message, { internal: error }));
     }

     return ok(undefined);
   } catch (error) {
     return err(appError('INTERNAL_ERROR', 'Erro ao deletar endereço', undefined, error as Error));
   }
}
