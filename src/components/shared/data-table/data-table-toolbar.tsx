import { Table } from '@tanstack/react-table';
import { Download, SlidersHorizontal, X } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DataTableFilter } from './data-table-filter';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
}

export function DataTableToolbar<TData>({
  table,
  onExport,
  density = 'standard',
  onDensityChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (onExport) {
      onExport(format);
      return;
    }

    // Default export implementation
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
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, `${filename}.${format}`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter..."
          value={(table.getState().globalFilter as string) ?? ''}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        
        {/* Dynamic Filters from Columns */}
        {table.getAllColumns().map((column) => {
           if ((column.columnDef.meta as any)?.filterVariant) {
               return (
                   <DataTableFilter 
                       key={column.id} 
                       column={column} 
                       title={column.columnDef.header?.toString()} 
                       options={(column.columnDef.meta as any)?.filterOptions}
                   />
               )
           }
           return null;
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {/* Density Selector */}
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden ml-auto h-8 lg:flex">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Density
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuLabel>Density</DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuCheckboxItem checked={density === 'compact'} onCheckedChange={() => onDensityChange?.('compact')}>
                Compact
             </DropdownMenuCheckboxItem>
             <DropdownMenuCheckboxItem checked={density === 'standard'} onCheckedChange={() => onDensityChange?.('standard')}>
                Standard
             </DropdownMenuCheckboxItem>
             <DropdownMenuCheckboxItem checked={density === 'relaxed'} onCheckedChange={() => onDensityChange?.('relaxed')}>
                Relaxed
             </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden ml-auto h-8 lg:flex">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export to JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
