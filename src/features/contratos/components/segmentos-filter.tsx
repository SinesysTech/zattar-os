'use client';

/**
 * CONTRATOS FEATURE - SegmentosFilter
 *
 * Componente de filtro de segmentos com botão para gerenciar segmentos.
 * Usa Popover para exibir lista de segmentos com botão de configuração.
 */

import * as React from 'react';
import { Check, ChevronsUpDown, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { SegmentosDialog } from './segmentos-dialog';
import type { Segmento } from '../actions';
import { actionListarSegmentos } from '../actions';

// =============================================================================
// TIPOS
// =============================================================================

interface SegmentosFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function SegmentosFilter({
  value,
  onValueChange,
  className,
}: SegmentosFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

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

  // Encontrar label do segmento selecionado
  const selectedLabel = React.useMemo(() => {
    if (!value) return null;
    const found = segmentos.find((s) => String(s.id) === value);
    return found?.nome || null;
  }, [value, segmentos]);

  const handleSelect = (segmentoId: string) => {
    onValueChange(segmentoId === value ? '' : segmentoId);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-[180px] justify-between bg-white', className)}
          >
            <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
              {selectedLabel || 'Segmento'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <div className="flex flex-col">
            {/* Botão de gerenciar segmentos */}
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => {
                  setOpen(false);
                  setDialogOpen(true);
                }}
              >
                <Settings className="h-3.5 w-3.5" />
                Gerenciar Segmentos
              </Button>
            </div>

            <Separator />

            {/* Lista de segmentos */}
            <div className="max-h-[300px] overflow-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Opção para limpar filtro */}
                  <div
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      !value && 'bg-accent'
                    )}
                    onClick={() => {
                      onValueChange('');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>Todos os segmentos</span>
                  </div>

                  {/* Segmentos ativos */}
                  {segmentos
                    .filter((s) => s.ativo)
                    .map((segmento) => (
                      <div
                        key={segmento.id}
                        className={cn(
                          'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                          String(segmento.id) === value && 'bg-accent'
                        )}
                        onClick={() => handleSelect(String(segmento.id))}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            String(segmento.id) === value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{segmento.nome}</span>
                      </div>
                    ))}

                  {segmentos.filter((s) => s.ativo).length === 0 && !isLoading && (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum segmento cadastrado
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog de gerenciamento */}
      <SegmentosDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} />
    </>
  );
}
