/**
 * Barrel exports for Todo module
 */

// Types
export type {
  Todo,
  TodoAssignee,
  TodoComment,
  TodoFile,
  SubTask,
  TodoPriority,
  TodoStatus,
  FilterTab,
  ViewMode,
  TodoPosition,
} from "./types";

// Domain schemas and types
export type {
  CreateTodoInput,
  UpdateTodoInput,
  ListTodosInput,
  TodoPositionsInput,
  CreateSubTaskInput,
  UpdateSubTaskInput,
  DeleteSubTaskInput,
  AddCommentInput,
  DeleteCommentInput,
  AddFileInput,
  RemoveFileInput,
} from "./domain";

// Enums
export { EnumTodoPriority, EnumTodoStatus } from "./enum";

// Components
export { default as TodoList } from "./components/todo-list";
export { default as StatusTabs } from "./components/status-tabs";
export { default as TodoItem } from "./components/todo-item";
export { default as TodoDetailSheet } from "./components/todo-detail-sheet";
export { AddTodoSheet } from "./components/add-todo-sheet";
export { UserSelector } from "./components/user-selector";

// Actions
export {
  actionListarTodos,
  actionBuscarTodo,
  actionCriarTodo,
  actionAtualizarTodo,
  actionRemoverTodo,
  actionReordenarTodos,
  actionCriarSubtarefa,
  actionAtualizarSubtarefa,
  actionRemoverSubtarefa,
  actionAdicionarComentario,
  actionRemoverComentario,
  actionAdicionarAnexo,
  actionRemoverAnexo,
  actionListarUsuariosParaAtribuicao,
} from "./actions/todo-actions";

// Store
export { useTodoStore } from "./store";

// Schemas
export { todoFormSchema } from "./schemas";
export type { TodoFormValues } from "./schemas";

