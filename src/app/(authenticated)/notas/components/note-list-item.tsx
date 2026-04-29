"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Archive, Edit3, Inbox } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";

import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Note } from "../domain";
import { useNotes } from "../notes-context";
import { EditNoteModal } from "./add-note-modal";

export default function NoteListItem({ note }: { note: Note }) {
  const { labels, archiveNote } = useNotes();
  return (
    <div className={cn(
      "glass-widget group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl border transition-all duration-300",
      "hover:shadow-md cursor-pointer",
      "md:group-data-[view-mode=list]:flex md:group-data-[view-mode=list]:flex-row",
    )}>
      {/* Ações flutuantes — aparecem no hover */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                aria-label={note.isArchived ? "Desarquivar nota" : "Arquivar nota"}
                className="size-8"
                onClick={() => archiveNote(note.id, !note.isArchived)}
              >
                {note.isArchived ? <Inbox className="size-4" /> : <Archive className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{note.isArchived ? "Desarquivar" : "Arquivar"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <EditNoteModal note={note}>
                  <Button variant="secondary" size="icon" aria-label="Editar nota" className="size-8">
                    <Edit3 className="size-4" />
                  </Button>
                </EditNoteModal>
              </div>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Imagem (tipo image) */}
      {note.type === "image" && note.image && (
        <figure className="top-0 h-full shrink-0 md:group-data-[view-mode=list]:w-62">
          <Image
            width={200}
            height={150}
            src={note.image}
            className="aspect-square h-full w-full object-cover group-data-[view-mode=list]:md:absolute md:group-data-[view-mode=list]:w-62"
            alt="Imagem da nota"
            unoptimized
          />
        </figure>
      )}

      {/* Conteúdo */}
      <div className={cn(
        "space-y-3 p-5",
        "group-data-[view-mode=masonry]:pt-6",
        "group-data-[view-mode=list]:pb-6",
      )}>
        <Heading level="card">{note.title}</Heading>

        {note.type === "text" && note.content && (
          <Text variant="caption" as="p" className="whitespace-pre-line">{note.content}</Text>
        )}

        {note.type === "checklist" && note.items && (
          <ul className="space-y-3">
            {note.items.map((item, key) => (
              <li
                key={key}
                className={cn("flex items-center gap-2", {
                  "text-muted-foreground line-through": item.checked
                })}>
                <Checkbox
                  className="peer"
                  id={`checklist_${key}`}
                  defaultChecked={item.checked}
                />
                <label
                  htmlFor={`checklist_${key}`}
                  className="text-body-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {item.text}
                </label>
              </li>
            ))}
          </ul>
        )}

        {note.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {note.labels.map((id, key) => {
              const label = labels.find((e) => e.id === id);
              if (label)
                return (
                  <Badge key={key} variant="outline">
                    <span className={cn("me-1 size-2 shrink-0 rounded-full", label.color)}></span>
                    {label.title}
                  </Badge>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
