"use client";

import { cn } from '@/lib/utils';
import React from "react";
import { Archive, Edit3, PenSquare } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { EditLabelsModal } from "./edit-labels-modal";
import { useNotes } from "../notes-context";

export default function NoteSidebar() {
  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "sticky top-18 hidden space-y-4 xl:block")}>
      <NoteSidebarContent />
    </div>
  );
}

export function NoteMobileSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className={cn(/* design-system-escape: px-0 padding direcional sem Inset equiv. */ "bg-card px-0")}>
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
    <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col rounded-md bg-card p-2 xl:w-64 xl:border")}>
      <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
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

      <Separator className={cn(/* design-system-escape: my-4 margin sem primitiva DS */ "my-4")} />

      <div className="flex-1">
        <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-muted-foreground mb-3 px-2 text-sm font-medium")}>Etiquetas</div>
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
