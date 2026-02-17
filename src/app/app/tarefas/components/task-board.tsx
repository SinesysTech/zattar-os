"use client";

/**
 * TaskBoard - Visualização em Quadro Kanban para Tarefas
 * 
 * Adaptado de src/features/kanban/components/custom-board-view.tsx
 * Usa o domain unificado de Tarefas (TarefaDisplayItem, Quadro)
 * 
 * Funcionalidades:
 * - Drag-and-drop entre colunas (muda status)
 * - Drag-and-drop dentro da coluna (reordena)
 * - Eventos virtuais não são arrastáveis
 */

import * as React from "react";
import {
  GripVertical,
  Paperclip,
  MessageSquare,
  PlusCircleIcon,
  MoreHorizontal,
  Trash2,
  Plus,
  List,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AppBadge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import * as Kanban from "@/components/ui/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DialogFormShell } from "@/components/shared/dialog-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { TarefaDisplayItem, TaskStatus, TaskPriority, Quadro } from "../domain";
import { useTarefaStore } from "../store";
import { TaskCard } from "./task-card";
import { QuadroSelector } from "./quadro-selector";
import { ViewModePopover } from "@/components/shared";
import { actionReordenarTarefas } from "../actions/tarefas-actions";
import { toast } from "sonner";

// Status columns for Kanban board
const STATUS_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "canceled", label: "Canceled" },
];

interface TaskBoardProps {
  quadros: Quadro[];
}

// Droppable Column Component
interface DroppableColumnProps {
  status: TaskStatus;
  label: string;
  tasks: TarefaDisplayItem[];
  onCardClick: (id: string) => void;
}

function DroppableColumn({ status, label, tasks, onCardClick }: DroppableColumnProps) {
  const { setNodeRef } = useSortable({
    id: `column-${status}`,
    data: {
      type: "column",
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-[340px] min-w-[340px] rounded-xl border border-border bg-card p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <AppBadge variant="outline">{tasks.length}</AppBadge>
        </div>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.length > 0 ? (
          <div className="flex flex-col gap-2 p-0.5">
            {tasks.map((tarefa) => (
              <DraggableTaskCard
                key={tarefa.id}
                tarefa={tarefa}
                onClick={() => onCardClick(tarefa.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-4 pt-4">
            <div className="text-muted-foreground text-sm text-center">
              Nenhuma tarefa aqui.
            </div>
          </div>
        )}
      </SortableContext>
    </div>
  );
}

// Draggable Task Card Component
interface DraggableTaskCardProps {
  tarefa: TarefaDisplayItem;
  onClick: () => void;
}

function DraggableTaskCard({ tarefa, onClick }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarefa.id,
    disabled: tarefa.isVirtual, // Virtual events are not draggable
    data: {
      type: "task",
      tarefa,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard tarefa={tarefa} onClick={onClick} />
    </div>
  );
}


export function TaskBoard({ quadros }: TaskBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState(false);

  const {
    tarefas,
    selectedQuadroId,
    setSelectedQuadroId,
    setSelectedTarefaId,
    setTarefaSheetOpen,
    setCreateDialogOpen,
    viewMode,
    setViewMode,
  } = useTarefaStore();

  // Filter tasks by selected board
  const tarefasFiltradas = React.useMemo(() => {
    if (!selectedQuadroId) {
      // Sistema (all tasks + virtual events)
      return tarefas;
    }
    // Custom board (only manual tasks associated with this board)
    return tarefas.filter((t) => t.quadroId === selectedQuadroId && !t.isVirtual);
  }, [tarefas, selectedQuadroId]);

  // Group tasks by status
  const tarefasByStatus = React.useMemo(() => {
    const grouped: Record<TaskStatus, TarefaDisplayItem[]> = {
      backlog: [],
      todo: [],
      "in progress": [],
      done: [],
      canceled: [],
    };

    for (const tarefa of tarefasFiltradas) {
      grouped[tarefa.status].push(tarefa);
    }

    // Sort by position within each column
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    return grouped;
  }, [tarefasFiltradas]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCardClick = (id: string) => {
    setSelectedTarefaId(id);
    setTarefaSheetOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const activeTask = tarefasFiltradas.find((t) => t.id === activeId);
    if (!activeTask || activeTask.isVirtual) {
      // Don't allow dragging virtual events
      return;
    }

    // Determine if we're dropping on a column or a task
    const overStatus = overId.startsWith("column-")
      ? (overId.replace("column-", "") as TaskStatus)
      : tarefasFiltradas.find((t) => t.id === overId)?.status;

    if (!overStatus) return;

    const activeStatus = activeTask.status;

    // If moving to a different column
    if (activeStatus !== overStatus) {
      const targetTasks = tarefasByStatus[overStatus];
      const newPosition = targetTasks.length;

      setIsReordering(true);
      startTransition(async () => {
        const result = await actionReordenarTarefas({
          tarefaId: activeId,
          novaPosicao: newPosition,
          novoStatus: overStatus,
          quadroId: activeTask.quadroId,
        });

        if (result.success) {
          toast.success("Tarefa movida com sucesso");
          router.refresh();
        } else {
          toast.error(result.error || "Erro ao mover tarefa");
        }
        setIsReordering(false);
      });
    } else {
      // Reordering within the same column
      const tasks = tarefasByStatus[activeStatus];
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        setIsReordering(true);
        startTransition(async () => {
          const result = await actionReordenarTarefas({
            tarefaId: activeId,
            novaPosicao: newIndex,
            quadroId: activeTask.quadroId,
          });

          if (result.success) {
            toast.success("Tarefa reordenada com sucesso");
            router.refresh();
          } else {
            toast.error(result.error || "Erro ao reordenar tarefa");
          }
          setIsReordering(false);
        });
      }
    }
  };

  const activeTarefa = activeId
    ? tarefasFiltradas.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QuadroSelector
              quadros={quadros}
              value={selectedQuadroId}
              onValueChange={setSelectedQuadroId}
            />
          </div>

          <div className="flex items-center gap-2">
            <ViewModePopover
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "lista" | "quadro")}
              options={[
                { value: 'lista', label: 'Lista', icon: List },
                { value: 'quadro', label: 'Quadro', icon: LayoutGrid },
              ]}
            />
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={isPending || isReordering}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Nova Tarefa</span>
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex w-full gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => {
            const tasks = tarefasByStatus[column.value] ?? [];
            return (
              <DroppableColumn
                key={column.value}
                status={column.value}
                label={column.label}
                tasks={tasks}
                onCardClick={handleCardClick}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTarefa ? (
          <div className="opacity-50">
            <TaskCard tarefa={activeTarefa} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
