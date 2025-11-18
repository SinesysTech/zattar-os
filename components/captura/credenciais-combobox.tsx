'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { GRAUS } from '@/lib/api/captura';
import type { CredencialComAdvogado } from '@/backend/types/credenciais/types';

interface CredenciaisComboboxProps {
  credenciais: CredencialComAdvogado[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Extrai o número do TRT para ordenação correta
 * Ex: "TRT1" -> 1, "TRT10" -> 10
 */
function extrairNumeroTRT(tribunal: string): number {
  const match = tribunal.match(/TRT(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Ordena credenciais por TRT (numérico) e depois por grau
 */
function ordenarCredenciais(credenciais: CredencialComAdvogado[]): CredencialComAdvogado[] {
  return [...credenciais].sort((a, b) => {
    // Primeiro ordenar por número do TRT
    const numA = extrairNumeroTRT(a.tribunal);
    const numB = extrairNumeroTRT(b.tribunal);
    if (numA !== numB) {
      return numA - numB;
    }
    // Se mesmo TRT, ordenar por grau (primeiro_grau antes de segundo_grau)
    if (a.grau !== b.grau) {
      return a.grau === 'primeiro_grau' ? -1 : 1;
    }
    return 0;
  });
}

export function CredenciaisCombobox({
  credenciais,
  selectedIds,
  onSelectionChange,
  disabled = false,
  placeholder = 'Selecione credenciais...',
}: CredenciaisComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Ordenar credenciais corretamente
  const credenciaisOrdenadas = React.useMemo(
    () => ordenarCredenciais(credenciais),
    [credenciais]
  );

  // Filtrar credenciais baseado na busca
  const credenciaisFiltradas = React.useMemo(() => {
    if (!search) return credenciaisOrdenadas;
    
    const searchLower = search.toLowerCase();
    return credenciaisOrdenadas.filter((cred) => {
      const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
      const textoCompleto = `${cred.tribunal} ${grauLabel}`.toLowerCase();
      return textoCompleto.includes(searchLower);
    });
  }, [credenciaisOrdenadas, search]);

  const handleToggle = (credencialId: number) => {
    if (selectedIds.includes(credencialId)) {
      onSelectionChange(selectedIds.filter((id) => id !== credencialId));
    } else {
      onSelectionChange([...selectedIds, credencialId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === credenciaisOrdenadas.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(credenciaisOrdenadas.map((c) => c.id));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const todasSelecionadas = selectedIds.length === credenciaisOrdenadas.length && credenciaisOrdenadas.length > 0;

  // Obter credenciais selecionadas para exibição
  const credenciaisSelecionadas = credenciaisOrdenadas.filter((c) =>
    selectedIds.includes(c.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-10 h-auto py-2"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedIds.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedIds.length === 1 ? (
              <span className="text-sm">
                {(() => {
                  const cred = credenciaisSelecionadas[0];
                  const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
                  return `${cred.tribunal} - ${grauLabel}`;
                })()}
              </span>
            ) : (
              <>
                <Badge variant="secondary" className="mr-1">
                  {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
                </Badge>
                {credenciaisSelecionadas.slice(0, 2).map((cred) => {
                  const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
                  return (
                    <Badge key={cred.id} variant="outline" className="text-xs">
                      {cred.tribunal} - {grauLabel}
                    </Badge>
                  );
                })}
                {selectedIds.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedIds.length - 2}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar credenciais..."
            value={search}
            onValueChange={setSearch}
          />
          <div className="flex items-center justify-between border-b px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelectAll}
            >
              {todasSelecionadas ? 'Desmarcar todas' : 'Selecionar todas'}
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleClearAll}
              >
                Limpar seleções
              </Button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>Nenhuma credencial encontrada.</CommandEmpty>
            <CommandGroup>
              {credenciaisFiltradas.map((cred) => {
                const isSelected = selectedIds.includes(cred.id);
                const grauLabel = GRAUS.find((g) => g.value === cred.grau)?.label || cred.grau;
                
                return (
                  <CommandItem
                    key={cred.id}
                    value={`${cred.tribunal}-${cred.grau}`}
                    onSelect={() => handleToggle(cred.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{cred.tribunal}</span>
                      <span className="text-muted-foreground ml-2">- {grauLabel}</span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

