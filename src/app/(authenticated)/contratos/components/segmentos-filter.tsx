'use client';

/**
 * CONTRATOS FEATURE - SegmentosFilter
 *
 * Componente de filtro de segmentos seguindo o padrão FilterPopover.
 * Carrega segmentos dinamicamente e inclui botão para gerenciar segmentos.
 */

import * as React from 'react';
import { PlusCircle, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentosDialog } from './segmentos-dialog';
import type { Segmento } from '../actions';
import { actionListarSegmentos } from '../actions';

// =============================================================================
// TIPOS
// =============================================================================

interface SegmentosFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function SegmentosFilter({
  value,
  onValueChange,
}: SegmentosFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const activeSegmentos = React.useMemo(
    () => segmentos.filter((s) => s.ativo),
    [segmentos]
  );

  const isFiltered = value !== '';

  const selectedLabel = React.useMemo(() => {
    if (!value) return null;
    return activeSegmentos.find((s) => String(s.id) === value)?.nome || null;
  }, [value, activeSegmentos]);

  // Carregar segmentos ao abrir o popover
  const fetchSegmentos = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await actionListarSegmentos();
      if (result.success) {
        setSegmentos(result.data || []);
      }
    } catch {
      // Silently fail - user can retry by reopening
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchSegmentos();
    }
  }, [open, fetchSegmentos]);

  // Recarregar quando dialog fechar (para pegar novos segmentos)
  const handleDialogOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      fetchSegmentos();
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 border-dashed bg-card">
            <PlusCircle className="h-4 w-4" />
            Segmento
            {isFiltered && selectedLabel && (
              <AppBadge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">
                {selectedLabel}
              </AppBadge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar segmento..." className="h-9" />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                  <CommandGroup>
                    {activeSegmentos.map((segmento) => {
                      const segId = String(segmento.id);
                      const isSelected = value === segId;
                      return (
                        <CommandItem
                          key={segmento.id}
                          value={segmento.nome}
                          onSelect={() => {
                            onValueChange(isSelected ? '' : segId);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3 py-1">
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            <span className="leading-none">{segmento.nome}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
              <CommandSeparator />
              <CommandGroup>
                {isFiltered && (
                  <CommandItem
                    onSelect={() => {
                      onValueChange('');
                      setOpen(false);
                    }}
                    className="justify-center text-center"
                  >
                    Limpar filtro
                  </CommandItem>
                )}
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Gerenciar Segmentos
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog de gerenciamento */}
      <SegmentosDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
    </>
  );
}
