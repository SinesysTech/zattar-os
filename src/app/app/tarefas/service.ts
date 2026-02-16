/**
 * TAREFAS SERVICE (TEMPLATE TASKS + EVENTOS)
 *
 * Camada de regras de negócio para o módulo de tarefas.
 * Inclui agregação virtual de eventos (audiências, expedientes, perícias, obrigações).
 */

import { appError, err, ok, Result } from "@/types";
import { z } from "zod";
import type {
  CreateTaskInput,
  ListTasksParams,
  Task,
  TarefaDisplayItem,
  UpdateTaskInput,
  CreateSubTaskInput,
  UpdateSubTaskInput,
  DeleteSubTaskInput,
  AddCommentInput,
  DeleteCommentInput,
  AddFileInput,
  RemoveFileInput,
  TaskPositionsInput
} from "./domain";
import {
  createTaskSchema,
  listTasksSchema,
  taskSchema,
  updateTaskSchema,
  createSubTaskSchema,
  updateSubTaskSchema,
  deleteSubTaskSchema,
  addCommentSchema,
  deleteCommentSchema,
  addFileSchema,
  removeFileSchema,
  taskPositionsSchema
} from "./domain";
import * as repo from "./repository";
import { listarTodosEventos } from "@/lib/event-aggregation/service";
import { mapSourceStatusToTarefaStatus, calcularPrioridade } from "@/lib/event-aggregation/domain";
import type { UnifiedEventItem } from "@/lib/event-aggregation/domain";
import type { EventSource } from "@/lib/event-aggregation/domain";

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
    // console.error(parsed.error); // Useful for debugging
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

  // TODO: Add source sync logic here if needed (port from todo/service.ts)

  return repo.updateTask(usuarioId, val.data);
}


export async function removerTarefa(usuarioId: number, id: string): Promise<Result<void>> {
  const idVal = z.string().min(1).safeParse(id);
  if (!idVal.success) return err(appError("VALIDATION_ERROR", "ID inválido"));
  return repo.deleteTask(usuarioId, idVal.data);
}

// =============================================================================
// SUB-ENTITIES ACTIONS (Ported from To-Do)
// =============================================================================

export async function criarSubtarefa(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<CreateSubTaskInput>(createSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.createSubTask(usuarioId, val.data);
}

export async function atualizarSubtarefa(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<UpdateSubTaskInput>(updateSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.updateSubTask(usuarioId, val.data);
}

export async function removerSubtarefa(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<DeleteSubTaskInput>(deleteSubTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteSubTask(usuarioId, val.data);
}

export async function adicionarComentario(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<AddCommentInput>(addCommentSchema, input);
  if (!val.success) return err(val.error);
  return repo.addComment(usuarioId, val.data);
}

export async function removerComentario(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<DeleteCommentInput>(deleteCommentSchema, input);
  if (!val.success) return err(val.error);
  return repo.deleteComment(usuarioId, val.data);
}

export async function adicionarAnexo(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<AddFileInput>(addFileSchema, input);
  if (!val.success) return err(val.error);

  if (val.data.url.length > 2_500_000) {
    return err(appError("VALIDATION_ERROR", "Anexo muito grande. Limite aproximado: 2.5MB (data-url)."));
  }

  return repo.addFile(usuarioId, val.data);
}

export async function removerAnexo(usuarioId: number, input: unknown): Promise<Result<Task>> {
  const val = validate<RemoveFileInput>(removeFileSchema, input);
  if (!val.success) return err(val.error);
  return repo.removeFile(usuarioId, val.data);
}

export async function reorderTasks(usuarioId: number, input: TaskPositionsInput): Promise<Result<void>> {
  const val = validate<TaskPositionsInput>(taskPositionsSchema, input);
  if (!val.success) return err(val.error);
  return repo.reorderTasks(usuarioId, val.data);
}

// =============================================================================
// AGREGAÇÃO VIRTUAL: Tarefas manuais + Eventos do sistema
// =============================================================================

const SOURCE_TO_LABEL: Record<EventSource, TarefaDisplayItem["label"]> = {
  audiencias: "audiencia",
  expedientes: "expediente",
  pericias: "pericia",
  obrigacoes: "obrigacao",
};


function eventoToTarefaDisplay(evento: UnifiedEventItem): TarefaDisplayItem {
  return {
    id: evento.id,
    title: evento.titulo,
    status: mapSourceStatusToTarefaStatus(evento.source, evento.statusOrigem),
    label: SOURCE_TO_LABEL[evento.source],
    priority: calcularPrioridade(evento.dataVencimento, evento.prazoVencido),
    position: 0, // Virtual events don't have position in kanban
    description: undefined,
    dueDate: evento.dataVencimento,
    reminderDate: null,
    starred: false,
    assignees: [],
    assignedTo: [],
    subTasks: [],
    comments: [],
    files: [],
    source: evento.source,
    sourceEntityId: String(evento.sourceEntityId),
    url: evento.url,
    isVirtual: true,
    prazoVencido: evento.prazoVencido,
    responsavelNome: evento.responsavelNome,
    date: evento.dataVencimento,
  };
}



/**
 * Lista tarefas manuais + eventos virtuais do sistema.
 * - Admin (isSuperAdmin) vê tudo
 * - Outros usuários veem apenas eventos atribuídos a eles (default)
 * - showAll=true permite ver tudo independente do role
 */
export async function listarTarefasComEventos(
  usuarioId: number,
  isSuperAdmin: boolean,
  params: ListTasksParams = {},
  showAll = false
): Promise<Result<TarefaDisplayItem[]>> {
  // 1. Buscar tarefas manuais
  const manualResult = await listarTarefas(usuarioId, params);
  const manualTasks: TarefaDisplayItem[] = manualResult.success
    ? manualResult.data.map((t) => ({ ...t, isVirtual: false }))
    : [];

  // 2. Buscar eventos do sistema
  let eventos: UnifiedEventItem[] = [];
  try {
    const responsavelFilter = isSuperAdmin || showAll ? undefined : usuarioId;
    eventos = await listarTodosEventos({
      responsavelId: responsavelFilter,
    });
  } catch {
    // Em caso de erro, retorna apenas as tarefas manuais
  }

  // 3. Converter eventos para formato de tarefa display
  let virtualTasks = eventos.map(eventoToTarefaDisplay);

  // 4. Aplicar filtros de params aos eventos virtuais
  if (params.status) {
    virtualTasks = virtualTasks.filter((t) => t.status === params.status);
  }
  if (params.label) {
    virtualTasks = virtualTasks.filter((t) => t.label === params.label);
  }
  if (params.priority) {
    virtualTasks = virtualTasks.filter((t) => t.priority === params.priority);
  }
  if (params.search) {
    const search = params.search.toLowerCase();
    virtualTasks = virtualTasks.filter((t) => t.title.toLowerCase().includes(search));
  }

  // 5. Merge: tarefas manuais primeiro, depois eventos
  return ok([...manualTasks, ...virtualTasks]);
}

