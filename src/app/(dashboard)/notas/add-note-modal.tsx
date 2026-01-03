"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon, Tag, PenSquare, Check, Trash2Icon, ArchiveIcon } from "lucide-react";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap";
import { Content } from "@tiptap/react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import type { NoteLabel } from "./domain";
import { useNotes } from "./notes-context";

export function AddNoteModal() {
  const { labels: noteLabels, createNote } = useNotes();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [value, setValue] = React.useState<Content>("");
  const [selectedTags, setSelectedTags] = React.useState<NoteLabel[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PenSquare />
          <span className="hidden md:block">Adicionar nota</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen max-w-(--breakpoint-sm) overflow-y-scroll p-0 lg:overflow-y-auto">
        {imagePreview && (
          <figure>
            <Image
              src={imagePreview}
              width={200}
              height={200}
              alt="Imagem da nota"
              className="aspect-video w-full rounded-tl-md rounded-tr-md object-cover"
              unoptimized
            />
          </figure>
        )}
        <VisuallyHidden>
          <DialogTitle>Adicionar nota</DialogTitle>
        </VisuallyHidden>

        <form
          className={cn({ "p-6": !imagePreview, "p-6 pt-0": imagePreview })}
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;

            const content = typeof value === "string" ? value : "";
            await createNote({
              title: trimmed,
              content: content || undefined,
              labels: selectedTags,
              imageDataUrl: imagePreview,
            });

            setTitle("");
            setValue("");
            setSelectedTags([]);
            setImagePreview(null);
            setOpen(false);
          }}>
          <div className="space-y-6">
            <Input
              placeholder="Título"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 rounded-none border-0 px-0 text-xl focus-visible:ring-0"
            />

            <MinimalTiptapEditor
              value={value}
              onChange={setValue}
              className="w-full"
              editorContentClassName="p-5"
              output="html"
              placeholder="Digite o conteúdo da nota..."
              autofocus={true}
              editable={true}
              editorClassName="focus:outline-hidden"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Input
                        id="picture"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <Button type="button" variant="ghost" size="icon">
                        <label htmlFor="picture" className="cursor-pointer">
                          <ImageIcon className="size-4" />
                        </label>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Adicionar imagem</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Tag className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar etiquetas..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
                              <CommandGroup className="p-2">
                                {noteLabels &&
                                  noteLabels.length &&
                                  noteLabels.map((label, key: number) => (
                                    <CommandItem
                                      key={key}
                                      className="flex items-center py-2"
                                      onSelect={() => {
                                        if (selectedTags.includes(label)) {
                                          return setSelectedTags(
                                            selectedTags.filter((item) => item.id !== label.id)
                                          );
                                        }

                                        return setSelectedTags(
                                          [...noteLabels].filter((u) =>
                                            [...selectedTags, label].includes(u)
                                          )
                                        );
                                      }}>
                                      <div className="flex grow items-center gap-2">
                                        <span
                                          className={cn(
                                            "block size-3 rounded-full",
                                            label.color
                                          )}></span>
                                        <span className="text-sm leading-none">{label.title}</span>
                                        {selectedTags.includes(label) ? (
                                          <Check className="text-primary ms-auto size-3" />
                                        ) : null}
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Adicionar etiqueta</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ArchiveIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Arquivar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button type="submit" disabled={!title.trim()}>
              Adicionar nota
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag, key) => (
              <Badge key={key} variant="outline">
                {tag.title}
              </Badge>
            ))}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
