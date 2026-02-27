"use client";

import { useState, useCallback, useMemo } from "react";
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  KANBAN_COLUMNS,
  type StatusTarefa,
  type Tarefa,
} from "../lib/domain";
import { actionReordenarKanban } from "../lib/actions";

type ColumnMap = Record<StatusTarefa, Tarefa[]>;

function buildColumns(tarefas: Tarefa[]): ColumnMap {
  const columns = {} as ColumnMap;
  for (const status of KANBAN_COLUMNS) {
    columns[status] = [];
  }
  for (const tarefa of tarefas) {
    if (columns[tarefa.status]) {
      columns[tarefa.status].push(tarefa);
    }
  }
  // Sort each column by ordemKanban
  for (const status of KANBAN_COLUMNS) {
    columns[status].sort((a, b) => a.ordemKanban - b.ordemKanban);
  }
  return columns;
}

function findColumnOfTask(
  columns: ColumnMap,
  taskId: string
): StatusTarefa | null {
  for (const status of KANBAN_COLUMNS) {
    if (columns[status].some((t) => t.id === taskId)) {
      return status;
    }
  }
  return null;
}

export function useTaskBoard(initialTarefas: Tarefa[]) {
  const [columns, setColumns] = useState<ColumnMap>(() =>
    buildColumns(initialTarefas)
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeTarefa = useMemo(() => {
    if (!activeId) return null;
    for (const status of KANBAN_COLUMNS) {
      const found = columns[status].find((t) => t.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeColumn = findColumnOfTask(columns, activeIdStr);
    // over can be a task id or a column id (status)
    let overColumn = findColumnOfTask(columns, overIdStr);
    if (!overColumn && KANBAN_COLUMNS.includes(overIdStr as StatusTarefa)) {
      overColumn = overIdStr as StatusTarefa;
    }

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setColumns((prev) => {
      const activeItems = [...prev[activeColumn]];
      const overItems = [...prev[overColumn]];

      const activeIndex = activeItems.findIndex((t) => t.id === activeIdStr);
      if (activeIndex === -1) return prev;

      const [movedTask] = activeItems.splice(activeIndex, 1);
      const updatedTask = { ...movedTask, status: overColumn };

      const overIndex = overItems.findIndex((t) => t.id === overIdStr);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, updatedTask);
      } else {
        overItems.push(updatedTask);
      }

      return {
        ...prev,
        [activeColumn]: activeItems,
        [overColumn]: overItems,
      };
    });
  }, [columns]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      const activeColumn = findColumnOfTask(columns, activeIdStr);
      let overColumn = findColumnOfTask(columns, overIdStr);
      if (!overColumn && KANBAN_COLUMNS.includes(overIdStr as StatusTarefa)) {
        overColumn = overIdStr as StatusTarefa;
      }

      if (!activeColumn || !overColumn) return;

      if (activeColumn === overColumn) {
        // Reorder within same column
        const items = columns[activeColumn];
        const oldIndex = items.findIndex((t) => t.id === activeIdStr);
        const newIndex = items.findIndex((t) => t.id === overIdStr);

        if (oldIndex !== newIndex && newIndex >= 0) {
          setColumns((prev) => ({
            ...prev,
            [activeColumn]: arrayMove(prev[activeColumn], oldIndex, newIndex),
          }));
        }
      }

      // Persist all positions
      const updates = KANBAN_COLUMNS.flatMap((status) =>
        columns[status].map((tarefa, index) => ({
          tarefaId: tarefa.id,
          status,
          ordemKanban: index,
        }))
      );

      actionReordenarKanban(updates);
    },
    [columns]
  );

  return {
    columns,
    activeId,
    activeTarefa,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
