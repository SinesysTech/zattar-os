import type { EnumTodoPriority, EnumTodoStatus } from "./enum";

export type TodoPriority = `${EnumTodoPriority}`;
export type TodoStatus = `${EnumTodoStatus}`;
export type FilterTab = "all" | TodoStatus;
export type ViewMode = "list" | "grid";

export type TodoAssignee = {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string | null;
};

export type TodoComment = {
  id: string;
  body: string;
  createdAt: string; // timestamptz iso
};

export type TodoFile = {
  id: string;
  name: string;
  url: string; // v1: pode ser data-url/base64
  type?: string | null;
  size?: number | null;
  uploadedAt: string; // timestamptz iso
};

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
  position: number;
};

export type Todo = {
  id: string;
  title: string;
  description?: string;
  assignees: TodoAssignee[];
  assignedTo: string[]; // nomes derivados de assignees (compatibilidade com template)
  comments: TodoComment[];
  status: TodoStatus;
  priority: TodoPriority;
  createdAt: string; // timestamptz iso
  dueDate?: string | null; // yyyy-mm-dd
  reminderDate?: string | null; // timestamptz iso
  files: TodoFile[];
  subTasks: SubTask[];
  starred: boolean;
  position: number;
};

export interface TodoPosition {
  id: string;
  position: number;
}


