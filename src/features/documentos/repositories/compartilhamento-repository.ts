import { createServiceClient } from "@/lib/supabase/service-client";
import type {
  DocumentoCompartilhado,
  CompartilharDocumentoParams,
  DocumentoCompartilhadoComUsuario,
  ListarCompartilhamentosParams,
} from "../domain";
import { buildCompartilhamentoWithUsersSelect } from "./shared/query-builders";

// ============================================================================
// COMPARTILHAMENTO
// ============================================================================

/**
 * Compartilha um documento com um usuário
 */
export async function compartilharDocumento(
  params: CompartilharDocumentoParams,
  compartilhado_por: number
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .insert({
      documento_id: params.documento_id,
      usuario_id: params.usuario_id,
      permissao: params.permissao,
      pode_deletar: params.pode_deletar ?? false,
      compartilhado_por,
    })
    .select()
    .single();

  if (error) {
    // Se já existe, atualizar permissão
    if (error.code === "23505") {
      return await atualizarPermissaoCompartilhamento(
        params.documento_id,
        params.usuario_id,
        params.permissao,
        params.pode_deletar
      );
    }
    throw new Error(`Erro ao compartilhar documento: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza a permissão de um compartilhamento existente
 */
export async function atualizarPermissaoCompartilhamento(
  documento_id: number,
  usuario_id: number,
  permissao: "visualizar" | "editar",
  pode_deletar?: boolean
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const updateData: {
    permissao: "visualizar" | "editar";
    pode_deletar?: boolean;
  } = {
    permissao,
  };

  if (pode_deletar !== undefined) {
    updateData.pode_deletar = pode_deletar;
  }

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .update(updateData)
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erro ao atualizar permissão de compartilhamento: ${error.message}`
    );
  }

  return data;
}

/**
 * Remove compartilhamento de um documento
 */
export async function removerCompartilhamento(
  documento_id: number,
  usuario_id: number
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id);

  if (error) {
    throw new Error(`Erro ao remover compartilhamento: ${error.message}`);
  }
}

/**
 * Lista compartilhamentos de um documento ou usuário
 */
export async function listarCompartilhamentos(
  params: ListarCompartilhamentosParams
): Promise<DocumentoCompartilhadoComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_compartilhados").select(buildCompartilhamentoWithUsersSelect());

  if (params.documento_id) {
    query = query.eq("documento_id", params.documento_id);
  }

  if (params.usuario_id) {
    query = query.eq("usuario_id", params.usuario_id);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar compartilhamentos: ${error.message}`);
  }

  return (data as unknown as DocumentoCompartilhadoComUsuario[]) ?? [];
}

/**
 * Busca compartilhamento específico
 */
export async function buscarCompartilhamento(
  documento_id: number,
  usuario_id: number
): Promise<DocumentoCompartilhado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select()
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar compartilhamento: ${error.message}`);
  }

  return data;
}

/**
 * Compartilha documento com múltiplos usuários
 */
export async function compartilharDocumentoComMultiplosUsuarios(
  documento_id: number,
  usuarios_ids: number[],
  permissao: "visualizar" | "editar",
  compartilhado_por: number
): Promise<DocumentoCompartilhado[]> {
  const supabase = createServiceClient();

  const compartilhamentos = usuarios_ids.map((usuario_id) => ({
    documento_id,
    usuario_id,
    permissao,
    compartilhado_por,
  }));

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .upsert(compartilhamentos, {
      onConflict: "documento_id,usuario_id",
    })
    .select();

  if (error) {
    throw new Error(
      `Erro ao compartilhar com múltiplos usuários: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Remove todos os compartilhamentos de um documento
 */
export async function removerTodosCompartilhamentos(
  documento_id: number
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(
      `Erro ao remover todos os compartilhamentos: ${error.message}`
    );
  }
}

/**
 * Verifica se um usuário tem permissão específica em um documento
 */
export async function verificarPermissaoCompartilhamento(
  documento_id: number,
  usuario_id: number,
  permissao_requerida: "visualizar" | "editar"
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("documentos_compartilhados")
    .select("permissao")
    .eq("documento_id", documento_id)
    .eq("usuario_id", usuario_id)
    .single();

  if (!data) {
    return false;
  }

  // 'editar' inclui 'visualizar'
  if (permissao_requerida === "visualizar") {
    return true;
  }

  return data.permissao === "editar";
}

/**
 * Lista usuários com quem um documento foi compartilhado
 */
export async function listarUsuariosComAcesso(
  documento_id: number
): Promise<Array<{ usuario_id: number; permissao: "visualizar" | "editar" }>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select("usuario_id, permissao")
    .eq("documento_id", documento_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar usuários com acesso: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Busca compartilhamento por ID
 */
export async function buscarCompartilhamentoPorId(
  id: number
): Promise<DocumentoCompartilhado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar compartilhamento: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza permissão de compartilhamento por ID
 */
export async function atualizarPermissaoCompartilhamentoPorId(
  id: number,
  permissao?: "visualizar" | "editar",
  pode_deletar?: boolean
): Promise<DocumentoCompartilhado> {
  const supabase = createServiceClient();

  const updateData: Partial<{
    permissao: "visualizar" | "editar";
    pode_deletar: boolean;
  }> = {};

  if (permissao) {
    updateData.permissao = permissao;
  }

  if (pode_deletar !== undefined) {
    updateData.pode_deletar = pode_deletar;
  }

  const { data, error } = await supabase
    .from("documentos_compartilhados")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar permissão: ${error.message}`);
  }

  return data;
}

/**
 * Remove compartilhamento por ID
 */
export async function removerCompartilhamentoPorId(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("documentos_compartilhados")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao remover compartilhamento: ${error.message}`);
  }
}
