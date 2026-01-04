import { createServiceClient } from "@/lib/supabase/service-client";
import type {
  DocumentoUpload,
  UploadArquivoParams,
  DocumentoUploadComInfo,
  ListarUploadsParams,
} from "../domain";
import { buildUploadWithInfoSelect } from "./shared/query-builders";

// ============================================================================
// UPLOADS
// ============================================================================

/**
 * Registra um novo upload no banco de dados
 */
export async function registrarUpload(
  params: UploadArquivoParams,
  usuario_id: number
): Promise<DocumentoUpload> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .insert({
      documento_id: params.documento_id,
      nome_arquivo: params.nome_arquivo,
      tipo_mime: params.tipo_mime,
      tamanho_bytes: params.tamanho_bytes,
      b2_key: params.b2_key,
      b2_url: params.b2_url,
      tipo_media: params.tipo_media,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao registrar upload: ${error.message}`);
  }

  return data;
}

/**
 * Busca um upload por ID
 */
export async function buscarUploadPorId(
  id: number
): Promise<DocumentoUpload | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar upload: ${error.message}`);
  }

  return data;
}

/**
 * Busca um upload por B2 key
 */
export async function buscarUploadPorB2Key(
  b2_key: string
): Promise<DocumentoUpload | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("b2_key", b2_key)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar upload por B2 key: ${error.message}`);
  }

  return data;
}

/**
 * Lista uploads com filtros
 */
export async function listarUploads(
  params: ListarUploadsParams
): Promise<{ uploads: DocumentoUploadComInfo[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_uploads").select(
    buildUploadWithInfoSelect(),
    { count: "exact" }
  );

  // Filtro: documento_id
  if (params.documento_id) {
    query = query.eq("documento_id", params.documento_id);
  }

  // Filtro: tipo_media
  if (params.tipo_media) {
    query = query.eq("tipo_media", params.tipo_media);
  }

  // Ordenação
  query = query.order("created_at", { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar uploads: ${error.message}`);
  }

  return {
    uploads: (data as unknown as DocumentoUploadComInfo[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Lista todos os uploads de um documento
 */
export async function listarUploadsPorDocumento(
  documento_id: number
): Promise<DocumentoUpload[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("documento_id", documento_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar uploads do documento: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Deleta um upload do banco e retorna informações para deletar do B2
 */
export async function deletarUpload(
  id: number
): Promise<{ b2_key: string; b2_url: string }> {
  const supabase = createServiceClient();

  // Buscar informações antes de deletar
  const upload = await buscarUploadPorId(id);
  if (!upload) {
    throw new Error("Upload não encontrado");
  }

  // Deletar do banco
  const { error } = await supabase
    .from("documentos_uploads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar upload: ${error.message}`);
  }

  return {
    b2_key: upload.b2_key,
    b2_url: upload.b2_url,
  };
}

/**
 * Calcula tamanho total de uploads de um documento
 */
export async function calcularTamanhoTotalUploads(
  documento_id: number
): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select("tamanho_bytes")
    .eq("documento_id", documento_id);

  if (error) {
    throw new Error(`Erro ao calcular tamanho total: ${error.message}`);
  }

  const total = (data ?? []).reduce(
    (sum, upload) => sum + upload.tamanho_bytes,
    0
  );
  return total;
}

/**
 * Lista uploads por tipo de mídia
 */
export async function listarUploadsPorTipoMedia(
  documento_id: number,
  tipo_media: "imagem" | "video" | "audio" | "pdf" | "outros"
): Promise<DocumentoUpload[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select()
    .eq("documento_id", documento_id)
    .eq("tipo_media", tipo_media)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar uploads por tipo: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Verifica se um arquivo já foi enviado (por B2 key)
 */
export async function verificarUploadExistente(
  b2_key: string
): Promise<boolean> {
  const upload = await buscarUploadPorB2Key(b2_key);
  return upload !== null;
}

/**
 * Atualiza URL do B2 (útil se a URL mudar)
 */
export async function atualizarUrlB2(
  id: number,
  nova_url: string
): Promise<DocumentoUpload> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .update({ b2_url: nova_url })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar URL do B2: ${error.message}`);
  }

  return data;
}

/**
 * Lista uploads recentes (últimos N uploads)
 */
export async function listarUploadsRecentes(
  limite = 10,
  usuario_id?: number
): Promise<DocumentoUploadComInfo[]> {
  const supabase = createServiceClient();

  let query = supabase.from("documentos_uploads").select(buildUploadWithInfoSelect());

  if (usuario_id) {
    query = query.eq("criado_por", usuario_id);
  }

  query = query.order("created_at", { ascending: false }).limit(limite);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar uploads recentes: ${error.message}`);
  }

  return (data as unknown as DocumentoUploadComInfo[]) ?? [];
}

/**
 * Calcula estatísticas de uploads de um usuário
 */
export async function calcularEstatisticasUploads(usuario_id: number): Promise<{
  total_arquivos: number;
  tamanho_total_bytes: number;
  por_tipo: Record<string, { count: number; tamanho_bytes: number }>;
}> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documentos_uploads")
    .select("tipo_media, tamanho_bytes")
    .eq("criado_por", usuario_id);

  if (error) {
    throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
  }

  const uploads = data ?? [];

  const estatisticas = {
    total_arquivos: uploads.length,
    tamanho_total_bytes: uploads.reduce((sum, u) => sum + u.tamanho_bytes, 0),
    por_tipo: {} as Record<string, { count: number; tamanho_bytes: number }>,
  };

  uploads.forEach((upload) => {
    if (!estatisticas.por_tipo[upload.tipo_media]) {
      estatisticas.por_tipo[upload.tipo_media] = { count: 0, tamanho_bytes: 0 };
    }
    estatisticas.por_tipo[upload.tipo_media].count++;
    estatisticas.por_tipo[upload.tipo_media].tamanho_bytes +=
      upload.tamanho_bytes;
  });

  return estatisticas;
}
