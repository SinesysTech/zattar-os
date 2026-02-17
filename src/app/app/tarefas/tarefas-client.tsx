/**
 * Módulo de Tarefas - Visualização Lista
 *
 * A visualização em quadro/kanban vive nas sub-rotas:
 * /app/tarefas/quadro/[boardSlug] (expedientes, audiencias, pericias, obrigacoes)
 */

"use client";

import * as React from "react";
import type { TarefaDisplayItem, Quadro } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
    quadros: Quadro[];
}

export function TarefasClient({ data, quadros }: TarefasClientProps) {
    const { setTarefas, setQuadros, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
        setQuadros(quadros);
    }, [data, quadros, setTarefas, setQuadros]);

    return (
        <>
            <DataTable data={data} columns={columns} />
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
    );
}
