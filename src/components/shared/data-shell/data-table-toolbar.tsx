'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { Download, Search, Settings2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  table: Table<TData>;
  tableId?: string;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
  actionSlot?: React.ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  filtersSlot?: React.ReactNode;
}

/**
 * DataTableToolbar
 *
 * Toolbar para DataTable com busca, filtros, controle de densidade,
 * visibilidade de colunas e exportação.
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
}: DataTableToolbarProps<TData>) {
  const handleExport = React.useCallback(
    (format: 'csv' | 'xlsx' | 'json') => {
      if (onExport) {
        onExport(format);
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
        .getAllColumns()
        .filter(
          (column) =>
            column.id !== 'select' &&
            typeof column.accessorFn !== 'undefined' &&
            column.getCanHide()
        ),
    [table]
  );

  return (
    <div
      role="toolbar"
      aria-label="Controles da tabela"
      aria-controls={tableId}
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
                : ((table.getState().globalFilter as string) ?? '')
            }
            onChange={(event) => {
              const value = event.target.value;
              if (onSearchValueChange) {
                onSearchValueChange(value);
                return;
              }
              table.setGlobalFilter(value);
            }}
            className="h-10 w-full pl-9"
          />
        </div>

        {/* Filtros (dropdowns) */}
        {filtersSlot}

        {/* Spacer para empurrar botões para a direita */}
        <div className="flex-1" />

        {/* Botão de Visualização/Configurações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="Configurações de visualização"
              title="Configurações de visualização"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
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
            {visibleColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botão de Exportar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="Exportar dados"
              title="Exportar dados"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
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

        {/* Slot para ações adicionais (se houver) */}
        {actionSlot}
      </div>
    </div>
  );
}
