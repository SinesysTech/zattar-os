"use client";

import React from "react";
import { Archive, Edit3, PenSquare } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { AddNoteModal } from "./add-note-modal";
import { EditLabelsModal } from "./edit-labels-modal";
import { useNotes } from "./notes-context";

export default function NoteSidebar() {
  return (
    <div className="sticky top-18 hidden space-y-4 xl:block">
      <AddNoteModal />
      <NoteSidebarContent />
    </div>
  );
}

export function NoteMobileSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="bg-white px-0 dark:bg-gray-950">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Menu de notas</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <NoteSidebarContent />
      </SheetContent>
    </Sheet>
  );
}

export function NoteSidebarContent() {
  const { labels, mode, setMode } = useNotes();
  return (
    <div className="flex flex-col rounded-md bg-white p-2 dark:bg-gray-950 xl:w-64 xl:border">
      <div className="space-y-1">
        <Button
          variant={mode === "notas" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setMode("notas")}>
          <PenSquare />
          Notas
        </Button>
        <Button
          variant={mode === "arquivadas" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setMode("arquivadas")}>
          <Archive />
          Arquivadas
        </Button>
        <EditLabelsModal>
          <Button variant="ghost" className="w-full justify-start">
            <Edit3 />
            Editar etiquetas
          </Button>
        </EditLabelsModal>
      </div>

      <Separator className="my-4" />

      <div className="flex-1">
        <div className="text-muted-foreground mb-3 px-2 text-sm font-medium">Etiquetas</div>
        <nav>
          {labels.map((label) => (
            <Button key={label.id} variant="ghost" className="w-full justify-start font-normal">
              <span className={`me-1 size-2 rounded-full ${label.color}`} />
              {label.title}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
