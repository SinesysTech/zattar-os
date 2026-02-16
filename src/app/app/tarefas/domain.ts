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

/**
 * Entidade usada pela UI (mesmo contrato do template em `data/schema.ts`)
 */
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  label: taskLabelSchema,
  priority: taskPrioritySchema,
});
export type Task = z.infer<typeof taskSchema>;

/**
 * Tipo display unificado: task manual OU evento virtual.
 */
export interface TarefaDisplayItem extends Task {
  source?: EventSource;
  sourceEntityId?: string | number;
  url?: string;
  isVirtual?: boolean;
  prazoVencido?: boolean;
  responsavelNome?: string;
}

/**
 * Criação: id é gerado no banco (ex: TASK-0001)
 */
export const createTaskSchema = taskSchema.omit({ id: true });
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksSchema = z.object({
  search: z.string().optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type ListTasksParams = z.infer<typeof listTasksSchema>;

