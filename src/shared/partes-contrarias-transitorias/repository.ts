import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ParteContrariaTransitoria,
  CreateTransitoriaInput,
  SugestaoMerge,
} from "./domain";

const TABLE = "partes_contrarias_transitorias";

/**
 * Insere uma nova parte contrária transitória. Usa o client que o caller
 * fornecer — Service Client (RLS bypass) no fluxo público, client autenticado
 * no painel interno.
 */
export async function insertTransitoria(
  supabase: SupabaseClient,
  input: CreateTransitoriaInput
): Promise<ParteContrariaTransitoria> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nome: input.nome.trim(),
      tipo_pessoa: input.tipo_pessoa ?? null,
      cpf_ou_cnpj: input.cpf_ou_cnpj ?? null,
      email: input.email && input.email.length > 0 ? input.email : null,
      telefone: input.telefone ?? null,
      observacoes: input.observacoes ?? null,
      criado_via: input.criado_via,
      criado_em_contrato_id: input.criado_em_contrato_id ?? null,
      criado_por: input.criado_por ?? null,
      sessao_formulario_uuid: input.sessao_formulario_uuid ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Erro ao criar parte contrária transitória: ${error.message}`);
  }
  return data as ParteContrariaTransitoria;
}

export async function getTransitoriaById(
  supabase: SupabaseClient,
  id: number
): Promise<ParteContrariaTransitoria | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Erro ao buscar transitória ${id}: ${error.message}`);
  }
  return data as ParteContrariaTransitoria | null;
}

export async function listTransitoriasByContrato(
  supabase: SupabaseClient,
  contratoId: number
): Promise<ParteContrariaTransitoria[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("criado_em_contrato_id", contratoId)
    .eq("status", "pendente")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(
      `Erro ao listar transitórias do contrato ${contratoId}: ${error.message}`
    );
  }
  return (data ?? []) as ParteContrariaTransitoria[];
}

export async function listPendentes(
  supabase: SupabaseClient,
  params: { limit?: number; offset?: number; search?: string } = {}
): Promise<{ rows: ParteContrariaTransitoria[]; total: number }> {
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .eq("status", "pendente");

  if (params.search && params.search.trim().length > 0) {
    query = query.ilike("nome", `%${params.search.trim()}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Erro ao listar transitórias pendentes: ${error.message}`);
  }
  return {
    rows: (data ?? []) as ParteContrariaTransitoria[],
    total: count ?? 0,
  };
}

export async function countPendentes(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  if (error) {
    throw new Error(`Erro ao contar transitórias pendentes: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Busca partes_contrarias e outras transitórias com nome similar ao informado.
 * Usado na tela de promoção para sugerir merge em vez de duplicação.
 * Uses ILIKE substring match (pg_trgm GIN index já está em partes_contrarias_transitorias.nome).
 */
export async function findSimilarPartes(
  supabase: SupabaseClient,
  nome: string,
  options: { excludeTransitoriaId?: number; limit?: number } = {}
): Promise<SugestaoMerge[]> {
  const limit = options.limit ?? 5;
  const termo = nome.trim();
  if (termo.length < 2) return [];

  const pattern = `%${termo}%`;

  const [partesRes, transitoriasRes] = await Promise.all([
    supabase
      .from("partes_contrarias")
      .select("id, nome, cpf, cnpj")
      .ilike("nome", pattern)
      .limit(limit),
    supabase
      .from("partes_contrarias_transitorias")
      .select("id, nome, cpf_ou_cnpj")
      .eq("status", "pendente")
      .ilike("nome", pattern)
      .limit(limit),
  ]);

  if (partesRes.error) {
    throw new Error(
      `Erro ao buscar partes_contrarias similares: ${partesRes.error.message}`
    );
  }
  if (transitoriasRes.error) {
    throw new Error(
      `Erro ao buscar transitórias similares: ${transitoriasRes.error.message}`
    );
  }

  const sugestoes: SugestaoMerge[] = [];

  for (const p of partesRes.data ?? []) {
    sugestoes.push({
      kind: "parte_contraria",
      id: p.id as number,
      nome: p.nome as string,
      cpf: (p.cpf as string) ?? null,
      cnpj: (p.cnpj as string) ?? null,
      score: computeScore(termo, p.nome as string),
    });
  }

  for (const t of transitoriasRes.data ?? []) {
    if (options.excludeTransitoriaId && t.id === options.excludeTransitoriaId) {
      continue;
    }
    const doc = (t.cpf_ou_cnpj as string) ?? null;
    sugestoes.push({
      kind: "transitoria",
      id: t.id as number,
      nome: t.nome as string,
      cpf: doc && doc.length === 11 ? doc : null,
      cnpj: doc && doc.length === 14 ? doc : null,
      score: computeScore(termo, t.nome as string),
    });
  }

  return sugestoes.sort((a, b) => b.score - a.score).slice(0, limit);
}

function computeScore(a: string, b: string): number {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na === nb) return 1;
  if (nb.includes(na) || na.includes(nb)) return 0.85;
  // similaridade simples baseada em chars comuns
  const shorter = na.length <= nb.length ? na : nb;
  let matches = 0;
  for (const ch of shorter) {
    if (nb.includes(ch)) matches++;
  }
  return matches / Math.max(na.length, nb.length);
}

export async function updateStatusPromovido(
  supabase: SupabaseClient,
  input: {
    transitoriaId: number;
    parteContrariaId: number;
    promovidoPor: number;
  }
): Promise<ParteContrariaTransitoria> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "promovido",
      promovido_para_id: input.parteContrariaId,
      promovido_por: input.promovidoPor,
      promovido_em: new Date().toISOString(),
    })
    .eq("id", input.transitoriaId)
    .eq("status", "pendente") // idempotência: só atualiza se ainda pendente
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Erro ao marcar transitória ${input.transitoriaId} como promovida: ${error.message}`
    );
  }
  return data as ParteContrariaTransitoria;
}
