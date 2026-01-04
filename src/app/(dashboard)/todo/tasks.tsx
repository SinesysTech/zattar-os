"use client";

import React from "react";
import { useTodoStore } from "./store";
import TodoList from "./components/todo-list";
import { AddTodoSheet } from "./components/add-todo-sheet";
import TodoDetailSheet from "./components/todo-detail-sheet";
import type { Todo } from "./types";

export default function Tasks({ todos: initialTodos }: { todos: Todo[] }) {
  const {
    setTodos,
    activeTab,
    isAddDialogOpen,
    setAddDialogOpen,
    isTodoSheetOpen,
    setTodoSheetOpen,
    selectedTodoId,
    setSelectedTodoId,
  } = useTodoStore();

  React.useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos, setTodos]);

  const [editTodoId, setEditTodoId] = React.useState<string | null>(null);

  const handleAddTodoClick = () => {
    setEditTodoId(null);
    setAddDialogOpen(true);
  };

  const handleEditTodoClick = (id: string) => {
    setEditTodoId(id);
    setAddDialogOpen(true);
  };

  const handleSelectTodo = (id: string) => {
    setSelectedTodoId(id);
    setTodoSheetOpen(true);
  };

  const handleCloseAddSheet = () => {
    setAddDialogOpen(false);
    setEditTodoId(null);
  };

  const handleCloseTodoSheet = () => {
    setTodoSheetOpen(false);
    setSelectedTodoId(null);
  };

  return (
    <div className="space-y-4 p-4">
      <TodoList
        activeTab={activeTab}
        onSelectTodo={handleSelectTodo}
        onAddTodoClick={handleAddTodoClick}
      />

      <AddTodoSheet
        isOpen={isAddDialogOpen}
        onClose={handleCloseAddSheet}
        editTodoId={editTodoId}
      />

      <TodoDetailSheet
        isOpen={isTodoSheetOpen}
        onClose={handleCloseTodoSheet}
        todoId={selectedTodoId}
        onEditClick={(id: string) => {
          handleCloseTodoSheet();
          handleEditTodoClick(id);
        }}
      />
    </div>
  );
}

