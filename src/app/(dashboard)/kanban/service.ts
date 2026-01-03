/**
 * KANBAN SERVICE
 *
 * Regras de negócio e montagem do payload consumido pelo template.
 */

import { z } from "zod";
import { appError, err, ok, Result } from "@/types";
import type {
  CreateKanbanColumnInput,
  CreateKanbanTaskInput,
  KanbanAssignableUser,
  KanbanBoardData,
  KanbanColumn,
  KanbanTask,
  SyncKanbanBoardInput,
} from "./domain";
import {
  createKanbanColumnSchema,
  createKanbanTaskSchema,
  kanbanBoardSchema,
  syncKanbanBoardSchema,
} from "./domain";
import * as repo from "./repository";

function validate<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", parsed.error.errors[0]?.message || "Dados inválidos"));
  }
  return ok(parsed.data as T);
}

const DEFAULT_COLUMNS: Array<{ title: string; position: number }> = [
  { title: "Backlog", position: 0 },
  { title: "Em andamento", position: 1 },
  { title: "Concluído", position: 2 },
];

async function ensureDefaultColumns(usuarioId: number): Promise<Result<KanbanColumn[]>> {
  const cols = await repo.listColumns(usuarioId);
  if (!cols.success) return err(cols.error);
  if (cols.data.length > 0) return ok(cols.data);

  // Criar colunas padrão
  const created: KanbanColumn[] = [];
  for (const c of DEFAULT_COLUMNS) {
    const r = await repo.createColumn(usuarioId, c.title, c.position);
    if (!r.success) return err(r.error);
    created.push(r.data);
  }
  return ok(created);
}

export async function obterKanban(usuarioId: number): Promise<Result<KanbanBoardData>> {
  const colsResult = await ensureDefaultColumns(usuarioId);
  if (!colsResult.success) return err(colsResult.error);
  const columns = colsResult.data;

  const tasksResult = await repo.listTasks(usuarioId);
  if (!tasksResult.success) return err(tasksResult.error);

  const tasksByColumn: Record<string, KanbanBoardData["tasksByColumn"][string]> = {};
  for (const col of columns) {
    tasksByColumn[col.id] = [];
  }
  for (const item of tasksResult.data) {
    if (!tasksByColumn[item.columnId]) tasksByColumn[item.columnId] = [];
    tasksByColumn[item.columnId].push(item.task);
  }

  const board: KanbanBoardData = { columns, tasksByColumn };
  const parsed = kanbanBoardSchema.safeParse(board);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", "Dados de kanban inválidos"));
  }

  return ok(parsed.data);
}

export async function criarColuna(usuarioId: number, input: CreateKanbanColumnInput): Promise<Result<KanbanColumn>> {
  const val = validate<CreateKanbanColumnInput>(createKanbanColumnSchema, input);
  if (!val.success) return err(val.error);

  const cols = await repo.listColumns(usuarioId);
  if (!cols.success) return err(cols.error);
  const nextPos = cols.data.length;

  return repo.createColumn(usuarioId, val.data.title, nextPos);
}

export async function criarTarefa(usuarioId: number, input: CreateKanbanTaskInput): Promise<Result<{ columnId: string; task: KanbanTask }>> {
  const val = validate<CreateKanbanTaskInput>(createKanbanTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.createTask(usuarioId, val.data);
}

export async function sincronizarKanban(usuarioId: number, input: SyncKanbanBoardInput): Promise<Result<void>> {
  const val = validate<SyncKanbanBoardInput>(syncKanbanBoardSchema, input);
  if (!val.success) return err(val.error);
  return repo.upsertBoardLayout(usuarioId, val.data);
}

export async function listarUsuariosParaAtribuicao(): Promise<Result<KanbanAssignableUser[]>> {
  // Nota: listagem de usuários é controlada pelas policies do schema `public.usuarios`.
  const result = await repo.listAssignableUsers();
  if (!result.success) return err(result.error);
  return ok(result.data);
}

export async function excluirColuna(usuarioId: number, columnId: string): Promise<Result<void>> {
  if (!columnId || typeof columnId !== "string") {
    return err(appError("VALIDATION_ERROR", "Coluna inválida."));
  }
  return repo.deleteColumn(usuarioId, columnId);
}


