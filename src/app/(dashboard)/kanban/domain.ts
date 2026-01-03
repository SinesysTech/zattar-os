/**
 * KANBAN DOMAIN (template)
 *
 * Domínio alinhado ao template de Kanban em `components/kanban-board.tsx`.
 */

import { z } from "zod";

export const kanbanTaskPrioritySchema = z.enum(["low", "medium", "high"]);
export type KanbanTaskPriority = z.infer<typeof kanbanTaskPrioritySchema>;

export const kanbanTaskUserSchema = z.object({
  name: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().optional(),
  fallback: z.string().optional(),
});
export type KanbanTaskUser = z.infer<typeof kanbanTaskUserSchema>;

export const kanbanTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: kanbanTaskPrioritySchema,
  assignee: z.string().optional(),
  dueDate: z.string().optional(), // yyyy-mm-dd
  progress: z.number().int().min(0).max(100),
  attachments: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  users: z.array(kanbanTaskUserSchema),
});
export type KanbanTask = z.infer<typeof kanbanTaskSchema>;

export const kanbanColumnSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  position: z.number().int().min(0),
});
export type KanbanColumn = z.infer<typeof kanbanColumnSchema>;

export const kanbanBoardSchema = z.object({
  columns: z.array(kanbanColumnSchema),
  tasksByColumn: z.record(z.string(), z.array(kanbanTaskSchema)),
});
export type KanbanBoardData = z.infer<typeof kanbanBoardSchema>;

export const createKanbanColumnSchema = z.object({
  title: z.string().min(1).max(100),
});
export type CreateKanbanColumnInput = z.infer<typeof createKanbanColumnSchema>;

export const syncKanbanBoardSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      columnId: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
});
export type SyncKanbanBoardInput = z.infer<typeof syncKanbanBoardSchema>;


