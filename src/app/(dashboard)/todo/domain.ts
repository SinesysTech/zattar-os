/**
 * TODO DOMAIN (template todo-list-app)
 *
 * Domínio alinhado ao template com persistência em Supabase.
 */

import { z } from "zod";
import { EnumTodoPriority, EnumTodoStatus } from "./enum";

export const todoStatusSchema = z.enum([
  EnumTodoStatus.Pending,
  EnumTodoStatus.InProgress,
  EnumTodoStatus.Completed,
]);
export type TodoStatus = z.infer<typeof todoStatusSchema>;

export const todoPrioritySchema = z.enum([
  EnumTodoPriority.Low,
  EnumTodoPriority.Medium,
  EnumTodoPriority.High,
]);
export type TodoPriority = z.infer<typeof todoPrioritySchema>;

export const todoAssigneeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional().nullable(),
});
export type TodoAssignee = z.infer<typeof todoAssigneeSchema>;

export const todoSubTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean(),
  position: z.number().int().min(0),
});
export type TodoSubTask = z.infer<typeof todoSubTaskSchema>;

export const todoCommentSchema = z.object({
  id: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});
export type TodoComment = z.infer<typeof todoCommentSchema>;

export const todoFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional().nullable(),
  size: z.number().int().optional().nullable(),
  uploadedAt: z.string().min(1),
});
export type TodoFile = z.infer<typeof todoFileSchema>;

export const todoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: todoStatusSchema,
  priority: todoPrioritySchema,
  dueDate: z.string().optional().nullable(), // yyyy-mm-dd
  reminderDate: z.string().optional().nullable(), // timestamptz iso
  starred: z.boolean(),
  position: z.number().int().min(0),
  createdAt: z.string().min(1),
  assignees: z.array(todoAssigneeSchema),
  assignedTo: z.array(z.string()),
  subTasks: z.array(todoSubTaskSchema),
  comments: z.array(todoCommentSchema),
  files: z.array(todoFileSchema),
});
export type Todo = z.infer<typeof todoSchema>;

// =============================================================================
// INPUTS (ACTIONS)
// =============================================================================

export const listTodosSchema = z.object({});
export type ListTodosInput = z.infer<typeof listTodosSchema>;

export const todoIdSchema = z.object({
  id: z.string().min(1),
});

export const todoPositionsSchema = z.object({
  positions: z
    .array(
      z.object({
        id: z.string().min(1),
        position: z.number().int().min(0),
      })
    )
    .min(1),
});
export type TodoPositionsInput = z.infer<typeof todoPositionsSchema>;

export const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  assigneeUserIds: z.array(z.number().int().positive()).min(1),
  status: todoStatusSchema,
  priority: todoPrioritySchema,
  dueDate: z.string().optional().nullable(), // yyyy-mm-dd
  reminderDate: z.string().optional().nullable(), // timestamptz iso
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  assigneeUserIds: z.array(z.number().int().positive()).min(1).optional(),
  status: todoStatusSchema.optional(),
  priority: todoPrioritySchema.optional(),
  dueDate: z.string().optional().nullable(), // yyyy-mm-dd
  reminderDate: z.string().optional().nullable(), // timestamptz iso
  starred: z.boolean().optional(),
});
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export const createSubTaskSchema = z.object({
  todoId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
});
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;

export const updateSubTaskSchema = z.object({
  todoId: z.string().min(1),
  subTaskId: z.string().min(1),
  completed: z.boolean(),
});
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

export const deleteSubTaskSchema = z.object({
  todoId: z.string().min(1),
  subTaskId: z.string().min(1),
});
export type DeleteSubTaskInput = z.infer<typeof deleteSubTaskSchema>;

export const addCommentSchema = z.object({
  todoId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const deleteCommentSchema = z.object({
  todoId: z.string().min(1),
  commentId: z.string().min(1),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;

export const addFileSchema = z.object({
  todoId: z.string().min(1),
  name: z.string().trim().min(1).max(512),
  url: z.string().min(1),
  type: z.string().optional().nullable(),
  size: z.number().int().optional().nullable(),
});
export type AddFileInput = z.infer<typeof addFileSchema>;

export const removeFileSchema = z.object({
  todoId: z.string().min(1),
  fileId: z.string().min(1),
});
export type RemoveFileInput = z.infer<typeof removeFileSchema>;


