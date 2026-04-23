"use server";

import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import { checkPermission } from "@/lib/auth/authorization";
import {
  promoverTransitoria,
  listTodasPendentes,
  contarPendentes,
  sugerirMerge,
  findTransitoriaById,
  listTransitoriasPendentesByContrato,
  type PromoverResult,
} from "./service";
import {
  promoverTransitoriaSchema,
  type ParteContrariaTransitoria,
  type SugestaoMerge,
} from "./domain";

/**
 * Promove uma parte contrária transitória para uma parte_contraria definitiva.
 *
 * Permissão: exige operação granular `partes_contrarias.promover`. Backfill
 * automático de seed (migration 20260423140000) concede esse bit para todos
 * os usuários que já tinham `partes_contrarias.criar`, mantendo backwards
 * compatibility. Firmas que queiram restringir promoção separadamente agora
 * podem revogar o bit `promover` sem revogar `criar`.
 *
 * Retorno inclui contratos_atualizados (quantos contratos foram re-apontados).
 */
export const actionPromoverTransitoria = authenticatedAction(
  z.object({
    transitoriaId: z.number().int().positive(),
    input: promoverTransitoriaSchema,
  }),
  async (data, { user }): Promise<PromoverResult> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "promover"
    );
    if (!allowed) {
      throw new Error(
        "Você não tem permissão para promover partes contrárias transitórias"
      );
    }

    return promoverTransitoria(data.transitoriaId, data.input, user.id);
  }
);

/**
 * Lista partes contrárias transitórias pendentes (paginado + busca por nome).
 * Permissão: `partes_contrarias.listar`.
 */
export const actionListarTransitoriasPendentes = authenticatedAction(
  z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    search: z.string().optional().nullable(),
  }),
  async (
    data,
    { user }
  ): Promise<{ rows: ParteContrariaTransitoria[]; total: number }> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "listar"
    );
    if (!allowed) {
      throw new Error("Você não tem permissão para listar partes contrárias");
    }

    return listTodasPendentes({
      limit: data.limit,
      offset: data.offset,
      search: data.search ?? undefined,
    });
  }
);

/**
 * Retorna contagem de transitórias pendentes. Usada pelo widget do dashboard.
 */
export const actionContarTransitoriasPendentes = authenticatedAction(
  z.object({}),
  async (_data, { user }): Promise<number> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "listar"
    );
    if (!allowed) return 0;
    return contarPendentes();
  }
);

/**
 * Busca sugestões de merge (partes_contrarias + outras transitórias) por
 * nome similar. Usado na tela de promoção para oferecer vincular a parte
 * existente em vez de criar duplicata.
 */
export const actionBuscarSugestoesMerge = authenticatedAction(
  z.object({
    nome: z.string().min(2).max(200),
    excludeTransitoriaId: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  async (data, { user }): Promise<SugestaoMerge[]> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "listar"
    );
    if (!allowed) return [];

    return sugerirMerge(data.nome, {
      excludeTransitoriaId: data.excludeTransitoriaId,
      limit: data.limit,
    });
  }
);

/**
 * Busca uma transitória por ID (para tela de promoção pré-carregar dados).
 */
export const actionBuscarTransitoriaPorId = authenticatedAction(
  z.object({ id: z.number().int().positive() }),
  async (data, { user }): Promise<ParteContrariaTransitoria | null> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "visualizar"
    );
    if (!allowed) {
      throw new Error("Você não tem permissão para visualizar esta entidade");
    }
    return findTransitoriaById(data.id);
  }
);

/**
 * Lista transitórias pendentes de um contrato específico (para exibir
 * no alerta da tela de detalhes do contrato).
 */
export const actionListarTransitoriasPorContrato = authenticatedAction(
  z.object({ contratoId: z.number().int().positive() }),
  async (data, { user }): Promise<ParteContrariaTransitoria[]> => {
    const allowed = await checkPermission(
      user.id,
      "partes_contrarias",
      "listar"
    );
    if (!allowed) return [];
    return listTransitoriasPendentesByContrato(data.contratoId);
  }
);
