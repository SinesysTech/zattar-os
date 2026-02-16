"use client";

import * as React from "react";
import { TarefaDisplayItem } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { TaskBoard } from "./components/task-board";
import { columns } from "./components/columns";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";
import { DataTableToolbar } from "@/components/shared/data-shell";
import { ViewModePopover, type ViewModeOption } from "@/components/shared";
import { List, LayoutGrid } from "lucide-react";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
}

// Opções de visualização para tarefas
const TASK_VIEW_OPTIONS: ViewModeOption[] = [
  { value: 'lista' as any, label: 'Lista', icon: List },
  { value: 'quadro' as any, label: 'Quadro', icon: LayoutGrid }
];

export function TarefasClient({ data }: TarefasClientProps) {
    const { viewMode, setTarefas, isCreateDialogOpen, setCreateDialogOpen, setViewMode } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
    }, [data, setTarefas]);

    return (
        <div className="flex flex-col h-full space-y-4">
            {viewMode === "lista" ? (
                <DataTable data={data} columns={columns} />
            ) : (
                <>
                    {/* Toolbar para visualização em quadro */}
                    <DataTableToolbar
                        title="Tarefas"
                        actionButton={{
                            label: "Nova tarefa",
                            onClick: () => setCreateDialogOpen(true),
                        }}
                        viewModeSlot={
                            <ViewModePopover
                                value={viewMode as any}
                                onValueChange={(v) => setViewMode(v as any)}
                                options={TASK_VIEW_OPTIONS}
                                className="hidden lg:flex"
                            />
                        }
                    />
                    <TaskBoard />
                </>
            )}

            {/* Dialogs globais do módulo */}
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
