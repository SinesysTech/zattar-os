/**
 * TODO REPOSITORY (template todo-list-app)
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { appError, err, ok, Result } from "@/types";
import type { Todo, TodoAssignee } from "./domain";
import type {
  CreateTodoInput,
  UpdateTodoInput,
  TodoPositionsInput,
  CreateSubTaskInput,
  UpdateSubTaskInput,
  DeleteSubTaskInput,
  AddCommentInput,
  DeleteCommentInput,
  AddFileInput,
  RemoveFileInput,
} from "./domain";

const TABLE_ITEMS = "todo_items";
const TABLE_ASSIGNEES = "todo_assignees";
const TABLE_SUBTASKS = "todo_subtasks";
const TABLE_COMMENTS = "todo_comments";
const TABLE_FILES = "todo_files";

type TodoItemRow = {
  id: string;
  usuario_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  reminder_at: string | null;
  starred: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type AssigneeJoinRow = {
  todo_id: string;
  usuario_id: number;
  usuarios: {
    id: number;
    nome_exibicao: string;
    nome_completo: string;
    email_corporativo: string;
    email_pessoal: string | null;
    avatar_url: string | null;
    ativo: boolean;
  }[];
};

type SubTaskRow = {
  id: string;
  todo_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  todo_id: string;
  body: string;
  created_at: string;
};

type FileRow = {
  id: string;
  todo_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  url: string;
  created_at: string;
};

function rowToAssignee(row: AssigneeJoinRow["usuarios"][0] | undefined): TodoAssignee | null {
  if (!row) return null;
  const name = row.nome_exibicao || row.nome_completo;
  return {
    id: row.id,
    name,
    email: row.email_corporativo || row.email_pessoal || undefined,
    avatarUrl: row.avatar_url,
  };
}

function assembleTodo(
  item: TodoItemRow,
  assignees: TodoAssignee[],
  subTasks: SubTaskRow[],
  comments: CommentRow[],
  files: FileRow[]
): Todo {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    status: item.status as Todo["status"],
    priority: item.priority as Todo["priority"],
    dueDate: item.due_date ?? null,
    reminderDate: item.reminder_at ?? null,
    starred: item.starred,
    position: item.position,
    createdAt: item.created_at,
    assignees,
    assignedTo: assignees.map((a) => a.name),
    subTasks: subTasks
      .sort((a, b) => a.position - b.position)
      .map((st) => ({ id: st.id, title: st.title, completed: st.completed, position: st.position })),
    comments: comments
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at })),
    files: files
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((f) => ({
        id: f.id,
        name: f.file_name,
        url: f.url,
        type: f.mime_type ?? undefined,
        size: f.size_bytes ?? undefined,
        uploadedAt: f.created_at,
      })),
  };
}

export async function listTodos(usuarioId: number): Promise<Result<Todo[]>> {
  try {
    const db = createDbClient();
    const { data: itemsData, error: itemsError } = await db
      .from(TABLE_ITEMS)
      .select("id, usuario_id, title, description, status, priority, due_date, reminder_at, starred, position, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (itemsError) return err(appError("DATABASE_ERROR", itemsError.message, { code: itemsError.code }));
    const items = (itemsData as TodoItemRow[]) ?? [];
    if (items.length === 0) return ok([]);

    const todoIds = items.map((t) => t.id);

    const [assigneesRes, subTasksRes, commentsRes, filesRes] = await Promise.all([
      db
        .from(TABLE_ASSIGNEES)
        .select(
          "todo_id, usuario_id, usuarios(id, nome_exibicao, nome_completo, email_corporativo, email_pessoal, avatar_url, ativo)"
        )
        .in("todo_id", todoIds),
      db
        .from(TABLE_SUBTASKS)
        .select("id, todo_id, title, completed, position, created_at, updated_at")
        .in("todo_id", todoIds),
      db.from(TABLE_COMMENTS).select("id, todo_id, body, created_at").in("todo_id", todoIds),
      db
        .from(TABLE_FILES)
        .select("id, todo_id, file_name, mime_type, size_bytes, url, created_at")
        .in("todo_id", todoIds),
    ]);

    if (assigneesRes.error) return err(appError("DATABASE_ERROR", assigneesRes.error.message, { code: assigneesRes.error.code }));
    if (subTasksRes.error) return err(appError("DATABASE_ERROR", subTasksRes.error.message, { code: subTasksRes.error.code }));
    if (commentsRes.error) return err(appError("DATABASE_ERROR", commentsRes.error.message, { code: commentsRes.error.code }));
    if (filesRes.error) return err(appError("DATABASE_ERROR", filesRes.error.message, { code: filesRes.error.code }));

    const assigneesRows = (assigneesRes.data as AssigneeJoinRow[]) ?? [];
    const subTaskRows = (subTasksRes.data as SubTaskRow[]) ?? [];
    const commentRows = (commentsRes.data as CommentRow[]) ?? [];
    const fileRows = (filesRes.data as FileRow[]) ?? [];

    const assigneesByTodo: Record<string, TodoAssignee[]> = {};
    for (const row of assigneesRows) {
      const usuarioData = row.usuarios[0];
      const a = rowToAssignee(usuarioData);
      if (!a) continue;
      if (!assigneesByTodo[row.todo_id]) assigneesByTodo[row.todo_id] = [];
      assigneesByTodo[row.todo_id].push(a);
    }

    const subTasksByTodo: Record<string, SubTaskRow[]> = {};
    for (const st of subTaskRows) {
      if (!subTasksByTodo[st.todo_id]) subTasksByTodo[st.todo_id] = [];
      subTasksByTodo[st.todo_id].push(st);
    }

    const commentsByTodo: Record<string, CommentRow[]> = {};
    for (const c of commentRows) {
      if (!commentsByTodo[c.todo_id]) commentsByTodo[c.todo_id] = [];
      commentsByTodo[c.todo_id].push(c);
    }

    const filesByTodo: Record<string, FileRow[]> = {};
    for (const f of fileRows) {
      if (!filesByTodo[f.todo_id]) filesByTodo[f.todo_id] = [];
      filesByTodo[f.todo_id].push(f);
    }

    const todos = items.map((item) =>
      assembleTodo(
        item,
        assigneesByTodo[item.id] ?? [],
        subTasksByTodo[item.id] ?? [],
        commentsByTodo[item.id] ?? [],
        filesByTodo[item.id] ?? []
      )
    );

    return ok(todos);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar to-dos", undefined, error instanceof Error ? error : undefined));
  }
}

export async function getTodoById(usuarioId: number, todoId: string): Promise<Result<Todo | null>> {
  try {
    const db = createDbClient();
    const { data: item, error } = await db
      .from(TABLE_ITEMS)
      .select("id, usuario_id, title, description, status, priority, due_date, reminder_at, starred, position, created_at, updated_at")
      .eq("usuario_id", usuarioId)
      .eq("id", todoId)
      .maybeSingle();

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    if (!item) return ok(null);

    const todoIds = [todoId];
    const [assigneesRes, subTasksRes, commentsRes, filesRes] = await Promise.all([
      db
        .from(TABLE_ASSIGNEES)
        .select(
          "todo_id, usuario_id, usuarios(id, nome_exibicao, nome_completo, email_corporativo, email_pessoal, avatar_url, ativo)"
        )
        .in("todo_id", todoIds),
      db
        .from(TABLE_SUBTASKS)
        .select("id, todo_id, title, completed, position, created_at, updated_at")
        .in("todo_id", todoIds),
      db.from(TABLE_COMMENTS).select("id, todo_id, body, created_at").in("todo_id", todoIds),
      db
        .from(TABLE_FILES)
        .select("id, todo_id, file_name, mime_type, size_bytes, url, created_at")
        .in("todo_id", todoIds),
    ]);

    if (assigneesRes.error) return err(appError("DATABASE_ERROR", assigneesRes.error.message, { code: assigneesRes.error.code }));
    if (subTasksRes.error) return err(appError("DATABASE_ERROR", subTasksRes.error.message, { code: subTasksRes.error.code }));
    if (commentsRes.error) return err(appError("DATABASE_ERROR", commentsRes.error.message, { code: commentsRes.error.code }));
    if (filesRes.error) return err(appError("DATABASE_ERROR", filesRes.error.message, { code: filesRes.error.code }));

    const assigneesRows = (assigneesRes.data as AssigneeJoinRow[]) ?? [];
    const assignees: TodoAssignee[] = assigneesRows
      .map((r) => rowToAssignee(r.usuarios[0]))
      .filter((v): v is TodoAssignee => Boolean(v));

    return ok(
      assembleTodo(
        item as TodoItemRow,
        assignees,
        ((subTasksRes.data as SubTaskRow[]) ?? []).filter((s) => s.todo_id === todoId),
        ((commentsRes.data as CommentRow[]) ?? []).filter((c) => c.todo_id === todoId),
        ((filesRes.data as FileRow[]) ?? []).filter((f) => f.todo_id === todoId)
      )
    );
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao buscar to-do", undefined, error instanceof Error ? error : undefined));
  }
}

export async function createTodo(usuarioId: number, input: CreateTodoInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();

    const { data: lastPosData, error: lastPosError } = await db
      .from(TABLE_ITEMS)
      .select("position")
      .eq("usuario_id", usuarioId)
      .order("position", { ascending: false })
      .limit(1);

    if (lastPosError) return err(appError("DATABASE_ERROR", lastPosError.message, { code: lastPosError.code }));
    const lastPos = (lastPosData?.[0] as { position?: number } | undefined)?.position ?? -1;
    const nextPos = lastPos + 1;

    const { data: item, error: insertError } = await db
      .from(TABLE_ITEMS)
      .insert({
        usuario_id: usuarioId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        due_date: input.dueDate ?? null,
        reminder_at: input.reminderDate ?? null,
        position: nextPos,
      })
      .select("id, usuario_id, title, description, status, priority, due_date, reminder_at, starred, position, created_at, updated_at")
      .single();

    if (insertError) return err(appError("DATABASE_ERROR", insertError.message, { code: insertError.code }));

    const todoId = (item as TodoItemRow).id;
    const assigneesPayload = input.assigneeUserIds.map((id) => ({ todo_id: todoId, usuario_id: id }));
    const { error: assigneesError } = await db.from(TABLE_ASSIGNEES).insert(assigneesPayload);
    if (assigneesError) return err(appError("DATABASE_ERROR", assigneesError.message, { code: assigneesError.code }));

    const full = await getTodoById(usuarioId, todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do recém-criado não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar to-do", undefined, error instanceof Error ? error : undefined));
  }
}

export async function updateTodo(usuarioId: number, input: UpdateTodoInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const payload: Record<string, unknown> = {};

    if (typeof input.title === "string") payload.title = input.title;
    if (typeof input.description === "string") payload.description = input.description;
    if (input.description === null) payload.description = null;
    if (typeof input.status === "string") payload.status = input.status;
    if (typeof input.priority === "string") payload.priority = input.priority;
    if (typeof input.dueDate !== "undefined") payload.due_date = input.dueDate ?? null;
    if (typeof input.reminderDate !== "undefined") payload.reminder_at = input.reminderDate ?? null;
    if (typeof input.starred === "boolean") payload.starred = input.starred;

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await db.from(TABLE_ITEMS).update(payload).eq("id", input.id).eq("usuario_id", usuarioId);
      if (updateError) return err(appError("DATABASE_ERROR", updateError.message, { code: updateError.code }));
    }

    if (Array.isArray(input.assigneeUserIds)) {
      const { error: delErr } = await db.from(TABLE_ASSIGNEES).delete().eq("todo_id", input.id);
      if (delErr) return err(appError("DATABASE_ERROR", delErr.message, { code: delErr.code }));

      const assigneesPayload = input.assigneeUserIds.map((id) => ({ todo_id: input.id, usuario_id: id }));
      const { error: insErr } = await db.from(TABLE_ASSIGNEES).insert(assigneesPayload);
      if (insErr) return err(appError("DATABASE_ERROR", insErr.message, { code: insErr.code }));
    }

    const full = await getTodoById(usuarioId, input.id);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao atualizar to-do", undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteTodo(usuarioId: number, id: string): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_ITEMS).delete().eq("id", id).eq("usuario_id", usuarioId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover to-do", undefined, error instanceof Error ? error : undefined));
  }
}

export async function reorderTodos(usuarioId: number, input: TodoPositionsInput): Promise<Result<void>> {
  try {
    const db = createDbClient();
    for (const p of input.positions) {
      const { error } = await db
        .from(TABLE_ITEMS)
        .update({ position: p.position })
        .eq("id", p.id)
        .eq("usuario_id", usuarioId);
      if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));
    }
    return ok(undefined);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao reordenar to-dos", undefined, error instanceof Error ? error : undefined));
  }
}

export async function createSubTask(usuarioId: number, input: CreateSubTaskInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { data: todo, error: todoErr } = await db
      .from(TABLE_ITEMS)
      .select("id")
      .eq("id", input.todoId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();
    if (todoErr) return err(appError("DATABASE_ERROR", todoErr.message, { code: todoErr.code }));
    if (!todo) return err(appError("NOT_FOUND", "To-do não encontrado"));

    const { data: lastPosData, error: lastPosError } = await db
      .from(TABLE_SUBTASKS)
      .select("position")
      .eq("todo_id", input.todoId)
      .order("position", { ascending: false })
      .limit(1);
    if (lastPosError) return err(appError("DATABASE_ERROR", lastPosError.message, { code: lastPosError.code }));
    const lastPos = (lastPosData?.[0] as { position?: number } | undefined)?.position ?? -1;
    const nextPos = lastPos + 1;

    const { error: insErr } = await db
      .from(TABLE_SUBTASKS)
      .insert({ todo_id: input.todoId, title: input.title, completed: false, position: nextPos });
    if (insErr) return err(appError("DATABASE_ERROR", insErr.message, { code: insErr.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao criar subtarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function updateSubTask(usuarioId: number, input: UpdateSubTaskInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_SUBTASKS)
      .update({ completed: input.completed })
      .eq("id", input.subTaskId)
      .eq("todo_id", input.todoId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao atualizar subtarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteSubTask(usuarioId: number, input: DeleteSubTaskInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_SUBTASKS).delete().eq("id", input.subTaskId).eq("todo_id", input.todoId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover subtarefa", undefined, error instanceof Error ? error : undefined));
  }
}

export async function addComment(usuarioId: number, input: AddCommentInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_COMMENTS).insert({ todo_id: input.todoId, body: input.body });
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao adicionar comentário", undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteComment(usuarioId: number, input: DeleteCommentInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_COMMENTS).delete().eq("id", input.commentId).eq("todo_id", input.todoId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover comentário", undefined, error instanceof Error ? error : undefined));
  }
}

export async function addFile(usuarioId: number, input: AddFileInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();

    // v1: guarda url (pode ser data-url). Protege de payloads muito grandes via validação no service.
    const { error } = await db.from(TABLE_FILES).insert({
      todo_id: input.todoId,
      file_name: input.name,
      mime_type: input.type ?? null,
      size_bytes: input.size ?? null,
      url: input.url,
    });
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao adicionar anexo", undefined, error instanceof Error ? error : undefined));
  }
}

export async function removeFile(usuarioId: number, input: RemoveFileInput): Promise<Result<Todo>> {
  try {
    const db = createDbClient();
    const { error } = await db.from(TABLE_FILES).delete().eq("id", input.fileId).eq("todo_id", input.todoId);
    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const full = await getTodoById(usuarioId, input.todoId);
    if (!full.success) return err(full.error);
    if (!full.data) return err(appError("NOT_FOUND", "To-do não encontrado"));
    return ok(full.data);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao remover anexo", undefined, error instanceof Error ? error : undefined));
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

export async function listAssignableUsers(): Promise<Result<TodoAssignee[]>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from("usuarios")
      .select("id, nome_exibicao, nome_completo, email_corporativo, email_pessoal, avatar_url, ativo")
      .eq("ativo", true)
      .order("nome_exibicao", { ascending: true });

    if (error) return err(appError("DATABASE_ERROR", error.message, { code: error.code }));

    const rows = (data as UsuarioRow[]) ?? [];
    const users: TodoAssignee[] = rows.map((u) => ({
      id: u.id,
      name: u.nome_exibicao || u.nome_completo,
      email: u.email_corporativo || u.email_pessoal || undefined,
      avatarUrl: u.avatar_url,
    }));

    return ok(users);
  } catch (error) {
    return err(appError("DATABASE_ERROR", "Erro ao listar usuários para atribuição", undefined, error instanceof Error ? error : undefined));
  }
}


