"use client";

import * as React from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useTarefaStore } from "../store";
import { TarefaDisplayItem, TaskStatus } from "../domain";
import { statuses } from "../data/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/app/app/tarefas/components/task-card";
import * as actions from "../actions/tarefas-actions";
import { toast } from "sonner";

export function TaskBoard() {
    const { tarefas, upsertTarefa, setTarefas } = useTarefaStore();
    const [activeTarefa, setActiveTarefa] = React.useState<TarefaDisplayItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const columns = statuses.map(s => ({
        id: s.value as TaskStatus,
        title: s.label,
        icon: s.icon
    }));

    const tarefasByStatus = React.useMemo(() => {
        const map: Record<TaskStatus, TarefaDisplayItem[]> = {
            backlog: [],
            todo: [],
            "in progress": [],
            done: [],
            canceled: []
        };
        tarefas.forEach(t => {
            if (map[t.status]) map[t.status].push(t);
        });
        // Sort each column by position
        Object.keys(map).forEach(key => {
            map[key as TaskStatus].sort((a, b) => a.position - b.position);
        });
        return map;
    }, [tarefas]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const tarefa = tarefas.find(t => t.id === active.id);
        if (tarefa) setActiveTarefa(tarefa);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Handle moving between columns
        const activeTarefa = tarefas.find(t => t.id === activeId);
        if (!activeTarefa || activeTarefa.isVirtual) return;

        // Check if over is a column or a task
        const isOverAColumn = columns.some(c => c.id === overId);
        let newStatus: TaskStatus | undefined;

        if (isOverAColumn) {
            newStatus = overId as TaskStatus;
        } else {
            const overTarefa = tarefas.find(t => t.id === overId);
            if (overTarefa) newStatus = overTarefa.status;
        }

        if (newStatus && activeTarefa.status !== newStatus) {
            // Update local state for immediate feedback
            upsertTarefa({ ...activeTarefa, status: newStatus });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTarefa(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeIdx = tarefas.findIndex(t => t.id === activeId);
        const overIdx = tarefas.findIndex(t => t.id === overId);

        if (activeIdx === -1) return;

        const activeTarefa = tarefas[activeIdx];
        if (activeTarefa.isVirtual) return;

        // Persist status change if it happened in dragOver
        // Actually handleDragEnd handles reordering within the final column

        // Reorder within the same status
        const currentStatusTarefas = tarefasByStatus[activeTarefa.status];
        const oldPos = currentStatusTarefas.findIndex(t => t.id === activeId);
        const newPos = currentStatusTarefas.findIndex(t => t.id === overId);

        if (oldPos !== -1 && newPos !== -1 && oldPos !== newPos) {
            const moved = arrayMove(currentStatusTarefas, oldPos, newPos);
            const positions = moved.map((t, i) => ({ id: t.id, position: i }));

            // Local update
            const updatedTarefas = tarefas.map(t => {
                const p = positions.find(pos => pos.id === t.id);
                return p ? { ...t, position: p.position } : t;
            });
            setTarefas(updatedTarefas);

            // Persist reorder
            try {
                await actions.actionReordenarTarefas({ positions });
            } catch (e) {
                toast.error("Erro ao reordenar tarefas");
            }
        }

        // Always persist status change to server
        try {
            await actions.actionAtualizarTarefa({
                id: activeTarefa.id as string,
                status: activeTarefa.status
            });
        } catch (e) {
            toast.error("Erro ao atualizar status da tarefa");
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {columns.map(column => (
                    <div key={column.id} className="flex min-w-[300px] flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                {column.icon && <column.icon className="h-4 w-4 text-muted-foreground" />}
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                    {column.title}
                                </h3>
                                <Badge variant="secondary" className="ml-1">
                                    {tarefasByStatus[column.id].length}
                                </Badge>
                            </div>
                        </div>

                        <SortableContext
                            id={column.id}
                            items={tarefasByStatus[column.id].map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-1 flex-col gap-3 rounded-lg border bg-muted/30 p-2 min-h-[500px]">
                                {tarefasByStatus[column.id].map(tarefa => (
                                    <TaskCard key={tarefa.id} tarefa={tarefa} />
                                ))}
                            </div>
                        </SortableContext>
                    </div>
                ))}
            </div>

            <DragOverlay>
                {activeTarefa ? (
                    <TaskCard tarefa={activeTarefa} isDragging />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
