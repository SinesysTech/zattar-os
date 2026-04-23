import { createServiceClient } from "@/lib/supabase/service-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTransitoriaSchema,
  promoverTransitoriaSchema,
  type CreateTransitoriaInput,
  type ParteContrariaTransitoria,
  type PromoverTransitoriaInput,
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
 * definitiva. Uso legado — não atualiza contrato_partes. Para fluxo completo
 * (incluindo re-apontar contratos), use `promoverTransitoria` que chama
 * a RPC SQL transacional.
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

export interface PromoverResult {
  transitoria_id: number;
  parte_contraria_id: number;
  contratos_atualizados: number;
  promovido_em: string;
}

/**
 * Fluxo completo de promoção de uma parte contrária transitória. Dois caminhos
 * controlados pelo input:
 *
 * - `parte_contraria_id_alvo`: merge com uma parte_contraria já existente
 *   (deduplicação). Nenhum INSERT em partes_contrarias — só aponta os contratos
 *   para o alvo e marca a transitória como promovida.
 *
 * - `dados_novos`: cria uma nova parte_contraria com os dados fornecidos,
 *   depois aponta os contratos para ela. Criação é sequencial (fora da RPC)
 *   para manter a RPC simples; a RPC faz UPDATE atomic de contrato_partes
 *   + transitória.
 *
 * Idempotência: a RPC valida status='pendente' com SELECT FOR UPDATE, então
 * duas chamadas simultâneas não causam dupla atualização (a segunda falha
 * com erro "já foi promovida").
 */
export async function promoverTransitoria(
  transitoriaId: number,
  input: PromoverTransitoriaInput,
  promovidoPor: number,
  options: { supabase?: SupabaseClient } = {}
): Promise<PromoverResult> {
  const parsed = promoverTransitoriaSchema.parse(input);
  const supabase = options.supabase ?? createServiceClient();

  // Determinar o parte_contraria_id alvo: existente (merge) OU nova (criada agora)
  let parteContrariaId: number;

  if (parsed.parte_contraria_id_alvo != null) {
    parteContrariaId = parsed.parte_contraria_id_alvo;
  } else if (parsed.dados_novos) {
    const { data, error } = await supabase
      .from("partes_contrarias")
      .insert({
        nome: parsed.dados_novos.nome.trim(),
        tipo_pessoa: parsed.dados_novos.tipo_pessoa,
        cpf: parsed.dados_novos.cpf ?? null,
        cnpj: parsed.dados_novos.cnpj ?? null,
        created_by: promovidoPor,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        `Erro ao criar parte contrária definitiva: ${error?.message ?? "desconhecido"}`
      );
    }
    parteContrariaId = data.id as number;
  } else {
    throw new Error(
      "Input inválido: forneça parte_contraria_id_alvo OU dados_novos"
    );
  }

  // Executar RPC transacional
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "promote_parte_contraria_transitoria",
    {
      p_transitoria_id: transitoriaId,
      p_parte_contraria_id: parteContrariaId,
      p_promovido_por: promovidoPor,
    }
  );

  if (rpcError || !rpcData) {
    throw new Error(
      `Erro ao promover parte contrária transitória: ${rpcError?.message ?? "desconhecido"}`
    );
  }

  return rpcData as PromoverResult;
}
