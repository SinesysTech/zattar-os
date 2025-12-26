'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { Download, Search, Settings2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DataShellActionButton } from './data-shell';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  tableId?: string;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void | Promise<void>;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
  actionSlot?: React.ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  filtersSlot?: React.ReactNode;
  actionButton?: DataShellActionButton;
}

/**
 * DataTableToolbar
 *
 * Toolbar para DataTable com busca, filtros, controle de densidade,
 * visibilidade de colunas e exportação.
 *
 * IMPORTANTE - Altura Padrão Automática:
 * - Todos os elementos (Input, Select, Button, DateRangePicker) dentro desta toolbar
 *   automaticamente recebem altura h-10 (40px) via seletor CSS contextual
 * - Isso é feito pelo atributo data-slot="data-table-toolbar" neste componente
 * - Os componentes ui/button.tsx, ui/select.tsx e ui/date-range-picker.tsx
 *   detectam este data-slot e aplicam h-10 automaticamente
 * - NÃO é necessário adicionar h-10 manualmente nos filtersSlot
 *
 * Acessibilidade:
 * - role="toolbar" com aria-label
 * - aria-controls vinculado à tabela
 * - Todos os botões com aria-label para screen readers
 */
export function DataTableToolbar<TData>({
  table,
  tableId,
  onExport,
  density = 'standard',
  onDensityChange,
  actionSlot,
  searchValue,
  onSearchValueChange,
  searchPlaceholder = 'Buscar...',
  filtersSlot,
  actionButton,
}: DataTableToolbarProps<TData>) {
  const handleExport = React.useCallback(
    (format: 'csv' | 'xlsx' | 'json') => {
      if (onExport) {
        onExport(format);
        return;
      }

      if (!table) {
        return;
      }

      const data = table.getFilteredRowModel().rows.map((row) => row.original);
      const filename = 'data-export';

      if (format === 'json') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `${filename}.json`;
        link.click();
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data as object[]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, `${filename}.${format}`);
    },
    [onExport, table]
  );

  const visibleColumns = React.useMemo(
    () =>
      table
        ? table
            .getAllColumns()
            .filter(
              (column) =>
                column.id !== 'select' &&
                typeof column.accessorFn !== 'undefined' &&
                column.getCanHide()
            )
        : [],
    [table]
  );

  return (
    <div
      role="toolbar"
      aria-label="Controles da tabela"
      {...(tableId && { 'aria-controls': tableId })}
      data-slot="data-table-toolbar"
      className="px-6 py-4"
    >
      {/* Linha única: SearchBox + Filtros + Visualização + Exportar */}
      <div className="flex items-center gap-2">
        {/* SearchBox */}
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            aria-label="Buscar na tabela"
            value={
              searchValue !== undefined
                ? searchValue
                : (table?.getState().globalFilter as string) ?? ''
            }
            onChange={(event) => {
              const value = event.target.value;
              if (onSearchValueChange) {
                onSearchValueChange(value);
                return;
              }
              table?.setGlobalFilter(value);
            }}
            className="h-10 w-full pl-9 bg-card"
          />
        </div>

        {/* Filtros (dropdowns) */}
        {filtersSlot}

        {/* Spacer para empurrar botões para a direita */}
        <div className="flex-1" />

        {/* Botão de Visualização/Configurações - apenas se table estiver disponível */}
        {table && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-card"
                    aria-label="Configurações de visualização"
                  >
                    <Settings2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Configurações de visualização</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-[220px]">
              {/* Content remains same */}
              {onDensityChange && (
                <>
                  <DropdownMenuLabel>Densidade</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={density}
                    onValueChange={(val) =>
                      onDensityChange(val as 'compact' | 'standard' | 'relaxed')
                    }
                  >
                    <DropdownMenuRadioItem value="compact">
                      Compacta
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="standard">
                      Normal
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="relaxed">
                      Relaxada
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuLabel>Colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleColumns.map((column) => {
                const columnId = column.id || (column as { accessorKey?: string }).accessorKey || '';
                const headerLabel = (column.columnDef.meta as { headerLabel?: string } | undefined)?.headerLabel || columnId;
                const displayName = headerLabel
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <DropdownMenuCheckboxItem
                    key={columnId}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {displayName}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Botão de Exportar - apenas se table estiver disponível ou onExport for fornecido */}
        {(table || onExport) && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-card"
                    aria-label="Exportar dados"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Exportar dados</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* NEW Action Button */}
        {actionButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={actionButton.onClick}
                size="icon"
                className="h-10 w-10"
                aria-label={actionButton.label}
              >
                {/* Always use Plus icon for consistency in toolbar, or allow custom? Request said "só o símbolo de mais". */}
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {actionButton.tooltip ?? actionButton.label}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Slot para ações adicionais (se houver) */}
        {actionSlot}
      </div>
    </div>
  );
}
