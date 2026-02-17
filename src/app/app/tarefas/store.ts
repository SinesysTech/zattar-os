"use client";

import { create } from "zustand";
import type { TarefaDisplayItem, Quadro } from "./domain";

interface TarefaStore {
    // Visualização
    viewMode: "lista" | "quadro";
    setViewMode: (mode: "lista" | "quadro") => void;

    // Quadros
    quadros: Quadro[];
    selectedQuadroId: string | null; // null = Sistema (todas as tarefas)
    setQuadros: (quadros: Quadro[]) => void;
    setSelectedQuadroId: (id: string | null) => void;

    // Tarefas
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
    // Visualização
    viewMode: "lista",
    setViewMode: (mode) => set(() => ({ viewMode: mode })),

    // Quadros
    quadros: [],
    selectedQuadroId: null,
    setQuadros: (quadros) => set(() => ({ quadros })),
    setSelectedQuadroId: (id) => set(() => ({ selectedQuadroId: id })),

    // Tarefas
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
