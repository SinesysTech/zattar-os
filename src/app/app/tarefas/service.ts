/**
 * TAREFAS SERVICE (TEMPLATE TASKS)
 *
 * Camada de regras de negócio para o módulo de tarefas no modelo do template.
 * Sem retrocompatibilidade com o modelo antigo.
 */

import { appError, err, ok, Result } from "@/types";
import { z } from "zod";
import type { CreateTaskInput, ListTasksParams, Task, UpdateTaskInput } from "./domain";
import { createTaskSchema, listTasksSchema, taskSchema, updateTaskSchema } from "./domain";
import * as repo from "./repository";

function validate<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", parsed.error.errors[0]?.message || "Dados inválidos"));
  }
  return ok(parsed.data as T);
}

export async function listarTarefas(usuarioId: number, params: ListTasksParams = {}): Promise<Result<Task[]>> {
  const val = validate<ListTasksParams>(listTasksSchema, params);
  if (!val.success) return err(val.error);

  const result = await repo.listTasks(usuarioId, val.data);
  if (!result.success) return err(result.error);

  // Hard-validate o contrato que o template espera.
  const parsed = z.array(taskSchema).safeParse(result.data);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", "Dados de tarefas inválidos"));
  }

  return ok(parsed.data);
}

export async function buscarTarefa(usuarioId: number, id: string): Promise<Result<Task | null>> {
  const idVal = z.string().min(1).safeParse(id);
  if (!idVal.success) return err(appError("VALIDATION_ERROR", "ID inválido"));
  return repo.getTaskById(usuarioId, idVal.data);
}

export async function criarTarefa(usuarioId: number, input: CreateTaskInput): Promise<Result<Task>> {
  const val = validate<CreateTaskInput>(createTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.createTask(usuarioId, val.data);
}

export async function atualizarTarefa(usuarioId: number, input: UpdateTaskInput): Promise<Result<Task>> {
  const val = validate<UpdateTaskInput>(updateTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.updateTask(usuarioId, val.data);
}

export async function removerTarefa(usuarioId: number, id: string): Promise<Result<void>> {
  const idVal = z.string().min(1).safeParse(id);
  if (!idVal.success) return err(appError("VALIDATION_ERROR", "ID inválido"));
  return repo.deleteTask(usuarioId, idVal.data);
}

