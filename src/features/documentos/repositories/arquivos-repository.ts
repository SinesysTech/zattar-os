import { createServiceClient } from "@/lib/supabase/service-client";
import type {
  Arquivo,
  ArquivoComUsuario,
  CriarArquivoParams,
  AtualizarArquivoParams,
  ListarArquivosParams,
  ItemDocumento,
} from "../domain";
import { listarDocumentos } from "./documentos-repository";
import { listarPastasComContadores } from "./pastas-repository";
import { buildArquivoWithCreatorSelect } from "./shared/query-builders";

// ============================================================================
// ARQUIVOS GENÉRICOS
// ============================================================================

/**
 * Cria um novo arquivo genérico no banco de dados
 */
export async function criarArquivo(
  params: CriarArquivoParams,
  usuario_id: number
): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .insert({
      nome: params.nome,
      tipo_mime: params.tipo_mime,
      tamanho_bytes: params.tamanho_bytes,
      pasta_id: params.pasta_id ?? null,
      b2_key: params.b2_key,
      b2_url: params.b2_url,
      tipo_media: params.tipo_media,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Busca um arquivo por ID
 */
export async function buscarArquivoPorId(id: number): Promise<Arquivo | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Busca um arquivo com informações do criador
 */
export async function buscarArquivoComUsuario(
  id: number
): Promise<ArquivoComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .select(buildArquivoWithCreatorSelect())
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar arquivo: ${error.message}`);
  }

  return data as unknown as ArquivoComUsuario;
}

/**
 * Lista arquivos genéricos com filtros
 */
export async function listarArquivos(
  params: ListarArquivosParams
): Promise<{ arquivos: ArquivoComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase.from("arquivos").select(
    buildArquivoWithCreatorSelect(),
    { count: "exact" }
  );

  // Filtro: deleted_at
  if (!params.incluir_deletados) {
    query = query.is("deleted_at", null);
  }

  // Filtro: pasta_id
  if (params.pasta_id !== undefined) {
    if (params.pasta_id === null) {
      query = query.is("pasta_id", null);
    } else {
      query = query.eq("pasta_id", params.pasta_id);
    }
  }

  // Filtro: busca
  if (params.busca) {
    query = query.ilike("nome", `%${params.busca}%`);
  }

  // Filtro: tipo_media
  if (params.tipo_media) {
    query = query.eq("tipo_media", params.tipo_media);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq("criado_por", params.criado_por);
  }

  // Ordenação e paginação
  query = query
    .order("created_at", { ascending: false })
    .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar arquivos: ${error.message}`);
  }

  return {
    arquivos: (data as unknown as ArquivoComUsuario[]) || [],
    total: count || 0,
  };
}

/**
 * Atualiza um arquivo existente
 */
export async function atualizarArquivo(
  id: number,
  params: AtualizarArquivoParams
): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete de um arquivo
 */
export async function deletarArquivo(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("arquivos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }
}

/**
 * Restaura um arquivo deletado
 */
export async function restaurarArquivo(id: number): Promise<Arquivo> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arquivos")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar arquivo: ${error.message}`);
  }

  return data;
}

/**
 * Lista itens unificados (pastas, documentos e arquivos) para o FileManager
 */
export async function listarItensUnificados(
  params: ListarArquivosParams
): Promise<{ itens: ItemDocumento[]; total: number }> {
  // Buscar documentos Plate.js
  const { documentos, total: totalDocs } = await listarDocumentos({
    pasta_id: params.pasta_id,
    busca: params.busca,
    criado_por: params.criado_por,
    limit: params.limit,
    offset: params.offset,
  });

  // Buscar arquivos genéricos
  const { arquivos, total: totalArquivos } = await listarArquivos(params);

  // Buscar pastas se estiver na raiz ou pasta específica
  const pastas = await listarPastasComContadores(
    params.pasta_id,
    params.criado_por
  );

  // Unificar resultados
  const itens: ItemDocumento[] = [
    ...pastas.map((p) => ({ tipo: "pasta" as const, dados: p })),
    ...documentos.map((d) => ({ tipo: "documento" as const, dados: d })),
    ...arquivos.map((a) => ({ tipo: "arquivo" as const, dados: a })),
  ];

  return { itens, total: totalDocs + totalArquivos + pastas.length };
}
