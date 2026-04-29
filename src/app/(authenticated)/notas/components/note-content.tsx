import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileSearchIcon, LayoutGridIcon, ListIcon, MenuIcon, Plus } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";
import { SearchInput } from "@/components/dashboard/search-input";

import { Button } from "@/components/ui/button";
import { AddNoteModal } from "./add-note-modal";
import type { Note } from "../domain";
import NoteListItem from "./note-list-item";
import { NoteMobileSidebar } from "./note-sidebar";
import { useNotes } from "../notes-context";

const VIEW_OPTIONS = [
  { id: "masonry" as const, icon: LayoutGridIcon, label: "Grade" },
  { id: "list" as const, icon: ListIcon, label: "Lista" },
];

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
    ? "Notas arquivadas e fora de circulação"
    : "Anote, organize e arquive suas ideias";

  return (
    <div className="flex-1 space-y-5">
      {/* ── Header canônico DS ── */}
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

      {/* ── View Controls (Search + ViewToggle) ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Menu mobile — só aparece abaixo de xl */}
        <div className="flex xl:hidden">
          <NoteMobileSidebar>
            <Button variant="outline" size="icon" aria-label="Abrir menu de notas">
              <MenuIcon />
            </Button>
          </NoteMobileSidebar>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar notas..."
          />
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-border/6">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewMode(opt.id)}
                aria-label={opt.label}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer",
                  viewMode === opt.id
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground/55 hover:text-muted-foreground",
                )}
              >
                <opt.icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty state (busca sem resultado) ── */}
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

      {/* ── Grid de notas ── */}
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
