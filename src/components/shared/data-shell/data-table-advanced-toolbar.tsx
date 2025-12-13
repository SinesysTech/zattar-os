import * as React from 'react';
import { Table } from '@tanstack/react-table';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataTableAdvancedToolbarProps<TData> {
  table: Table<TData>;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
  actionSlot?: React.ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  filtersSlot?: React.ReactNode;
}

export function DataTableAdvancedToolbar<TData>({
  table,
  onExport,
  density = 'standard',
  onDensityChange,
  actionSlot,
  searchValue,
  onSearchValueChange,
  filtersSlot,
}: DataTableAdvancedToolbarProps<TData>) {
  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (onExport) {
      onExport(format);
      return;
    }

    const data = table.getFilteredRowModel().rows.map((row) => row.original);
    const filename = 'data-export';

    if (format === 'json') {
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
        JSON.stringify(data)
      )}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `${filename}.json`;
      link.click();
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.${format}`);
  };

  return (
    <div className="px-6 space-y-3">
      {/* Linha 1: filtros + visualizar */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">{filtersSlot}</div>

        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">Visualizar</span>
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
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.id !== 'select' &&
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide()
                  )
                  .map((column) => (
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
          </TooltipTrigger>
          <TooltipContent>Visualizar</TooltipContent>
        </Tooltip>
      </div>

      {/* Linha 2: busca + exportar + ação */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
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

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Exportar</TooltipContent>
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

          {actionSlot}
        </div>
      </div>
    </div>
  );
}


