/**
 * Server Actions - Kanban
 */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import { createKanbanColumnSchema, createKanbanTaskSchema, syncKanbanBoardSchema } from "../domain";
import * as service from "../service";

export const actionCriarColunaKanban = authenticatedAction(
  createKanbanColumnSchema,
  async (data, { user }) => {
    const result = await service.criarColuna(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/kanban");
    return result.data;
  }
);

export const actionCriarTarefaKanban = authenticatedAction(
  createKanbanTaskSchema,
  async (data, { user }) => {
    const result = await service.criarTarefa(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/kanban");
    return result.data;
  }
);

export const actionSincronizarKanban = authenticatedAction(
  syncKanbanBoardSchema,
  async (data, { user }) => {
    const result = await service.sincronizarKanban(user.id, data);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/kanban");
    return { success: true };
  }
);

const emptySchema = z.object({});

export const actionListarUsuariosKanban = authenticatedAction(
  emptySchema,
  async (_data, { user }) => {
    // forçar auth (não usamos o user aqui além de autenticação)
    if (!user?.id) {
      throw new Error("Usuário não autenticado.");
    }
    const result = await service.listarUsuariosParaAtribuicao();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

const deleteColumnSchema = z.object({
  columnId: z.string().min(1),
});

export const actionExcluirColunaKanban = authenticatedAction(
  deleteColumnSchema,
  async (data, { user }) => {
    const result = await service.excluirColuna(user.id, data.columnId);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath("/kanban");
    return { success: true };
  }
);


