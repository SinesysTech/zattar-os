"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import * as service from "../service";
import {
  addCommentSchema,
  addFileSchema,
  createSubTaskSchema,
  createTodoSchema,
  deleteCommentSchema,
  deleteSubTaskSchema,
  listTodosSchema,
  removeFileSchema,
  todoIdSchema,
  todoPositionsSchema,
  updateSubTaskSchema,
  updateTodoSchema,
} from "../domain";

const emptySchema = z.object({});

export const actionListarTodos = authenticatedAction(
  listTodosSchema,
  async (_data, { user }) => {
    const result = await service.listarTodos(user.id);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);

export const actionBuscarTodo = authenticatedAction(
  todoIdSchema,
  async (data, { user }) => {
    const result = await service.buscarTodo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);

export const actionCriarTodo = authenticatedAction(
  createTodoSchema,
  async (data, { user }) => {
    const result = await service.criarTodo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionAtualizarTodo = authenticatedAction(
  updateTodoSchema,
  async (data, { user }) => {
    const result = await service.atualizarTodo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionRemoverTodo = authenticatedAction(
  todoIdSchema,
  async (data, { user }) => {
    const result = await service.removerTodo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return { success: true };
  }
);

export const actionReordenarTodos = authenticatedAction(
  todoPositionsSchema,
  async (data, { user }) => {
    const result = await service.reordenarTodos(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return { success: true };
  }
);

export const actionCriarSubtarefa = authenticatedAction(
  createSubTaskSchema,
  async (data, { user }) => {
    const result = await service.criarSubtarefa(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionAtualizarSubtarefa = authenticatedAction(
  updateSubTaskSchema,
  async (data, { user }) => {
    const result = await service.atualizarSubtarefa(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionRemoverSubtarefa = authenticatedAction(
  deleteSubTaskSchema,
  async (data, { user }) => {
    const result = await service.removerSubtarefa(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionAdicionarComentario = authenticatedAction(
  addCommentSchema,
  async (data, { user }) => {
    const result = await service.adicionarComentario(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionRemoverComentario = authenticatedAction(
  deleteCommentSchema,
  async (data, { user }) => {
    const result = await service.removerComentario(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionAdicionarAnexo = authenticatedAction(
  addFileSchema,
  async (data, { user }) => {
    const result = await service.adicionarAnexo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionRemoverAnexo = authenticatedAction(
  removeFileSchema,
  async (data, { user }) => {
    const result = await service.removerAnexo(user.id, data);
    if (!result.success) throw new Error(result.error.message);
    revalidatePath("/app/todo");
    return result.data;
  }
);

export const actionListarUsuariosParaAtribuicao = authenticatedAction(
  emptySchema,
  async (_data, { user: _user }) => {
    const result = await service.listarUsuariosParaAtribuicao();
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }
);


