/**
 * Tipos para o módulo de Tasks/Todos
 * Migrado de todo-list-app
 */

export type TodoStatus = 'todo' | 'in-progress' | 'done' | 'canceled';
export type FilterTab = 'all' | TodoStatus;
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  assignedTo: string[];
  starred?: boolean;
  subTasks?: Array<{ id: string; title: string; completed: boolean }>;
  files?: Array<{ id: string; name: string; url: string; size?: number; uploadedAt?: Date | string }>;
  comments?: Array<{ id: string; author: string; text: string; date: string; createdAt?: Date | string }>;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum EnumTodoStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  CANCELED = 'canceled',
}

export enum EnumTodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export const todoStatusNamed: Record<TodoStatus, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
  'canceled': 'Canceled',
};

export const priorityDotColors: Record<TodoPriority, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export const statusClasses: Record<TodoStatus, string> = {
  'todo': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'done': 'bg-green-100 text-green-800',
  'canceled': 'bg-red-100 text-red-800',
};

export const priorityClasses: Record<TodoPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

