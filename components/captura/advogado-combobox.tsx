'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Advogado } from '@/backend/advogados/services/persistence/advogado-persistence.service';

interface AdvogadoComboboxProps {
  advogados: Advogado[];
  selectedId: number | null;
  onSelectionChange: (id: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function AdvogadoCombobox({
  advogados,
  selectedId,
  onSelectionChange,
  disabled = false,
  placeholder = 'Selecione um advogado...',
  isLoading = false,
}: AdvogadoComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Filtrar advogados baseado na busca
  const advogadosFiltrados = React.useMemo(() => {
    if (!search) return advogados;
    
    const searchLower = search.toLowerCase();
    return advogados.filter((advogado) => {
      const textoCompleto = `${advogado.nome_completo} ${advogado.oab} ${advogado.uf_oab} ${advogado.cpf}`.toLowerCase();
      return textoCompleto.includes(searchLower);
    });
  }, [advogados, search]);

  const advogadoSelecionado = advogados.find((a) => a.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {isLoading
              ? 'Carregando...'
              : advogadoSelecionado
                ? `${advogadoSelecionado.nome_completo} - OAB ${advogadoSelecionado.oab}/${advogadoSelecionado.uf_oab}`
                : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar advogado..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Carregando...' : 'Nenhum advogado encontrado.'}
            </CommandEmpty>
            {advogados.length === 0 && !isLoading ? (
              <CommandGroup>
                <CommandItem disabled>
                  Nenhum advogado com credenciais encontrado
                </CommandItem>
              </CommandGroup>
            ) : (
              <CommandGroup>
                {advogadosFiltrados.map((advogado) => {
                  const isSelected = selectedId === advogado.id;
                  return (
                    <CommandItem
                      key={advogado.id}
                      value={`${advogado.nome_completo}-${advogado.oab}-${advogado.uf_oab}`}
                      onSelect={() => {
                        onSelectionChange(isSelected ? null : advogado.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{advogado.nome_completo}</div>
                        <div className="text-xs text-muted-foreground">
                          OAB {advogado.oab}/{advogado.uf_oab}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

