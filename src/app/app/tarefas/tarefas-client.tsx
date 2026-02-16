"use client";

import * as React from "react";
import { TarefaDisplayItem } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { TaskBoard } from "./components/task-board";
import { columns } from "./components/columns";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
}

export function TarefasClient({ data }: TarefasClientProps) {
    const { viewMode, setTarefas, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
    }, [data, setTarefas]);

    return (
        <div className="flex flex-col h-full gap-4">
            {viewMode === "lista" ? (
                <DataTable data={data} columns={columns} />
            ) : (
                <>
                    {/* We might need a custom toolbar for the Board view if we don't reuse DataTable's */}
                    {/* For now, let's keep it simple and just show the board */}
                    {/* Actually, I should probably put the toolbar in this client component for consistency */}
                    <TaskBoard />
                </>
            )}

            {/* These are global to the module */}
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
