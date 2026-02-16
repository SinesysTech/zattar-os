"use client";

import { create } from "zustand";
import type { TarefaDisplayItem } from "./domain";

interface TarefaStore {
    tarefas: TarefaDisplayItem[];
    selectedTarefaId: string | null;
    isTarefaSheetOpen: boolean;
    isCreateDialogOpen: boolean;

    setTarefas: (tarefas: TarefaDisplayItem[]) => void;
    upsertTarefa: (tarefa: TarefaDisplayItem) => void;
    removeTarefa: (id: string) => void;
    setSelectedTarefaId: (id: string | null) => void;
    setTarefaSheetOpen: (isOpen: boolean) => void;
    setCreateDialogOpen: (isOpen: boolean) => void;
}

export const useTarefaStore = create<TarefaStore>((set) => ({
    tarefas: [],
    selectedTarefaId: null,
    isTarefaSheetOpen: false,
    isCreateDialogOpen: false,

    setTarefas: (tarefas) => set(() => ({ tarefas })),

    upsertTarefa: (tarefa) =>
        set((state) => ({
            tarefas: state.tarefas.some((t) => t.id === tarefa.id)
                ? state.tarefas.map((t) => (t.id === tarefa.id ? tarefa : t))
                : [tarefa, ...state.tarefas],
        })),

    removeTarefa: (id) => set((state) => ({ tarefas: state.tarefas.filter((t) => t.id !== id) })),

    setSelectedTarefaId: (id) => set(() => ({ selectedTarefaId: id })),
    setTarefaSheetOpen: (isOpen) => set(() => ({ isTarefaSheetOpen: isOpen })),
    setCreateDialogOpen: (isOpen) => set(() => ({ isCreateDialogOpen: isOpen })),
}));
