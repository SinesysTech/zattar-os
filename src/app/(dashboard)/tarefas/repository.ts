/**
 * TAREFAS REPOSITORY (TEMPLATE TASKS)
 *
 * Persistência alinhada ao modelo do template:
 * - id (text, ex: TASK-0001) gerado no banco
 * - title, status, label, priority (text com constraints)
 *
 * Sem compatibilidade com o modelo antigo.
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { appError, err, ok, Result } from "@/types";
import type { CreateTaskInput, ListTasksParams, Task, UpdateTaskInput } from "./domain";

const TABLE = "tarefas";

type TaskRow = {
  id: string;
  usuario_id: number;
  title: string;
  status: string;
  label: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status as Task["status"],
    label: row.label as Task["label"],
    priority: row.priority as Task["priority"],
  };
}

export async function listTasks(usuarioId: number, params: ListTasksParams = {}): Promise<Result<Task[]>> {
  try {
    const db = createDbClient();

    let query = db
      .from(TABLE)
      .select("id, title, status, label, priority, usuario_id, created_at, updated_at")
      .eq("usuario_id", usuarioId);

    if (params.search) {
      query = query.ilike("title", `%${params.search}%`);
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.label) {
      query = query.eq("label", params.label);
    }
    if (params.priority) {
      query = query.eq("priority", params.priority);
    }

    query = query.order("created_at", { ascending: false });
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok((data as TaskRow[]).map(rowToTask));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar tarefas", undefined, error instanceof Error ? error : undefined));
  }
}

export async function getTaskById(usuarioId: number, id: string): Promise<Result<Task | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .select("id, title, status, label, priority, usuario_id, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }
    if (!data) {
      return ok(null);
    }

    return ok(rowToTask(data as TaskRow));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao buscar tarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function createTask(usuarioId: number, input: CreateTaskInput): Promise<Result<Task>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE)
      .insert({
        usuario_id: usuarioId,
        title: input.title,
        status: input.status,
        label: input.label,
        priority: input.priority,
      })
      .select("id, title, status, label, priority, usuario_id, created_at, updated_at")
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(rowToTask(data as TaskRow));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar tarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function updateTask(usuarioId: number, input: UpdateTaskInput): Promise<Result<Task>> {
  try {
    const db = createDbClient();

    const { data: existing, error: existingError } = await db
      .from(TABLE)
      .select("id")
      .eq("usuario_id", usuarioId)
      .eq("id", input.id)
      .maybeSingle();

    if (existingError) {
      return err(appError("DATABASE_ERROR", existingError.message, { code: existingError.code }));
    }
    if (!existing) {
      return err(appError("NOT_FOUND", "Tarefa não encontrada"));
    }

    const updateData: Partial<TaskRow> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.label !== undefined) updateData.label = input.label;
    if (input.priority !== undefined) updateData.priority = input.priority;

    const { data, error } = await db
      .from(TABLE)
      .update(updateData)
      .eq("usuario_id", usuarioId)
      .eq("id", input.id)
      .select("id, title, status, label, priority, usuario_id, created_at, updated_at")
      .single();

    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }

    return ok(rowToTask(data as TaskRow));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao atualizar tarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteTask(usuarioId: number, id: string): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE).delete().eq("usuario_id", usuarioId).eq("id", id);
    if (error) {
      return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }
    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover tarefa", undefined, error instanceof Error ? error : undefined));
  }
}

