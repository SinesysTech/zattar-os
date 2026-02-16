/**
 * TAREFAS DOMAIN (TEMPLATE TASKS + EVENTOS)
 *
 * Domínio do módulo de tarefas alinhado ao template de Tarefas (TanStack Table)
 * com suporte a eventos virtuais (audiências, expedientes, perícias, obrigações).
 */

import { z } from "zod";
import type { EventSource } from "@/lib/event-aggregation/domain";

export const taskStatusSchema = z.enum(["backlog", "todo", "in progress", "done", "canceled"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskLabelSchema = z.enum(["bug", "feature", "documentation", "audiencia", "expediente", "pericia", "obrigacao"]);
export type TaskLabel = z.infer<typeof taskLabelSchema>;

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;


// =============================================================================
// SUB-ENTITIES (From To-Do Module)
// =============================================================================

export const taskAssigneeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional().nullable(),
});
export type TaskAssignee = z.infer<typeof taskAssigneeSchema>;

export const taskSubTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean(),
  position: z.number().int().min(0),
});
export type TaskSubTask = z.infer<typeof taskSubTaskSchema>;

export const taskCommentSchema = z.object({
  id: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});
export type TaskComment = z.infer<typeof taskCommentSchema>;

export const taskFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional().nullable(),
  size: z.number().int().optional().nullable(),
  uploadedAt: z.string().min(1),
});
export type TaskFile = z.infer<typeof taskFileSchema>;

/**
 * Entidade usada pela UI (mesmo contrato do template em `data/schema.ts`)
 */
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  label: taskLabelSchema,
  priority: taskPrioritySchema,
  // New Fields from To-Do
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(), // yyyy-mm-dd
  reminderDate: z.string().optional().nullable(), // timestamptz iso
  starred: z.boolean().default(false),
  assignees: z.array(taskAssigneeSchema).default([]),
  assignedTo: z.array(z.string()).default([]), // For backward compatibility if needed
  subTasks: z.array(taskSubTaskSchema).default([]),
  comments: z.array(taskCommentSchema).default([]),
  files: z.array(taskFileSchema).default([]),
  //
  source: z.string().optional().nullable(), // from eventSourceSchema
  sourceEntityId: z.string().optional().nullable(),
  position: z.number().default(0),
});
export type Task = z.infer<typeof taskSchema>;

/**
 * Tipo display unificado: task manual OU evento virtual.
 */
export interface TarefaDisplayItem extends Task {
  url?: string;
  isVirtual?: boolean;
  prazoVencido?: boolean;
  responsavelNome?: string;
  date?: string;
}

/**
 * Criação: id é gerado no banco (ex: TASK-0001)
 */
export const createTaskSchema = taskSchema.omit({ id: true, source: true, sourceEntityId: true }).partial({
  assignees: true,
  assignedTo: true,
  subTasks: true,
  comments: true,
  files: true,
  starred: true,
  position: true, // position é opcional na criação (será calculado automaticamente)
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  starred: z.boolean().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
});
export type ListTasksParams = z.infer<typeof listTasksSchema>;

// =============================================================================
// ACTION INPUTS (From To-Do Module)
// =============================================================================

export const createSubTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
});
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;

export const updateSubTaskSchema = z.object({
  taskId: z.string().min(1),
  subTaskId: z.string().min(1),
  completed: z.boolean(),
});
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

export const deleteSubTaskSchema = z.object({
  taskId: z.string().min(1),
  subTaskId: z.string().min(1),
});
export type DeleteSubTaskInput = z.infer<typeof deleteSubTaskSchema>;

export const addCommentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().min(1),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const deleteCommentSchema = z.object({
  taskId: z.string().min(1),
  commentId: z.string().min(1),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;

export const addFileSchema = z.object({
  taskId: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional(),
  size: z.number().optional(),
});
export type AddFileInput = z.infer<typeof addFileSchema>;

export const removeFileSchema = z.object({
  taskId: z.string().min(1),
  fileId: z.string().min(1),
});
export type RemoveFileInput = z.infer<typeof removeFileSchema>;

export const taskPositionsSchema = z.object({
  positions: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ),
});
export type TaskPositionsInput = z.infer<typeof taskPositionsSchema>;
