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
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, FileX } from 'lucide-react';
import { cn } from '@/app/_lib/utils/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { TablePagination } from '@/components/shared/table-pagination';

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

  // Seleção de linhas
  rowSelection?: {
    state: RowSelectionState;
    onRowSelectionChange: (state: RowSelectionState) => void;
    getRowId?: (row: TData) => string;
  };

  // Estados
  isLoading?: boolean;
  error?: string | null;

  // Configurações opcionais
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode;
  className?: string;
  hideTableBorder?: boolean;
  hideColumnBorders?: boolean;
  hidePagination?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  pagination,
  sorting,
  rowSelection,
  isLoading = false,
  error = null,
  onRowClick,
  emptyMessage = 'Nenhum resultado encontrado.',
  emptyComponent,
  className,
  hideTableBorder = false,
  hideColumnBorders = false,
  hidePagination = false,
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pagination,
    manualSorting: !!sorting,
    pageCount: pagination?.totalPages ?? -1,
    getRowId: rowSelection?.getRowId,
    enableRowSelection: !!rowSelection,
    state: {
      pagination: paginationState,
      sorting: internalSorting,
      rowSelection: rowSelection?.state ?? {},
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
    onRowSelectionChange: (updater) => {
      if (rowSelection) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection.state) : updater;
        rowSelection.onRowSelectionChange(newSelection);
      }
    },
  });

  const handlePageChange = (newPageIndex: number) => {
    if (pagination && newPageIndex >= 0 && newPageIndex < pagination.totalPages) {
      pagination.onPageChange(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (pagination) {
      pagination.onPageSizeChange(newPageSize);
    }
  };

  // Renderizar o conteúdo da tabela
  const tableContent = (
    <>
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
                    const hasBorder = index < row.getVisibleCells().length - 1;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          alignClass,
                          maxWidth && 'overflow-hidden',
                          hasBorder && 'border-r border-border'
                        )}
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
                  {emptyComponent || (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileX className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>{emptyMessage}</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabela */}
      {hideTableBorder ? (
        // Modo integrado: renderiza apenas a tabela sem wrapper overflow-auto
        // O DataTableShell é responsável pelo scroll
        <div className="relative w-full">
          {tableContent}
        </div>
      ) : (
        // Modo standalone: renderiza card com border e overflow-auto próprio
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="relative w-full overflow-auto">
            {tableContent}
          </div>
        </div>
      )}

      {/* Paginação */}
      {!hidePagination && pagination && pagination.totalPages > 0 && (
        <TablePagination
          variant="standalone"
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
