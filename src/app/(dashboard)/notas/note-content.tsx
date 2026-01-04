import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileSearchIcon, LayoutGridIcon, ListIcon, MenuIcon, PenSquare, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddNoteModal } from "./add-note-modal";
import type { Note } from "./domain";
import NoteListItem from "./note-list-item";
import { NoteMobileSidebar } from "./note-sidebar";
import { useNotes } from "./notes-context";

export default function NoteContent() {
  const { notes, mode } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"masonry" | "list">("masonry");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const baseNotes = notes.filter((n) => (mode === "arquivadas" ? n.isArchived : !n.isArchived));
  const filteredNotes = normalizedQuery
    ? baseNotes.filter((note: Note) => note.title.toLowerCase().includes(normalizedQuery))
    : baseNotes;

  return (
    <div className="flex-1">
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              className="w-full bg-white pl-10 dark:bg-gray-950"
              placeholder="Buscar notas"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden overflow-hidden rounded-md border sm:flex">
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-none", {
                  "bg-accent text-accent-foreground": viewMode === "masonry",
                  "bg-white dark:bg-gray-950": viewMode !== "masonry",
                })}
                onClick={() => setViewMode("masonry")}>
                <LayoutGridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("rounded-none", {
                  "bg-accent text-accent-foreground": viewMode === "list",
                  "bg-white dark:bg-gray-950": viewMode !== "list",
                })}
                onClick={() => setViewMode("list")}>
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <AddNoteModal>
                      <Button variant="default" size="icon" aria-label="Adicionar Nota">
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </AddNoteModal>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Adicionar Nota</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex xl:hidden">
          <NoteMobileSidebar>
            <Button variant="outline" size="icon" aria-label="Abrir menu de notas">
              <MenuIcon />
            </Button>
          </NoteMobileSidebar>
        </div>
      </div>

      {searchQuery && filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-muted/30 mb-4 rounded-full p-6">
            <FileSearchIcon className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-xl font-medium">Nenhuma nota encontrada</h3>
          <p className="text-muted-foreground max-w-md">
            {`Não encontramos nenhuma nota que corresponda a "${searchQuery}".`}
          </p>
          {searchQuery && (
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      <div
        data-view-mode={viewMode}
        className={cn("group", {
          "box-border columns-1 gap-4 [column-fill:_balance] group-data-[theme-content-layout=centered]/layout:columns-3 group-data-[theme-content-layout=full]/layout:columns-1 sm:group-data-[theme-content-layout=full]:columns-2 md:group-data-[theme-content-layout=full]/layout:columns-3 lg:columns-2 xl:group-data-[theme-content-layout=full]/layout:columns-4":
            viewMode === "masonry"
        })}>
        {filteredNotes.map((note: Note, key: number) => (
          <NoteListItem key={key} note={note} />
        ))}
      </div>
    </div>
  );
}
