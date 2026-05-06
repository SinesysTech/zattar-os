"use client";

import { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { actionListarClientesSugestoes } from "@/app/(authenticated)/partes/server-actions";
import { Text } from '@/components/ui/typography';

interface Option {
  id: number | string;
  label: string;
  cpf?: string;
  cnpj?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ClienteAutocomplete({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOptions() {
      setLoading(true);
      try {
        const result = await actionListarClientesSugestoes({ limit: 20 });
        if (result.success && result.data?.options) {
          setOptions(result.data.options);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? options.find((opt) => String(opt.id) === value)?.label || "Selecione" : "Selecione"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-75 p-0")}>
        <Command>
          <CommandInput placeholder="Buscar cliente" />
          <CommandList>
            <CommandEmpty>{loading ? "Carregando..." : "Nenhum resultado"}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={String(opt.id)}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === String(opt.id) ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{opt.label}</span>
                    {(opt.cpf || opt.cnpj) && (
                      <Text variant="caption">{opt.cpf || opt.cnpj}</Text>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
