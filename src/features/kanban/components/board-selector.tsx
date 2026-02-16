"use client";

import * as React from "react";
import {
  FileText,
  Gavel,
  CircleDollarSign,
  LayoutGrid,
  Check,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { KanbanBoardDef } from "../domain";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  expedientes: FileText,
  audiencias: Gavel,
  obrigacoes: CircleDollarSign,
};

interface BoardSelectorProps {
  boards: KanbanBoardDef[];
  value: string;
  onValueChange: (boardId: string) => void;
  onCreateBoard?: () => void;
}

export function BoardSelector({
  boards,
  value,
  onValueChange,
  onCreateBoard,
}: BoardSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedBoard = boards.find((b) => b.id === value);
  const systemBoards = boards.filter((b) => b.tipo === "system");
  const customBoards = boards.filter((b) => b.tipo === "custom");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed bg-card">
          <LayoutGrid className="h-4 w-4" />
          <span>Quadro</span>
          {selectedBoard && (
            <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
              {selectedBoard.titulo}
            </AppBadge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar quadro..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum quadro encontrado.</CommandEmpty>

            {systemBoards.length > 0 && (
              <CommandGroup heading="Quadros do Sistema">
                {systemBoards.map((board) => {
                  const Icon = SOURCE_ICONS[board.source ?? ""] ?? LayoutGrid;
                  const isSelected = board.id === value;
                  return (
                    <CommandItem
                      key={board.id}
                      onSelect={() => {
                        onValueChange(board.id);
                        setOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{board.titulo}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {customBoards.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Meus Quadros">
                  {customBoards.map((board) => {
                    const isSelected = board.id === value;
                    return (
                      <CommandItem
                        key={board.id}
                        onSelect={() => {
                          onValueChange(board.id);
                          setOpen(false);
                        }}
                      >
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                        <span>{board.titulo}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}

            {onCreateBoard && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateBoard();
                    }}
                    className="justify-center text-center"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Quadro</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
