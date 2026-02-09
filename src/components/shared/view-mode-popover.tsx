'use client';

import * as React from 'react';
import { Eye, CalendarDays, CalendarRange, Calendar, List, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/components/shared';

export interface ViewModeOption {
  value: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_VIEW_OPTIONS: ViewModeOption[] = [
  { value: 'semana', label: 'Dia', icon: CalendarDays },
  { value: 'mes', label: 'Mês', icon: CalendarRange },
  { value: 'ano', label: 'Ano', icon: Calendar },
  { value: 'lista', label: 'Lista', icon: List },
];

export interface ViewModePopoverProps {
  value: ViewType;
  onValueChange: (value: ViewType) => void;
  options?: ViewModeOption[];
  className?: string;
}

/**
 * ViewModePopover - Botão com ícone de olho que abre popover para seleção de visualização
 *
 * Usado nas páginas de Audiências, Expedientes e Perícias para alternar entre
 * visualizações de Dia, Mês, Ano e Lista.
 */
export function ViewModePopover({
  value,
  onValueChange,
  options = DEFAULT_VIEW_OPTIONS,
  className,
}: ViewModePopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (viewType: ViewType) => {
      onValueChange(viewType);
      setOpen(false);
    },
    [onValueChange]
  );

  const currentOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn('h-9 w-9 bg-card', className)}
              aria-label="Alterar visualização"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Visualização: {currentOption?.label || 'Selecionar'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-44 p-1">
        <div className="flex flex-col gap-0.5">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
