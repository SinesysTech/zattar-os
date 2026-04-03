import { createServiceClient } from "@/lib/supabase/service-client";
import {
  Assistente,
  AssistentesParams,
  CriarAssistenteInput,
  CriarAssistenteDifyInput,
  AtualizarAssistenteInput,
} from "./domain";

// Mappers
function converterParaAssistente(data: Record<string, unknown>): Assistente {
  return {
    id: data.id as number,
    nome: data.nome as string,
    descricao: (data.descricao as string | null) ?? null,
    tipo: (data.tipo as "iframe" | "dify") ?? "iframe",
    iframe_code: (data.iframe_code as string | null) ?? null,
    dify_app_id: (data.dify_app_id as string | null) ?? null,
    ativo: data.ativo as boolean,
    criado_por: data.criado_por as number,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export async function findAll(
  params: AssistentesParams
): Promise<Assistente[]> {
  const supabase = createServiceClient();

  const query = supabase.from("assistentes").select("*");

  // Sempre filtrar por assistentes ativos (não deletados)
  const ativo = params.ativo ?? true;


  // Filtro de busca
  if (params.busca) {
    const busca = params.busca.trim();
    query.or(`nome.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  // Ordenação
  query.order("created_at", { ascending: false });

  const { data, error } = await query.eq("ativo", ativo);

  if (error) {
    throw new Error(`Erro ao listar assistentes: ${error.message}`);
  }

  return (data || []).map(converterParaAssistente);
}

export async function findById(id: number): Promise<Assistente | null> {
  const supabase = createServiceClient();

  const query = supabase.from("assistentes").select("*");
  query.eq("id", id);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar assistente: ${error.message}`);
  }

  return data ? converterParaAssistente(data) : null;
}

export async function findByDifyAppId(difyAppId: string): Promise<Assistente | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assistentes")
    .select("*")
    .eq("dify_app_id", difyAppId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar assistente por dify_app_id: ${error.message}`);
  }

  return data ? converterParaAssistente(data) : null;
}

export async function create(
  data: CriarAssistenteInput & { criado_por: number }
): Promise<Assistente> {
  const supabase = createServiceClient();

  const query = supabase.from("assistentes").insert({
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() || null,
    tipo: "iframe" as const,
    iframe_code: data.iframe_code.trim(),
    criado_por: data.criado_por,
    ativo: true,
  });
  query.select();

  const { data: inserted, error } = await query.single();

  if (error) {
    throw new Error(`Erro ao criar assistente: ${error.message}`);
  }

  return converterParaAssistente(inserted);
}

export async function createDify(
  data: CriarAssistenteDifyInput & { criado_por: number }
): Promise<Assistente> {
  const supabase = createServiceClient();

  const { data: inserted, error } = await supabase
    .from("assistentes")
    .insert({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      tipo: "dify" as const,
      dify_app_id: data.dify_app_id,
      criado_por: data.criado_por,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar assistente Dify: ${error.message}`);
  }

  return converterParaAssistente(inserted);
}

export async function update(
  id: number,
  data: AtualizarAssistenteInput
): Promise<Assistente> {
  const supabase = createServiceClient();

  const updateData: Record<string, string | boolean | null> = {};

  if (data.nome !== undefined) updateData.nome = data.nome.trim();
  if (data.descricao !== undefined)
    updateData.descricao = data.descricao?.trim() || null;
  if (data.iframe_code !== undefined)
    updateData.iframe_code = data.iframe_code?.trim() || null;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  const query = supabase.from("assistentes").update(updateData);
  query.eq("id", id);
  query.select();

  const { data: updated, error } = await query.single();

  if (error) {
    throw new Error(`Erro ao atualizar assistente: ${error.message}`);
  }

  return converterParaAssistente(updated);
}

export async function deleteAssistente(id: number): Promise<boolean> {
  const supabase = createServiceClient();

  const query = supabase.from("assistentes").delete();
  const { error } = await query.eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar assistente: ${error.message}`);
  }

  return true;
}

export async function deleteByDifyAppId(difyAppId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("assistentes")
    .delete()
    .eq("dify_app_id", difyAppId);

  if (error) {
    throw new Error(`Erro ao deletar assistente por dify_app_id: ${error.message}`);
  }

  return true;
}
