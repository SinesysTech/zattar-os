"use client";

/**
 * QuadroSelector - Seletor de quadros para visualização Kanban
 * 
 * Adaptado de src/features/kanban/components/board-selector.tsx
 * Usa o domain unificado de Tarefas (Quadro)
 */

import * as React from "react";
import {
  FileText,
  Gavel,
  CircleDollarSign,
  Microscope,
  LayoutGrid,
  Check,
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

import type { Quadro } from "../domain";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  expedientes: FileText,
  audiencias: Gavel,
  pericias: Microscope,
  obrigacoes: CircleDollarSign,
};

interface QuadroSelectorProps {
  quadros: Quadro[];
  value: string | null;
  onValueChange: (quadroId: string | null) => void;
}

export function QuadroSelector({
  quadros,
  value,
  onValueChange,
}: QuadroSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedQuadro = value ? quadros.find((b) => b.id === value) : null;
  const systemQuadros = quadros.filter((b) => b.tipo === "sistema");
  const customQuadros = quadros.filter((b) => b.tipo === "custom");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed bg-card">
          <LayoutGrid className="h-4 w-4" />
          <span>Quadro</span>
          {selectedQuadro && (
            <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
              {selectedQuadro.titulo}
            </AppBadge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar quadro..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum quadro encontrado.</CommandEmpty>

            {systemQuadros.length > 0 && (
              <>
                <CommandGroup heading="Quadros do Sistema">
                  {systemQuadros.map((quadro) => {
                    const Icon = SOURCE_ICONS[quadro.source ?? ""] ?? LayoutGrid;
                    const isSelected = quadro.id === value;
                    return (
                      <CommandItem
                        key={quadro.id}
                        onSelect={() => {
                          onValueChange(quadro.id);
                          setOpen(false);
                        }}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{quadro.titulo}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}

            {customQuadros.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Meus Quadros">
                  {customQuadros.map((quadro) => {
                    const isSelected = quadro.id === value;
                    return (
                      <CommandItem
                        key={quadro.id}
                        onSelect={() => {
                          onValueChange(quadro.id);
                          setOpen(false);
                        }}
                      >
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                        <span>{quadro.titulo}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
