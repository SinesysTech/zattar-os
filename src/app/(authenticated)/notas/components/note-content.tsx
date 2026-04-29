import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileSearchIcon, LayoutGridIcon, ListIcon, MenuIcon, Plus, Search } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddNoteModal } from "./add-note-modal";
import type { Note } from "../domain";
import NoteListItem from "./note-list-item";
import { NoteMobileSidebar } from "./note-sidebar";
import { useNotes } from "../notes-context";

export default function NoteContent() {
  const { notes, mode } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"masonry" | "list">("masonry");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const baseNotes = notes.filter((n) => (mode === "arquivadas" ? n.isArchived : !n.isArchived));
  const filteredNotes = normalizedQuery
    ? baseNotes.filter((note: Note) => note.title.toLowerCase().includes(normalizedQuery))
    : baseNotes;

  const modeLabel = mode === "arquivadas" ? "Arquivadas" : "Notas";
  const modeSubtitle = mode === "arquivadas"
    ? `${filteredNotes.length} nota${filteredNotes.length !== 1 ? "s" : ""} arquivada${filteredNotes.length !== 1 ? "s" : ""}`
    : `${filteredNotes.length} nota${filteredNotes.length !== 1 ? "s" : ""}`;

  return (
    <div className="flex-1 space-y-5">
      {/* Header canônico DS */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">{modeLabel}</Heading>
          <Text variant="caption" as="p" className="mt-0.5">{modeSubtitle}</Text>
        </div>
        <AddNoteModal>
          <Button size="sm" className="rounded-xl">
            <Plus className="size-3.5" />
            Nova Nota
          </Button>
        </AddNoteModal>
      </div>

      {/* View controls canônicos DS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex xl:hidden">
          <NoteMobileSidebar>
            <Button variant="outline" size="icon" aria-label="Abrir menu de notas">
              <MenuIcon />
            </Button>
          </NoteMobileSidebar>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-full bg-card pl-10"
              placeholder="Buscar notas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden overflow-hidden rounded-xl border sm:flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("rounded-none", {
                        "bg-accent text-accent-foreground": viewMode === "masonry",
                        "bg-card": viewMode !== "masonry",
                      })}
                      onClick={() => setViewMode("masonry")}>
                      <LayoutGridIcon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grade</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("rounded-none", {
                        "bg-accent text-accent-foreground": viewMode === "list",
                        "bg-card": viewMode !== "list",
                      })}
                      onClick={() => setViewMode("list")}>
                      <ListIcon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Lista</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {searchQuery && filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-muted/30 mb-4 rounded-full p-6">
            <FileSearchIcon className="text-muted-foreground size-12" />
          </div>
          <Heading level="card" className="mb-2">Nenhuma nota encontrada</Heading>
          <Text variant="caption" as="p" className="max-w-md">
            {`Não encontramos nenhuma nota que corresponda a "${searchQuery}".`}
          </Text>
          <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
            Limpar filtros
          </Button>
        </div>
      )}

      <div
        data-view-mode={viewMode}
        className={cn("group", {
          "box-border columns-1 gap-4 [column-fill:balance] group-data-[theme-content-layout=centered]/layout:columns-3 group-data-[theme-content-layout=full]/layout:columns-1 sm:group-data-[theme-content-layout=full]:columns-2 md:group-data-[theme-content-layout=full]/layout:columns-3 lg:columns-2 xl:group-data-[theme-content-layout=full]/layout:columns-4":
            viewMode === "masonry"
        })}>
        {filteredNotes.map((note: Note, key: number) => (
          <NoteListItem key={key} note={note} />
        ))}
      </div>
    </div>
  );
}
