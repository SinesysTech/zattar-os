"use client";

import { create } from "zustand";
import type { FilterTab, Todo, TodoPriority, ViewMode } from "./types";

interface TodoStore {
  todos: Todo[];
  selectedTodoId: string | null;
  activeTab: FilterTab;
  isAddDialogOpen: boolean;
  isTodoSheetOpen: boolean;
  viewMode: ViewMode;
  filterUser: string[] | null;
  filterPriority: TodoPriority | null;
  showStarredOnly: boolean;
  searchQuery: string;

  setTodos: (todos: Todo[]) => void;
  upsertTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  setSelectedTodoId: (id: string | null) => void;
  setActiveTab: (tab: FilterTab) => void;
  setAddDialogOpen: (isOpen: boolean) => void;
  setTodoSheetOpen: (isOpen: boolean) => void;
  reorderTodosLocal: (todoPositions: { id: string; position: number }[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterUser: (users: string[] | null) => void;
  setFilterPriority: (priority: TodoPriority | null) => void;
  setSearchQuery: (query: string) => void;
  toggleShowStarredOnly: () => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  selectedTodoId: null,
  activeTab: "all",
  isAddDialogOpen: false,
  isTodoSheetOpen: false,
  viewMode: "list",
  filterUser: null,
  filterPriority: null,
  showStarredOnly: false,
  searchQuery: "",

  setTodos: (todos) => set(() => ({ todos })),

  upsertTodo: (todo) =>
    set((state) => ({
      todos: state.todos.some((t) => t.id === todo.id)
        ? state.todos.map((t) => (t.id === todo.id ? todo : t))
        : [...state.todos, todo].sort((a, b) => a.position - b.position),
    })),

  removeTodo: (id) => set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

  setSelectedTodoId: (id) => set(() => ({ selectedTodoId: id })),
  setActiveTab: (tab) => set(() => ({ activeTab: tab })),
  setAddDialogOpen: (isOpen) => set(() => ({ isAddDialogOpen: isOpen })),
  setTodoSheetOpen: (isOpen) => set(() => ({ isTodoSheetOpen: isOpen })),

  reorderTodosLocal: (todoPositions) =>
    set((state) => {
      const posById = new Map(todoPositions.map((p) => [p.id, p.position]));
      const next = state.todos.map((t) => (posById.has(t.id) ? { ...t, position: posById.get(t.id)! } : t));
      next.sort((a, b) => a.position - b.position);
      return { todos: next };
    }),

  setViewMode: (mode) => set(() => ({ viewMode: mode })),
  setFilterUser: (users) => set(() => ({ filterUser: users })),
  setFilterPriority: (priority) => set(() => ({ filterPriority: priority })),
  setSearchQuery: (query) => set(() => ({ searchQuery: query })),
  toggleShowStarredOnly: () => set((state) => ({ showStarredOnly: !state.showStarredOnly })),
}));


