import { createServiceClient } from "@/lib/supabase/service-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTransitoriaSchema,
  type CreateTransitoriaInput,
  type ParteContrariaTransitoria,
  type SugestaoMerge,
} from "./domain";
import {
  insertTransitoria,
  getTransitoriaById,
  listTransitoriasByContrato,
  listPendentes,
  countPendentes,
  findSimilarPartes,
  updateStatusPromovido,
} from "./repository";

/**
 * Cria uma nova parte contrária transitória. Valida input com Zod.
 * Rate limit e validação de token de sessão (para fluxo público) devem
 * ser feitos pelo caller antes de invocar esta função.
 */
export async function createTransitoria(
  input: CreateTransitoriaInput,
  options: { supabase?: SupabaseClient } = {}
): Promise<ParteContrariaTransitoria> {
  const parsed = createTransitoriaSchema.parse(input);
  const supabase = options.supabase ?? createServiceClient();
  return insertTransitoria(supabase, parsed);
}

export async function findTransitoriaById(
  id: number,
  options: { supabase?: SupabaseClient } = {}
): Promise<ParteContrariaTransitoria | null> {
  const supabase = options.supabase ?? createServiceClient();
  return getTransitoriaById(supabase, id);
}

export async function listTransitoriasPendentesByContrato(
  contratoId: number,
  options: { supabase?: SupabaseClient } = {}
): Promise<ParteContrariaTransitoria[]> {
  const supabase = options.supabase ?? createServiceClient();
  return listTransitoriasByContrato(supabase, contratoId);
}

export async function listTodasPendentes(
  params: { limit?: number; offset?: number; search?: string } = {},
  options: { supabase?: SupabaseClient } = {}
): Promise<{ rows: ParteContrariaTransitoria[]; total: number }> {
  const supabase = options.supabase ?? createServiceClient();
  return listPendentes(supabase, params);
}

export async function contarPendentes(
  options: { supabase?: SupabaseClient } = {}
): Promise<number> {
  const supabase = options.supabase ?? createServiceClient();
  return countPendentes(supabase);
}

export async function sugerirMerge(
  nome: string,
  options: {
    supabase?: SupabaseClient;
    excludeTransitoriaId?: number;
    limit?: number;
  } = {}
): Promise<SugestaoMerge[]> {
  const supabase = options.supabase ?? createServiceClient();
  return findSimilarPartes(supabase, nome, {
    excludeTransitoriaId: options.excludeTransitoriaId,
    limit: options.limit,
  });
}

/**
 * Marca uma transitória como promovida, apontando para a parte_contraria
 * definitiva. NÃO faz a criação da parte_contraria em si — o caller é
 * responsável por: (a) criar a parte_contraria OU (b) reutilizar uma
 * existente, e depois chamar esta função com o id correto.
 *
 * A Fase 2.6 vai adicionar uma RPC SQL transacional que encapsula criar +
 * atualizar contrato_partes + marcar transitória como promovida, tudo atômico.
 */
export async function marcarTransitoriaComoPromovida(input: {
  transitoriaId: number;
  parteContrariaId: number;
  promovidoPor: number;
  supabase?: SupabaseClient;
}): Promise<ParteContrariaTransitoria> {
  const supabase = input.supabase ?? createServiceClient();
  return updateStatusPromovido(supabase, {
    transitoriaId: input.transitoriaId,
    parteContrariaId: input.parteContrariaId,
    promovidoPor: input.promovidoPor,
  });
}
