/**
 * Serviço de persistência para documentos
 *
 * Responsável por todas as operações de banco de dados relacionadas a documentos.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Documento,
  CriarDocumentoParams,
  AtualizarDocumentoParams,
  ListarDocumentosParams,
  DocumentoComUsuario,
} from '@/backend/types/documentos/types';

/**
 * Cria um novo documento no banco de dados
 */
export async function criarDocumento(
  params: CriarDocumentoParams,
  usuario_id: number
): Promise<Documento> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      titulo: params.titulo,
      conteudo: params.conteudo ?? [],
      pasta_id: params.pasta_id ?? null,
      criado_por: usuario_id,
      editado_por: usuario_id,
      descricao: params.descricao ?? null,
      tags: params.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar documento: ${error.message}`);
  }

  return data;
}

/**
 * Busca um documento por ID
 */
export async function buscarDocumentoPorId(id: number): Promise<Documento | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .select()
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar documento: ${error.message}`);
  }

  return data;
}

/**
 * Busca um documento por ID com informações do usuário
 */
export async function buscarDocumentoComUsuario(id: number): Promise<DocumentoComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .select(`
      *,
      criador:usuarios!documentos_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao,
        emailCorporativo
      ),
      editor:usuarios!documentos_editado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar documento com usuário: ${error.message}`);
  }

  return data as unknown as DocumentoComUsuario;
}

/**
 * Lista documentos com filtros
 */
export async function listarDocumentos(
  params: ListarDocumentosParams
): Promise<{ documentos: DocumentoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('documentos')
    .select(`
      *,
      criador:usuarios!documentos_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao,
        emailCorporativo
      ),
      editor:usuarios!documentos_editado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `, { count: 'exact' });

  // Filtro: pasta_id
  if (params.pasta_id !== undefined) {
    if (params.pasta_id === null) {
      query = query.is('pasta_id', null);
    } else {
      query = query.eq('pasta_id', params.pasta_id);
    }
  }

  // Filtro: busca (título ou descrição)
  if (params.busca) {
    query = query.or(`titulo.ilike.%${params.busca}%,descricao.ilike.%${params.busca}%`);
  }

  // Filtro: tags
  if (params.tags && params.tags.length > 0) {
    query = query.contains('tags', params.tags);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq('criado_por', params.criado_por);
  }

  // Filtro: incluir deletados
  if (!params.incluir_deletados) {
    query = query.is('deleted_at', null);
  }

  // Ordenação
  query = query.order('updated_at', { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar documentos: ${error.message}`);
  }

  return {
    documentos: (data as unknown as DocumentoComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Atualiza um documento existente
 */
export async function atualizarDocumento(
  id: number,
  params: AtualizarDocumentoParams,
  usuario_id: number
): Promise<Documento> {
  const supabase = createServiceClient();

  const updateData: any = {
    editado_por: usuario_id,
    editado_em: new Date().toISOString(),
  };

  if (params.titulo !== undefined) updateData.titulo = params.titulo;
  if (params.conteudo !== undefined) updateData.conteudo = params.conteudo;
  if (params.pasta_id !== undefined) updateData.pasta_id = params.pasta_id;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.tags !== undefined) updateData.tags = params.tags;

  const { data, error } = await supabase
    .from('documentos')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar documento: ${error.message}`);
  }

  return data;
}

/**
 * Incrementa a versão de um documento
 */
export async function incrementarVersaoDocumento(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc('increment_documento_versao', {
    documento_id: id,
  });

  if (error) {
    // Se a função RPC não existir, fazer update manual
    const { error: updateError } = await supabase
      .from('documentos')
      .update({ versao: supabase.sql`versao + 1` })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erro ao incrementar versão: ${updateError.message}`);
    }
  }
}

/**
 * Soft delete de um documento
 */
export async function deletarDocumento(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('documentos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Erro ao deletar documento: ${error.message}`);
  }
}

/**
 * Restaura um documento deletado
 */
export async function restaurarDocumento(id: number): Promise<Documento> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar documento: ${error.message}`);
  }

  return data;
}

/**
 * Hard delete de um documento (permanente)
 */
export async function deletarDocumentoPermanentemente(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar documento permanentemente: ${error.message}`);
  }
}

/**
 * Busca documentos na lixeira (soft deleted)
 */
export async function listarDocumentosLixeira(
  usuario_id?: number
): Promise<DocumentoComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('documentos')
    .select(`
      *,
      criador:usuarios!documentos_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao,
        emailCorporativo
      ),
      editor:usuarios!documentos_editado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .not('deleted_at', 'is', null);

  if (usuario_id) {
    query = query.eq('criado_por', usuario_id);
  }

  query = query.order('deleted_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar documentos na lixeira: ${error.message}`);
  }

  return (data as unknown as DocumentoComUsuario[]) ?? [];
}

/**
 * Busca documentos compartilhados com um usuário
 */
export async function listarDocumentosCompartilhadosComUsuario(
  usuario_id: number
): Promise<DocumentoComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('documentos')
    .select(`
      *,
      criador:usuarios!documentos_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao,
        emailCorporativo
      ),
      editor:usuarios!documentos_editado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .in(
      'id',
      supabase
        .from('documentos_compartilhados')
        .select('documento_id')
        .eq('usuario_id', usuario_id)
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar documentos compartilhados: ${error.message}`);
  }

  return (data as unknown as DocumentoComUsuario[]) ?? [];
}

/**
 * Verifica se um usuário tem acesso a um documento
 */
export async function verificarAcessoDocumento(
  documento_id: number,
  usuario_id: number
): Promise<{ temAcesso: boolean; permissao: 'proprietario' | 'editar' | 'visualizar' | null }> {
  const supabase = createServiceClient();

  // Verificar se é o proprietário
  const { data: documento } = await supabase
    .from('documentos')
    .select('criado_por')
    .eq('id', documento_id)
    .single();

  if (documento?.criado_por === usuario_id) {
    return { temAcesso: true, permissao: 'proprietario' };
  }

  // Verificar compartilhamento
  const { data: compartilhamento } = await supabase
    .from('documentos_compartilhados')
    .select('permissao')
    .eq('documento_id', documento_id)
    .eq('usuario_id', usuario_id)
    .single();

  if (compartilhamento) {
    return { temAcesso: true, permissao: compartilhamento.permissao };
  }

  return { temAcesso: false, permissao: null };
}
