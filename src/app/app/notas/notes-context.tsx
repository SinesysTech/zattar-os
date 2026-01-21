"use client";

import * as React from "react";
import type { Note, NoteLabel, NotasPayload } from "./domain";
import {
  actionArquivarNota,
  actionAtualizarEtiqueta,
  actionAtualizarNota,
  actionCriarEtiqueta,
  actionCriarNota,
  actionExcluirEtiqueta,
  actionExcluirNota,
} from "./actions/notas-actions";

type NotesContextValue = {
  notes: Note[];
  labels: NoteLabel[];
  mode: "notas" | "arquivadas";
  setMode: (mode: "notas" | "arquivadas") => void;
  createNote: (input: {
    title: string;
    content?: string;
    labels?: NoteLabel[];
    imageDataUrl?: string | null;
  }) => Promise<void>;
  updateNote: (
    id: number,
    patch: {
      title?: string;
      content?: string;
      labels?: NoteLabel[];
      imageDataUrl?: string | null;
      type?: Note["type"];
    }
  ) => Promise<void>;
  createLabel: (input: { title: string; color: string }) => Promise<void>;
  updateLabel: (id: number, patch: { title?: string; color?: string }) => Promise<void>;
  deleteLabel: (id: number) => Promise<void>;
  archiveNote: (id: number, isArchived: boolean) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
};

const NotesContext = React.createContext<NotesContextValue | null>(null);

export function NotesProvider({
  initialData,
  children,
}: {
  initialData: NotasPayload;
  children: React.ReactNode;
}) {
  const [notes, setNotes] = React.useState<Note[]>(initialData.notes);
  const [labels, setLabels] = React.useState<NoteLabel[]>(initialData.labels);
  const [mode, setMode] = React.useState<"notas" | "arquivadas">("notas");

  const createNote = React.useCallback(
    async (input: { title: string; content?: string; labels?: NoteLabel[]; imageDataUrl?: string | null }) => {
      console.log("[NotesContext] createNote chamado com:", input);
      const labelIds = (input.labels ?? []).map((l) => l.id);

      const payload = {
        title: input.title,
        content: input.content,
        type: (input.imageDataUrl ? "image" : "text") as "text" | "image" | "checklist",
        image: input.imageDataUrl ?? undefined,
        labels: labelIds,
        isArchived: false,
      };

      console.log("[NotesContext] Chamando actionCriarNota com payload:", payload);
      const result = await actionCriarNota(payload);
      console.log("[NotesContext] Resultado de actionCriarNota:", result);

      if (!result.success) {
        console.error("[NotesContext] Erro ao criar nota:", result);
        throw new Error(result.message || result.error || "Falha ao criar nota.");
      }

      console.log("[NotesContext] Atualizando estado local com nova nota:", result.data);
      setNotes((prev) => [result.data, ...prev]);
    },
    []
  );

  const updateNote = React.useCallback(
    async (
      id: number,
      patch: { title?: string; content?: string; labels?: NoteLabel[]; imageDataUrl?: string | null; type?: Note["type"] }
    ) => {
      const labelIds = patch.labels ? patch.labels.map((l) => l.id) : undefined;
      const result = await actionAtualizarNota({
        id,
        title: patch.title,
        content: patch.content,
        type: patch.type,
        image: patch.imageDataUrl ?? undefined,
        labels: labelIds,
      });

      if (!result.success) {
        throw new Error(result.message || result.error || "Falha ao atualizar nota.");
      }

      setNotes((prev) => prev.map((n) => (n.id === id ? result.data : n)));
    },
    []
  );

  const createLabel = React.useCallback(async (input: { title: string; color: string }) => {
    const result = await actionCriarEtiqueta(input);
    if (!result.success) {
      throw new Error(result.message || result.error || "Falha ao criar etiqueta.");
    }
    setLabels((prev) => [...prev, result.data].sort((a, b) => a.title.localeCompare(b.title)));
  }, []);

  const updateLabel = React.useCallback(async (id: number, patch: { title?: string; color?: string }) => {
    const result = await actionAtualizarEtiqueta({ id, ...patch });
    if (!result.success) {
      throw new Error(result.message || result.error || "Falha ao atualizar etiqueta.");
    }
    setLabels((prev) =>
      prev
        .map((l) => (l.id === id ? result.data : l))
        .sort((a, b) => a.title.localeCompare(b.title))
    );
  }, []);

  const deleteLabel = React.useCallback(async (id: number) => {
    const result = await actionExcluirEtiqueta({ id });
    if (!result.success) {
      throw new Error(result.message || result.error || "Falha ao excluir etiqueta.");
    }
    setLabels((prev) => prev.filter((l) => l.id !== id));
    // remover referência local das notas
    setNotes((prev) => prev.map((n) => ({ ...n, labels: n.labels.filter((lid) => lid !== id) })));
  }, []);

  const archiveNote = React.useCallback(async (id: number, isArchived: boolean) => {
    const result = await actionArquivarNota({ id, isArchived });
    if (!result.success) {
      throw new Error(result.message || result.error || "Falha ao arquivar nota.");
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isArchived } : n)));
  }, []);

  const deleteNote = React.useCallback(async (id: number) => {
    const result = await actionExcluirNota({ id });
    if (!result.success) {
      throw new Error(result.message || result.error || "Falha ao excluir nota.");
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value: NotesContextValue = React.useMemo(
    () => ({
      notes,
      labels,
      mode,
      setMode,
      createNote,
      updateNote,
      createLabel,
      updateLabel,
      deleteLabel,
      archiveNote,
      deleteNote,
    }),
    [notes, labels, mode, createNote, updateNote, createLabel, updateLabel, deleteLabel, archiveNote, deleteNote]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = React.useContext(NotesContext);
  if (!ctx) {
    throw new Error("useNotes deve ser usado dentro de NotesProvider");
  }
  return ctx;
}


