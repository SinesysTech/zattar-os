'use client';

import * as React from 'react';
import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * DataTableColumnHeader
 *
 * Cabeçalho de coluna com controles de ordenação e visibilidade.
 *
 * Acessibilidade:
 * - aria-sort indica o estado atual de ordenação
 * - aria-haspopup="menu" no botão de dropdown
 * - aria-label contextual para screen readers
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // Determine sort state for aria-sort
  const sortDirection = column.getIsSorted();
  const ariaSortValue: 'ascending' | 'descending' | 'none' =
    sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : 'none';

  if (!column.getCanSort()) {
    return (
      <div className={cn('text-muted-foreground', className)} aria-sort="none">
        {title}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center space-x-2', className)}
      aria-sort={ariaSortValue}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-muted-foreground data-[state=open]:bg-accent"
            aria-haspopup="menu"
            aria-label={`Ordenar por ${title}. Atual: ${
              sortDirection === 'asc'
                ? 'crescente'
                : sortDirection === 'desc'
                  ? 'decrescente'
                  : 'sem ordenação'
            }`}
            title={`Ordenar por ${title}`}
          >
            <span>{title}</span>
            {sortDirection === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
            ) : sortDirection === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            aria-label={`Ordenar ${title} de forma crescente`}
          >
            <ArrowUp
              className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
              aria-hidden="true"
            />
            Crescente
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            aria-label={`Ordenar ${title} de forma decrescente`}
          >
            <ArrowDown
              className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
              aria-hidden="true"
            />
            Decrescente
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                aria-label={`Ocultar coluna ${title}`}
              >
                <EyeOff
                  className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
                  aria-hidden="true"
                />
                Ocultar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
