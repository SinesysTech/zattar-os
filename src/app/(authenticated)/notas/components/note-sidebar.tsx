"use client";

import { cn } from '@/lib/utils';
import React from "react";
import { Archive, Edit3, PenSquare } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Text } from "@/components/ui/typography";

import { EditLabelsModal } from "./edit-labels-modal";
import { useNotes } from "../notes-context";

export default function NoteSidebar() {
  return (
    <div className="sticky top-18 hidden space-y-4 xl:block">
      <NoteSidebarContent />
    </div>
  );
}

export function NoteMobileSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-72 p-0 gap-0">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Menu de notas</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <NoteSidebarContent />
      </DialogContent>
    </Dialog>
  );
}

export function NoteSidebarContent() {
  const { labels, mode, setMode } = useNotes();
  return (
    <GlassPanel depth={1} className={cn("p-2 xl:w-64")}>
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
        <Text variant="meta-label" className="mb-3 block px-2 text-muted-foreground">
          Etiquetas
        </Text>
        <nav>
          {labels.map((label) => (
            <Button key={label.id} variant="ghost" className="w-full justify-start font-normal">
              <span className={`me-1 size-2 rounded-full ${label.color}`} />
              {label.title}
            </Button>
          ))}
        </nav>
      </div>
    </GlassPanel>
  );
}
