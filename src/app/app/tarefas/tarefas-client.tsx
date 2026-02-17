/**
 * Módulo de Tarefas - Visualizações Lista e Quadro
 * 
 * Este módulo fornece duas visualizações alternáveis:
 * - Lista: Tabela com filtros, ordenação e paginação
 * - Quadro: Kanban com drag-and-drop e quadros personalizados
 * 
 * Funcionalidades:
 * - Tarefas manuais criadas pelo usuário
 * - Eventos virtuais do sistema (audiências, expedientes, perícias, obrigações)
 * - Alternância entre visualizações via ViewModePopover
 * - Quadros personalizados (apenas em modo quadro)
 * - Detalhes completos (subtarefas, comentários, anexos)
 */

"use client";

import * as React from "react";
import type { TarefaDisplayItem, Quadro } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { TaskBoard } from "./components/task-board";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
    quadros: Quadro[];
}

export function TarefasClient({ data, quadros }: TarefasClientProps) {
    const { viewMode, setTarefas, setQuadros, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
        setQuadros(quadros);
    }, [data, quadros, setTarefas, setQuadros]);

    return (
        <>
            {viewMode === "lista" ? (
                <DataTable data={data} columns={columns} />
            ) : (
                <TaskBoard quadros={quadros} />
            )}
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
    );
}
