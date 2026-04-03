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

export function EditLabelsModal({ children }: Props) {
  const { labels: noteLabels, notes, createLabel, updateLabel, deleteLabel } = useNotes();
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingLabelTitle, setEditingLabelTitle] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-red-500");

  const availableColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500"
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white max-h-screen max-w-96 overflow-y-scroll dark:bg-gray-950 lg:overflow-y-auto">
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
                      size="icon"
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
                      size="icon"
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
                      <div className={`size-3 shrink-0 rounded-full ${label.color}`} />
                      <span>{label.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {notes.filter((n) => n.labels.includes(label.id)).length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingLabelId(label.id);
                          setEditingLabelTitle(label.title);
                        }}>
                        <Edit2 />
                      </Button>
                      <Button
                        size="icon"
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
                <div className={`size-3 rounded-full ${newLabelColor}`} />
              </div>
              <Input
                placeholder="Nome da etiqueta"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1 ps-9"
              />
              <Button
                size="icon"
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
                {availableColors.map((color) => (
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
