/**
 * Módulo de Tarefas - Visualização de Lista
 * 
 * Este módulo fornece uma visualização de lista/tabela para:
 * - Tarefas manuais criadas pelo usuário
 * - Eventos virtuais do sistema (audiências, expedientes, perícias, obrigações)
 * 
 * IMPORTANTE: Para visualização em quadro Kanban, use o módulo /kanban
 * 
 * Funcionalidades:
 * - Filtros por status, prioridade, tipo
 * - Ordenação por colunas
 * - Paginação
 * - Detalhes completos (subtarefas, comentários, anexos)
 * - Criação de tarefas manuais
 */

"use client";

import * as React from "react";
import { TarefaDisplayItem } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
}

export function TarefasClient({ data }: TarefasClientProps) {
    const { setTarefas, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
    }, [data, setTarefas]);

    return (
        <>
            <DataTable data={data} columns={columns} />
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
    );
}
