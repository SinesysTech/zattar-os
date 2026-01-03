/**
 * KANBAN REPOSITORY
 *
 * Camada de persistência do módulo Kanban.
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { appError, err, ok, Result } from "@/types";
import type {
  CreateKanbanTaskInput,
  KanbanAssignableUser,
  KanbanColumn,
  KanbanTask,
  SyncKanbanBoardInput,
} from "./domain";

const TABLE_COLUMNS = "kanban_columns";
const TABLE_TASKS = "kanban_tasks";

type KanbanColumnRow = {
  id: string;
  usuario_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type KanbanTaskRow = {
  id: string;
  usuario_id: number;
  column_id: string;
  title: string;
  description: string | null;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  progress: number;
  attachments: number;
  comments: number;
  users: unknown;
  position: number;
  created_at: string;
  updated_at: string;
};

function rowToColumn(row: KanbanColumnRow): KanbanColumn {
  return { id: row.id, title: row.title, position: row.position };
}

function rowToTask(row: KanbanTaskRow): KanbanTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as KanbanTask["priority"],
    assignee: row.assignee ?? undefined,
    dueDate: row.due_date ?? undefined,
    progress: row.progress,
    attachments: row.attachments ?? undefined,
    comments: row.comments ?? undefined,
    users: (row.users as KanbanTask["users"]) ?? [],
  };
}

export async function createTask(
  usuarioId: number,
  input: CreateKanbanTaskInput
): Promise<Result<{ columnId: string; task: KanbanTask }>> {
  try {
    const db = createDbClient();

    const { data: lastPosData, error: lastPosError } = await db
      .from(TABLE_TASKS)
      .select("position")
      .eq("usuario_id", usuarioId)
      .eq("column_id", input.columnId)
      .order("position", { ascending: false })
      .limit(1);

    if (lastPosError) {
      return err(appError("DATABASE_ERROR", lastPosError.message, { code: lastPosError.code }));
    }

    const lastPos = (lastPosData?.[0] as { position?: number } | undefined)?.position ?? -1;
    const nextPos = lastPos + 1;

    const payload = {
      usuario_id: usuarioId,
      column_id: input.columnId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      progress: 0,
      attachments: 0,
      comments: 0,
      users: [],
      position: nextPos,
    };

    const { data, error } = await db
      .from(TABLE_TASKS)
      .insert(payload)
      .select(
        "id, usuario_id, column_id, title, description, priority, assignee, due_date, progress, attachments, comments, users, position, created_at, updated_at"
      )
      .single();

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const row = data as KanbanTaskRow;
    return ok({ columnId: row.column_id, task: rowToTask(row) });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar tarefa no kanban",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function listColumns(usuarioId: number): Promise<Result<KanbanColumn[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_COLUMNS)
      .select("id, usuario_id, title, position, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .order("position", { ascending: true });

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok((data as KanbanColumnRow[]).map(rowToColumn));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar colunas do kanban", undefined, error instanceof Error ? error : undefined));
  }
}

export async function listTasks(usuarioId: number): Promise<Result<Array<{ columnId: string; position: number; task: KanbanTask }>>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_TASKS)
      .select("id, usuario_id, column_id, title, description, priority, assignee, due_date, progress, attachments, comments, users, position, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .order("position", { ascending: true });

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const rows = data as KanbanTaskRow[];
    return ok(
      rows.map((r) => ({
        columnId: r.column_id,
        position: r.position,
        task: rowToTask(r),
      }))
    );
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar cards do kanban", undefined, error instanceof Error ? error : undefined));
  }
}

export async function createColumn(usuarioId: number, title: string, position: number): Promise<Result<KanbanColumn>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_COLUMNS)
      .insert({ usuario_id: usuarioId, title, position })
      .select("id, usuario_id, title, position, created_at, updated_at")
      .single();

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(rowToColumn(data as KanbanColumnRow));
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar coluna do kanban", undefined, error instanceof Error ? error : undefined));
  }
}

export async function upsertBoardLayout(usuarioId: number, payload: SyncKanbanBoardInput): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // Atualiza posições/títulos das colunas (mantém modelo do template).
    const columnsUpsert = payload.columns.map((c) => ({
      id: c.id,
      usuario_id: usuarioId,
      title: c.title,
      position: c.position,
    }));

    const { error: colErr } = await db.from(TABLE_COLUMNS).upsert(columnsUpsert, { onConflict: "id" });
    if (colErr) return err(appError("DATABASE_ERROR", colErr.message, { code: colErr.code }));

    // Atualiza coluna/posição dos cards.
    const tasksUpsert = payload.tasks.map((t) => ({
      id: t.id,
      usuario_id: usuarioId,
      column_id: t.columnId,
      position: t.position,
    }));

    const { error: taskErr } = await db.from(TABLE_TASKS).upsert(tasksUpsert, { onConflict: "id" });
    if (taskErr) return err(appError("DATABASE_ERROR", taskErr.message, { code: taskErr.code }));

    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao sincronizar layout do kanban", undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteColumn(usuarioId: number, columnId: string): Promise<Result<void>> {
  try {
    const db = createDbClient();

    // `column_id` em kanban_tasks tem `on delete cascade`, então excluir a coluna remove os cards.
    const { error } = await db
      .from(TABLE_COLUMNS)
      .delete()
      .eq("id", columnId)
      .eq("usuario_id", usuarioId);

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao excluir coluna do kanban",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

type UsuarioRow = {
  id: number;
  nome_exibicao: string;
  nome_completo: string;
  email_corporativo: string;
  email_pessoal: string | null;
  avatar_url: string | null;
  ativo: boolean;
};

export async function listAssignableUsers(): Promise<Result<KanbanAssignableUser[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from("usuarios")
      .select("id, nome_exibicao, nome_completo, email_corporativo, email_pessoal, avatar_url, ativo")
      .eq("ativo", true)
      .order("nome_exibicao", { ascending: true });

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const rows = (data as UsuarioRow[]) ?? [];
    const users: KanbanAssignableUser[] = rows.map((u) => ({
      id: u.id,
      name: u.nome_exibicao || u.nome_completo,
      email: u.email_corporativo || u.email_pessoal || undefined,
      avatarUrl: u.avatar_url || undefined,
    }));

    return ok(users);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar usuários para atribuição",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}


