"use client";

import React, { useState } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "@radix-ui/react-icons";
import { useNotes } from "./notes-context";

interface Props {
  children: React.ReactNode;
}

/**
 * Paleta canônica de cores para labels — usa tokens --palette-* do design system.
 * Substitui as cores Tailwind cruas (bg-red-500, etc.) por classes geradas
 * automaticamente a partir dos tokens em globals.css.
 *
 * Note: Labels é entidade SEPARADA de Tags (que vivem em lib/domain/tags).
 * Este picker é específico para etiquetas de notas.
 */
const AVAILABLE_LABEL_COLORS = Array.from({ length: 17 }, (_, i) => `bg-palette-${i + 1}`);

/**
 * Converte cores legacy (bg-red-500, bg-orange-500, etc.) salvas no banco
 * para a nova paleta de tokens. Mantém compat com dados existentes.
 */
const LEGACY_COLOR_MAP: Record<string, string> = {
  "bg-red-500": "bg-palette-1",
  "bg-orange-500": "bg-palette-2",
  "bg-amber-500": "bg-palette-3",
  "bg-yellow-500": "bg-palette-4",
  "bg-lime-500": "bg-palette-5",
  "bg-green-500": "bg-palette-6",
  "bg-emerald-500": "bg-palette-7",
  "bg-teal-500": "bg-palette-8",
  "bg-cyan-500": "bg-palette-9",
  "bg-sky-500": "bg-palette-10",
  "bg-blue-500": "bg-palette-11",
  "bg-indigo-500": "bg-palette-12",
  "bg-violet-500": "bg-palette-13",
  "bg-purple-500": "bg-palette-14",
  "bg-fuchsia-500": "bg-palette-15",
  "bg-pink-500": "bg-palette-16",
  "bg-rose-500": "bg-palette-17",
};

function normalizeLabelColor(color: string): string {
  return LEGACY_COLOR_MAP[color] ?? color;
}

export function EditLabelsModal({ children }: Props) {
  const { labels: noteLabels, notes, createLabel, updateLabel, deleteLabel } = useNotes();
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingLabelTitle, setEditingLabelTitle] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-palette-1");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card max-h-screen max-w-96 overflow-y-scroll lg:overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar etiquetas</DialogTitle>
        </DialogHeader>

        <div>
          {/* Existing labels */}
          <div className="space-y-1">
            {noteLabels.map((label) => (
              <div key={label.id} className="flex items-center justify-between rounded-md py-1">
                {editingLabelId && editingLabelId === label.id ? (
                  <div className="flex flex-1 items-center">
                    <Input
                      value={editingLabelTitle}
                      onChange={(e) => setEditingLabelTitle(e.target.value)}
                      className="me-2 h-8"
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key !== "Enter") return;
                        const nextTitle = editingLabelTitle.trim();
                        if (!nextTitle) return;
                        await updateLabel(label.id, { title: nextTitle });
                        setEditingLabelId(null);
                      }}
                    />
                    <Button
                      size="icon" aria-label="Confirmar"
                      variant="ghost"
                      onClick={async () => {
                        const nextTitle = editingLabelTitle.trim();
                        if (!nextTitle) return;
                        await updateLabel(label.id, { title: nextTitle });
                        setEditingLabelId(null);
                        setEditingLabelTitle("");
                      }}
                    >
                      <Check />
                    </Button>
                    <Button
                      size="icon" aria-label="Fechar"
                      variant="ghost"
                      onClick={() => {
                        setEditingLabelId(null);
                        setEditingLabelTitle("");
                      }}>
                      <X />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className={`size-3 shrink-0 rounded-full ${normalizeLabelColor(label.color)}`} />
                      <span>{label.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {notes.filter((n) => n.labels.includes(label.id)).length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="icon" aria-label="Editar"
                        variant="ghost"
                        onClick={() => {
                          setEditingLabelId(label.id);
                          setEditingLabelTitle(label.title);
                        }}>
                        <Edit2 />
                      </Button>
                      <Button
                        size="icon" aria-label="Excluir"
                        variant="ghost"
                        onClick={async () => {
                          await deleteLabel(label.id);
                        }}>
                        <Trash2 />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new label */}
          <div className="border-t pt-6">
            <h4 className="mb-2 text-sm font-medium">Adicionar nova etiqueta</h4>
            <div className="relative flex items-center gap-2">
              <div className="absolute start-3 shrink-0">
                <div className={`size-3 rounded-full ${normalizeLabelColor(newLabelColor)}`} />
              </div>
              <Input
                placeholder="Nome da etiqueta"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1 ps-9"
              />
              <Button
                size="icon" aria-label="Adicionar"
                disabled={!newLabelName.trim()}
                onClick={async () => {
                  const title = newLabelName.trim();
                  if (!title) return;
                  await createLabel({ title, color: newLabelColor });
                  setNewLabelName("");
                }}>
                <PlusIcon />
              </Button>
            </div>

            {/* Color picker */}
            <div className="mt-4 flex items-center gap-2">
              <Label className="text-muted-foreground block text-xs">Selecionar cor</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`size-5 rounded-full ${color} ${newLabelColor === color ? "ring-primary ring-2 ring-offset-2" : ""
                      }`}
                    onClick={() => setNewLabelColor(color)}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
