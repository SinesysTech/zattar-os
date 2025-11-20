'use client';

// Componente DataTable genérico e reutilizável usando TanStack Table

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export interface DataTableProps<TData> {
  // Dados
  data: TData[];
  columns: ColumnDef<TData>[];

  // Paginação server-side
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };

  // Ordenação server-side
  sorting?: {
    columnId: string | null;
    direction: 'asc' | 'desc' | null;
    onSortingChange: (columnId: string | null, direction: 'asc' | 'desc' | null) => void;
  };

  // Estados
  isLoading?: boolean;
  error?: string | null;

  // Configurações opcionais
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  className?: string;
  hideTableBorder?: boolean;
  hideColumnBorders?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  pagination,
  sorting,
  isLoading = false,
  error = null,
  onRowClick,
  emptyMessage = 'Nenhum resultado encontrado.',
  className,
  hideTableBorder = false,
  hideColumnBorders = false,
}: DataTableProps<TData>) {
  // Estado interno de ordenação (para UI)
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);

  // Sincronizar ordenação externa com estado interno
  React.useEffect(() => {
    if (sorting) {
      if (sorting.columnId && sorting.direction) {
        setInternalSorting([{
          id: sorting.columnId,
          desc: sorting.direction === 'desc',
        }]);
      } else {
        setInternalSorting([]);
      }
    }
  }, [sorting]);

  // Configurar paginação
  const paginationState: PaginationState = React.useMemo(() => {
    if (pagination) {
      return {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      };
    }
    return {
      pageIndex: 0,
      pageSize: 10,
    };
  }, [pagination]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pagination,
    manualSorting: !!sorting,
    pageCount: pagination?.totalPages ?? -1,
    state: {
      pagination: paginationState,
      sorting: internalSorting,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);

      if (sorting && newSorting.length > 0) {
        const sort = newSorting[0];
        sorting.onSortingChange(sort.id, sort.desc ? 'desc' : 'asc');
      } else if (sorting) {
        sorting.onSortingChange(null, null);
      }
    },
  });

  const handlePageChange = (newPageIndex: number) => {
    if (pagination && newPageIndex >= 0 && newPageIndex < pagination.totalPages) {
      pagination.onPageChange(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    if (pagination) {
      pagination.onPageSizeChange(Number(newPageSize));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabela */}
      <div className={cn(
        hideTableBorder ? '' : 'rounded-lg border bg-card text-card-foreground shadow-sm'
      )}>
        <div className="relative w-full overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {!error && (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const columnSize = header.column.columnDef.size;
                      const maxWidth = columnSize ? `${columnSize}px` : undefined;
                      const align = (header.column.columnDef.meta as { align?: 'left' | 'center' | 'right' })?.align || 'center';
                      const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
                      return (
                        <TableHead
                          key={header.id}
                          className={`${alignClass} ${!hideColumnBorders && index < headerGroup.headers.length - 1 ? 'border-r border-border' : ''}`}
                          style={maxWidth ? { maxWidth, width: maxWidth } : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        onRowClick ? 'cursor-pointer' : '',
                        rowIndex % 2 === 1 ? 'bg-muted/30' : ''
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell, index) => {
                        const columnSize = cell.column.columnDef.size;
                        const maxWidth = columnSize ? `${columnSize}px` : undefined;
                        const align = (cell.column.columnDef.meta as { align?: 'left' | 'center' | 'right' })?.align || 'center';
                        const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
                        return (
                          <TableCell
                            key={cell.id}
                            className={`${alignClass} ${index < row.getVisibleCells().length - 1 ? 'border-r border-border' : ''}`}
                            style={maxWidth ? { maxWidth, width: maxWidth } : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileX className="h-6 w-6" />
                          </EmptyMedia>
                          <EmptyTitle>{emptyMessage}</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {pagination.pageIndex * pagination.pageSize + 1} a{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)} de{' '}
              {pagination.total} resultados
            </p>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(0)}
              disabled={pagination.pageIndex === 0 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Página {pagination.pageIndex + 1} de {pagination.totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= pagination.totalPages - 1 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages - 1)}
              disabled={pagination.pageIndex >= pagination.totalPages - 1 || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
