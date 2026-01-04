"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { FilterTab, Todo, TodoStatus } from "../types";

import { Button } from "@/components/ui/button";
import { Plus, X, Search, SlidersHorizontal, GridIcon, ListIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import TodoItem from "./todo-item";
import { useTodoStore } from "../store";
import StatusTabs from "./status-tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { priorityDotColors, EnumTodoPriority } from "../enum";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { actionAtualizarTodo, actionReordenarTodos } from "../actions/todo-actions";

interface TodoListProps {
  activeTab: FilterTab;
  onSelectTodo: (id: string) => void;
  onAddTodoClick: () => void;
}

export default function TodoList({ activeTab, onSelectTodo, onAddTodoClick }: TodoListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const {
    todos,
    upsertTodo,
    reorderTodosLocal,
    viewMode,
    setViewMode,
    filterUser,
    setFilterUser,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    showStarredOnly,
    toggleShowStarredOnly,
    setActiveTab,
  } = useTodoStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
  };

  // Get unique users for the filter dropdown (using assignees names)
  const uniqueUsers = Array.from(
    new Set(
      todos.flatMap((todo: Todo) => todo.assignees.map((a) => a.name)).filter(Boolean)
    )
  );

  // Apply all filters
  const filteredTodos = todos.filter((todo: Todo) => {
    // Tab filter
    if (activeTab !== "all") {
      if (todo.status !== activeTab) return false;
    }

    // User filter
    if (filterUser && filterUser.length > 0) {
      const todoUserNames = todo.assignees.map((a) => a.name);
      if (!filterUser.some((user: string) => todoUserNames.includes(user))) return false;
    }

    // Priority filter
    if (filterPriority && todo.priority !== filterPriority) return false;

    // Starred filter
    if (showStarredOnly && !todo.starred) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const todoUserNames = todo.assignees.map((a) => a.name).join(" ").toLowerCase();
      return (
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query) ||
        todoUserNames.includes(query)
      );
    }

    return true;
  });

  const handleStatusChange = async (id: string, status: TodoStatus) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const result = await actionAtualizarTodo({
        id,
        status,
      });

      if (result.success) {
        upsertTodo(result.data as Todo);
        toast.success(`Status da tarefa alterado para ${status.replace("-", " ")}`);
      } else {
        toast.error(result.error || "Erro ao alterar status");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status da tarefa");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = filteredTodos.findIndex((item: Todo) => item.id === active.id);
    const newIndex = filteredTodos.findIndex((item: Todo) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null);
      return;
    }

    const newItems = arrayMove(filteredTodos, oldIndex, newIndex);

    // Update local state immediately for better UX
    const positions = newItems.map((item: Todo, index: number) => ({
      id: item.id,
      position: index,
    }));

    reorderTodosLocal(positions);
    setActiveId(null);

    // Persist to server
    try {
      const result = await actionReordenarTodos({
        positions,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao reordenar tarefas");
        // Optionally revert local state on error - would need to reload todos
      } else {
        toast.success("Tarefas reordenadas com sucesso");
      }
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      toast.error("Erro ao reordenar tarefas");
      // Optionally revert local state on error - would need to reload todos
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null);
  };

  const handleUserFilterChange = (user: string, checked: boolean) => {
    if (!filterUser) {
      setFilterUser(checked ? [user] : null);
    } else {
      const newUsers = checked
        ? [...filterUser, user]
        : filterUser.filter((u: string) => u !== user);

      setFilterUser(newUsers.length > 0 ? newUsers : null);
    }
  };

  const clearFilters = () => {
    setFilterUser(null);
    setFilterPriority(null);
    setSearchQuery("");
    if (showStarredOnly) {
      toggleShowStarredOnly();
    }
  };

  const handleStarToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const result = await actionAtualizarTodo({
        id,
        starred: !todo.starred,
      });

      if (result.success) {
        upsertTodo(result.data as Todo);
        toast.success(
          result.data.starred ? "Tarefa marcada como favorita" : "Favorito removido"
        );
      } else {
        toast.error(result.error || "Erro ao atualizar favorito");
      }
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
      toast.error("Erro ao atualizar favorito");
    }
  };

  const renderFilterContent = () => (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Usuários Atribuídos</h4>
        <div className="flex flex-wrap gap-2">
          {uniqueUsers.map((user: string) => (
            <Toggle
              key={user}
              variant="outline"
              size="sm"
              pressed={filterUser?.includes(user) || false}
              onPressedChange={(pressed) => handleUserFilterChange(user, pressed)}
              className="px-3 text-xs"
            >
              {user}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="starred"
          checked={showStarredOnly}
          onCheckedChange={toggleShowStarredOnly}
        />
        <Label htmlFor="starred">Mostrar apenas favoritos</Label>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Prioridade</h4>
        <div className="flex gap-2 *:grow">
          {Object.values(EnumTodoPriority).map((priority: EnumTodoPriority) => (
            <Toggle
              key={priority}
              variant="outline"
              size="sm"
              pressed={filterPriority === priority}
              onPressedChange={() => setFilterPriority(priority)}
              className="px-3 text-xs capitalize"
            >
              <span className={cn("size-2 rounded-full", priorityDotColors[priority])}></span>
              {priority}
            </Toggle>
          ))}
        </div>

        {(filterUser || filterPriority || showStarredOnly) && (
          <div className="text-end">
            <Button variant="link" size="sm" className="px-0!" onClick={clearFilters}>
              Limpar Filtros
              <X />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const items = filteredTodos.map((v: Todo) => v.id);

  const renderTodoItems = () => {
    if (viewMode === "grid") {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTodos.map((todo: Todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onClick={() => onSelectTodo(todo.id)}
                  onStatusChange={handleStatusChange}
                  viewMode="grid"
                  onStarToggle={handleStarToggle}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <TodoItem
                todo={filteredTodos.find((t: Todo) => t.id === activeId) as Todo}
                viewMode="grid"
                isDraggingOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      );
    }

    // List view with drag and drop
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 space-y-4">
            {filteredTodos.map((todo: Todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onClick={() => onSelectTodo(todo.id)}
                onStatusChange={handleStatusChange}
                viewMode="list"
                onStarToggle={handleStarToggle}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <TodoItem
              todo={filteredTodos.find((t: Todo) => t.id === activeId) as Todo}
              viewMode="list"
              isDraggingOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <StatusTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex w-full items-center gap-2 lg:w-auto">
          {/* Search input */}
          <div className="relative w-auto">
            <Search className="absolute top-2.5 left-3 size-4 opacity-50" />
            <Input
              placeholder="Buscar tarefas..."
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="relative">
                <SlidersHorizontal />
                {(filterUser || filterPriority || showStarredOnly) && (
                  <Badge
                    variant="secondary"
                    className="absolute -end-1.5 -top-1.5 size-4 rounded-full p-0"
                  >
                    {(filterUser ? 1 : 0) + (filterPriority ? 1 : 0) + (showStarredOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              {renderFilterContent()}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            variant="outline"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "list" | "grid")}
          >
            <ToggleGroupItem value="list" aria-label="Visualização em lista">
              <ListIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Visualização em grade">
              <GridIcon />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Add button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={onAddTodoClick}
                  className="fixed end-6 bottom-6 z-10 rounded-full! md:size-14"
                >
                  <Plus className="md:size-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Adicionar To-Do</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center py-12 text-center">
          <h3 className="text-xl font-medium">Nenhuma tarefa encontrada</h3>
          <p className="text-muted-foreground mt-2">Adicione uma nova tarefa para começar</p>
        </div>
      ) : (
        renderTodoItems()
      )}
    </>
  );
}

