'use client';

/**
 * VirtualizedDataTable - Tabela com virtualização para grandes volumes de dados
 * 
 * Renderiza apenas as linhas visíveis na viewport usando @tanstack/react-virtual.
 * Ideal para datasets com milhares de linhas (ex: processos, transações).
 * 
 * PERFORMANCE:
 * - Renderiza ~15-20 linhas simultâneas (viewport)
 * - Suporta 10.000+ itens sem lag
 * - Scroll suave com overscan inteligente
 * 
 * @example
 * ```tsx
 * <VirtualizedDataTable
 *   data={largeDataset}
 *   columns={columns}
 *   estimateSize={60} // altura estimada da linha
 * />
 * ```
 */

import * as React from 'react';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Loader2, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export interface VirtualizedDataTableProps<TData> {
  // Dados
  data: TData[];
  columns: ColumnDef<TData>[];

  // Virtualização
  estimateSize?: number; // altura estimada de cada linha em pixels
  overscan?: number; // quantas linhas renderizar fora da viewport

  // Ordenação
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
  containerHeight?: number | string; // altura do container (default: 600px)
}

export function VirtualizedDataTable<TData>({
  data,
  columns,
  estimateSize = 60,
  overscan = 5,
  sorting,
  rowSelection,
  isLoading = false,
  error = null,
  onRowClick,
  emptyMessage = 'Nenhum resultado encontrado.',
  emptyComponent,
  className,
  containerHeight = 600,
}: VirtualizedDataTableProps<TData>) {
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: !!sorting,
    getRowId: rowSelection?.getRowId,
    enableRowSelection: !!rowSelection,
    state: {
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

  // Ref para o container scrollável
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const rows = table.getRowModel().rows;
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // Renderizar estado vazio
  if (!isLoading && !error && rows.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
        <div className="p-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      {/* Header fixo */}
      <div className="border-b bg-muted/50">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            const align = (header.column.columnDef.meta as { align?: 'left' | 'center' | 'right' })?.align || 'center';
            const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
            
            return (
              <div
                key={header.id}
                className={cn(
                  'px-4 py-3 text-sm font-medium text-muted-foreground',
                  alignClass,
                  'border-r border-border last:border-r-0'
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            );
          })}
        </div>
      </div>

      {/* Container scrollável */}
      <div
        ref={parentRef}
        className="relative overflow-auto"
        style={{
          height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
        }}
      >
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

        {!error && rows.length > 0 && (
          <div
            style={{
              height: `${totalSize}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Spacer superior */}
            {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}

            {/* Linhas virtualizadas */}
            {virtualRows.map((virtualRow: VirtualItem) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(el) => rowVirtualizer.measureElement(el)}
                  className={cn(
                    'grid border-b border-border last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
                    row.getIsSelected() && 'bg-primary/10',
                    virtualRow.index % 2 === 1 && 'bg-muted/30'
                  )}
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                  }}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (cell.column.columnDef.meta as { align?: 'left' | 'center' | 'right' })?.align || 'center';
                    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

                    return (
                      <div
                        key={cell.id}
                        className={cn(
                          'px-4 py-3 text-sm border-r border-border last:border-r-0',
                          alignClass
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Spacer inferior */}
            {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
          </div>
        )}
      </div>

      {/* Footer com informações */}
      {!isLoading && !error && rows.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            Exibindo {rows.length.toLocaleString('pt-BR')} registros
            {virtualRows.length > 0 && ` • Renderizados: ${virtualRows.length}`}
          </p>
        </div>
      )}
    </div>
  );
}
