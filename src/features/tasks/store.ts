/**
 * Store para gerenciamento de estado dos Todos
 * Migrado de todo-list-app
 */

import { create } from 'zustand';
import type { Todo, FilterTab, TodoPriority } from './types';

interface TodoStore {
  todos: Todo[];
  activeTab: FilterTab;
  viewMode: 'list' | 'grid';
  filterUser: string[];
  filterPriority: TodoPriority | null;
  searchQuery: string;
  showStarredOnly: boolean;
  
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  reorderTodos: (startIndex: number, endIndex: number) => void;
  setActiveTab: (tab: FilterTab) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setFilterUser: (users: string[]) => void;
  setFilterPriority: (priority: TodoPriority | null) => void;
  setSearchQuery: (query: string) => void;
  toggleStarred: (id: string) => void;
  toggleShowStarredOnly: () => void;
  addComment: (todoId: string, text: string) => void;
  deleteComment: (todoId: string, commentId: string) => void;
  addFile: (todoId: string, file: { id?: string; name: string; url: string; type?: string; size?: number; uploadedAt?: Date | string }) => void;
  removeFile: (todoId: string, fileId: string) => void;
  addSubTask: (todoId: string, title: string) => void;
  updateSubTask: (todoId: string, subTaskId: string, completed: boolean) => void;
  removeSubTask: (todoId: string, subTaskId: string) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  activeTab: 'all',
  viewMode: 'list',
  filterUser: [],
  filterPriority: null,
  searchQuery: '',
  showStarredOnly: false,
  
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  updateTodo: (id, updates) => set((state) => ({
    todos: state.todos.map((todo) => todo.id === id ? { ...todo, ...updates } : todo)
  })),
  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id)
  })),
  reorderTodos: (startIndex, endIndex) => set((state) => {
    const newTodos = [...state.todos];
    const [removed] = newTodos.splice(startIndex, 1);
    newTodos.splice(endIndex, 0, removed);
    return { todos: newTodos };
  }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterUser: (users) => set({ filterUser: users }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleStarred: (id) => set((state) => ({
    todos: state.todos.map((todo) => 
      todo.id === id ? { ...todo, starred: !todo.starred } : todo
    )
  })),
  toggleShowStarredOnly: () => set((state) => ({ showStarredOnly: !state.showStarredOnly })),
  addComment: (todoId, text) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const newComment = {
        id: crypto.randomUUID(),
        author: 'User', // TODO: Get from auth context
        text,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...todo,
        comments: [...(todo.comments || []), newComment],
      };
    }),
  })),
  deleteComment: (todoId, commentId) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      return {
        ...todo,
        comments: (todo.comments || []).filter((c) => c.id !== commentId),
      };
    }),
  })),
  addFile: (todoId, file) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const newFile = {
        id: file.id || crypto.randomUUID(),
        name: file.name,
        url: file.url,
        size: file.size,
        uploadedAt: file.uploadedAt || new Date().toISOString(),
      };
      return {
        ...todo,
        files: [...(todo.files || []), newFile],
      };
    }),
  })),
  removeFile: (todoId, fileId) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      return {
        ...todo,
        files: (todo.files || []).filter((f) => f.id !== fileId),
      };
    }),
  })),
  addSubTask: (todoId, title) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const newSubTask = {
        id: crypto.randomUUID(),
        title,
        completed: false,
      };
      return {
        ...todo,
        subTasks: [...(todo.subTasks || []), newSubTask],
      };
    }),
  })),
  updateSubTask: (todoId, subTaskId, completed) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      return {
        ...todo,
        subTasks: (todo.subTasks || []).map((st) =>
          st.id === subTaskId ? { ...st, completed } : st
        ),
      };
    }),
  })),
  removeSubTask: (todoId, subTaskId) => set((state) => ({
    todos: state.todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      return {
        ...todo,
        subTasks: (todo.subTasks || []).filter((st) => st.id !== subTaskId),
      };
    }),
  })),
}));

