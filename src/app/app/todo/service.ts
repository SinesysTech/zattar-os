/**
 * TODO SERVICE
 */

import { z } from "zod";
import { appError, err, ok, Result } from "@/types";
import * as repo from "./repository";
import type {
  AddCommentInput,
  AddFileInput,
  CreateSubTaskInput,
  CreateTodoInput,
  DeleteCommentInput,
  DeleteSubTaskInput,
  RemoveFileInput,
  Todo,
  TodoAssignee,
  TodoPositionsInput,
  UpdateSubTaskInput,
  UpdateTodoInput,
} from "./domain";
import {
  addCommentSchema,
  addFileSchema,
  createSubTaskSchema,
  createTodoSchema,
  deleteCommentSchema,
  deleteSubTaskSchema,
  todoIdSchema,
  todoPositionsSchema,
  updateSubTaskSchema,
  updateTodoSchema,
  removeFileSchema,
} from "./domain";

function validate<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", parsed.error.errors[0]?.message || "Dados inválidos"));
  }
  return ok(parsed.data as T);
}

export async function listarTodos(usuarioId: number): Promise<Result<Todo[]>> {
  return repo.listTodos(usuarioId);
}

export async function buscarTodo(usuarioId: number, input: { id: string }): Promise<Result<Todo>> {
  const val = validate<{ id: string }>(todoIdSchema, input);
  if (!val.success) return err(val.error);

  const result = await repo.getTodoById(usuarioId, val.data.id);
  if (!result.success) return err(result.error);
  if (!result.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
  return ok(result.data);
}

export async function criarTodo(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<CreateTodoInput>(createTodoSchema, input);
  if (!val.success) return err(val.error);
  return repo.createTodo(usuarioId, val.data);
}

export async function atualizarTodo(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<UpdateTodoInput>(updateTodoSchema, input);
  if (!val.success) return err(val.error);
  return repo.updateTodo(usuarioId, val.data);
}

export async function removerTodo(usuarioId: number, input: unknown): Promise<Result<void>> {
  const val = validate<{ id: string }>(todoIdSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteTodo(usuarioId, val.data.id);
}

export async function reordenarTodos(usuarioId: number, input: unknown): Promise<Result<void>> {
  const val = validate<TodoPositionsInput>(todoPositionsSchema, input);
  if (!val.success) return err(val.error);
  return repo.reorderTodos(usuarioId, val.data);
}

export async function criarSubtarefa(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<CreateSubTaskInput>(createSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.createSubTask(usuarioId, val.data);
}

export async function atualizarSubtarefa(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<UpdateSubTaskInput>(updateSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.updateSubTask(usuarioId, val.data);
}

export async function removerSubtarefa(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<DeleteSubTaskInput>(deleteSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteSubTask(usuarioId, val.data);
}

export async function adicionarComentario(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<AddCommentInput>(addCommentSchema, input);
  if (!val.success) return err(val.error);
  return repo.addComment(usuarioId, val.data);
}

export async function removerComentario(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<DeleteCommentInput>(deleteCommentSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteComment(usuarioId, val.data);
}

export async function adicionarAnexo(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<AddFileInput>(addFileSchema, input);
  if (!val.success) return err(val.error);

  // Proteção simples contra payload enorme (data-url/base64).
  if (val.data.url.length > 2_500_000) {
    return err(appError("VALIDATION_ERROR", "Anexo muito grande. Limite aproximado: 2.5MB (data-url)."));
  }

  return repo.addFile(usuarioId, val.data);
}

export async function removerAnexo(usuarioId: number, input: unknown): Promise<Result<Todo>> {
  const val = validate<RemoveFileInput>(removeFileSchema, input);
  if (!val.success) return err(val.error);
  return repo.removeFile(usuarioId, val.data);
}

export async function listarUsuariosParaAtribuicao(): Promise<Result<TodoAssignee[]>> {
  return repo.listAssignableUsers();
}


