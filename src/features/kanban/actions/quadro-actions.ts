/**
 * Server Actions — Quadros (Board CRUD + System Board + Status Update)
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import {
  criarQuadroCustomSchema,
  excluirQuadroCustomSchema,
  obterQuadroSistemaSchema,
  obterQuadroCustomSchema,
  atualizarStatusEntidadeSchema,
} from "../domain";
import * as service from "../service";

const emptySchema = z.object({});

export const actionListarQuadros = authenticatedAction(
  emptySchema,
  async (_data, { user }) => {
    const result = await service.listarQuadros(user.id);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);

export const actionObterQuadroSistema = authenticatedAction(
  obterQuadroSistemaSchema,
  async (data, { user }) => {
    if (!user?.id) throw new Error("Usuário não autenticado.");
    const result = await service.obterQuadroSistema(data.source);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);

export const actionObterQuadroCustom = authenticatedAction(
  obterQuadroCustomSchema,
  async (data, { user }) => {
    const result = await service.obterQuadroCustom(user.id, data.boardId);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);

export const actionCriarQuadroCustom = authenticatedAction(
  criarQuadroCustomSchema,
  async (data, { user }) => {
    const result = await service.criarQuadroCustom(user.id, data.titulo);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/kanban");
    return result.data;
  }
);

export const actionExcluirQuadroCustom = authenticatedAction(
  excluirQuadroCustomSchema,
  async (data, { user }) => {
    const result = await service.excluirQuadroCustom(user.id, data.boardId);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/kanban");
    return { success: true };
  }
);

export const actionAtualizarStatusEntidade = authenticatedAction(
  atualizarStatusEntidadeSchema,
  async (data, { user }) => {
    const result = await service.atualizarStatusEntidade(data, user.id);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/kanban");
    return { success: true };
  }
);
