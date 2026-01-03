/**
 * Server Actions - Kanban
 */

"use server";

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { createKanbanColumnSchema, syncKanbanBoardSchema } from "../domain";
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


