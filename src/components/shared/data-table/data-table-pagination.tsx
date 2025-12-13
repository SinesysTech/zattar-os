'use client';

import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  
  // Helper to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5; // Max visible buttons
    
    // Always show first and last
    // Logic: 1 ... 4 5 6 ... 10
    
    if (pageCount <= maxButtons + 2) {
       for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
       // Logic for complex range 
       // Start
       if (pageIndex < 3) {
           for (let i = 0; i < 4; i++) pages.push(i);
           pages.push(-1); // Ellipsis
           pages.push(pageCount - 1);
       } 
       // End
       else if (pageIndex > pageCount - 4) {
           pages.push(0);
           pages.push(-1);
           for (let i = pageCount - 4; i < pageCount; i++) pages.push(i);
       } 
       // Middle
       else {
           pages.push(0);
           pages.push(-1);
           pages.push(pageIndex - 1);
           pages.push(pageIndex);
           pages.push(pageIndex + 1);
           pages.push(-1);
           pages.push(pageCount - 1);
       }
    }
    return pages;
  };

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <span>
                {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
            </span>
        ) : (
            <span>
                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} até{" "}
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getRowCount())} de{" "}
                {table.getRowCount()} registros
            </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
         {/* Previous Button */}
          <Button
            variant="outline"
            className="h-8 px-3"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, idx) => {
                  if (page === -1) {
                      return <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                  }
                  return (
                    <Button
                        key={page}
                        variant={page === pageIndex ? "default" : "outline"}
                        className={cn("h-8 w-8 p-0", page === pageIndex ? "pointer-events-none" : "")}
                        onClick={() => table.setPageIndex(page)}
                    >
                        {page + 1}
                    </Button>
                  )
              })}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            className="h-8 px-3"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
      </div>
    </div>
  );
}
