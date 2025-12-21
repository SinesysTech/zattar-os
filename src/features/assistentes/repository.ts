import { createServiceClient } from "@/lib/supabase/service-client";
import {
  Assistente,
  AssistentesParams,
  CriarAssistenteInput,
  AtualizarAssistenteInput,
} from "./domain";

// Mappers
function converterParaAssistente(data: Record<string, unknown>): Assistente {
  return {
    id: data.id as number,
    nome: data.nome as string,
    descricao: (data.descricao as string | null) ?? null,
    iframe_code: data.iframe_code as string,
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

  let query = supabase.from("assistentes").select("*");

  // Sempre filtrar por assistentes ativos (não deletados)
  const ativo = params.ativo ?? true;
  query = query.eq("ativo", ativo);

  // Filtro de busca
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(`nome.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  // Ordenação
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar assistentes: ${error.message}`);
  }

  return (data || []).map(converterParaAssistente);
}

export async function findById(id: number): Promise<Assistente | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assistentes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar assistente: ${error.message}`);
  }

  return data ? converterParaAssistente(data) : null;
}

export async function create(
  data: CriarAssistenteInput & { criado_por: number }
): Promise<Assistente> {
  const supabase = createServiceClient();

  const { data: inserted, error } = await supabase
    .from("assistentes")
    .insert({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      iframe_code: data.iframe_code.trim(),
      criado_por: data.criado_por,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar assistente: ${error.message}`);
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
    updateData.iframe_code = data.iframe_code.trim();
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  const { data: updated, error } = await supabase
    .from("assistentes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar assistente: ${error.message}`);
  }

  return converterParaAssistente(updated);
}

export async function deleteAssistente(id: number): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("assistentes").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar assistente: ${error.message}`);
  }

  return true;
}
