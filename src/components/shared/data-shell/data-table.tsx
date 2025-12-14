'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnFiltersState,
  Header,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  Table as TanstackTable,
} from '@tanstack/react-table';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type DataTableDensity = 'compact' | 'standard' | 'relaxed';

export type DataTableSortDirection = 'asc' | 'desc' | null;

export interface DataTableSortingAdapter {
  columnId: string | null;
  direction: DataTableSortDirection;
  onSortingChange: (
    columnId: string | null,
    direction: DataTableSortDirection
  ) => void;
}

export interface DataTableProps<TData, TValue> {
  /** Unique ID for the table (used for aria-controls) */
  id?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Server-side / Controlled State
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: SortingState | DataTableSortingAdapter;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  isLoading?: boolean;
  error?: string | null;

  // UX
  density?: DataTableDensity;
  onDensityChange?: (density: DataTableDensity) => void;
  rowSelection?: {
    state: RowSelectionState;
    onRowSelectionChange: (state: RowSelectionState) => void;
    getRowId?: (row: TData) => string;
  };
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode;
  hidePagination?: boolean;
  hideTableBorder?: boolean;
  hideColumnBorders?: boolean;
  /**
   * Estratégia de layout da tabela.
   * - 'fixed' (default): usa algoritmo fixo para larguras estáveis.
   * - 'auto': respeita larguras intrínsecas/min-w do conteúdo.
   */
  tableLayout?: 'auto' | 'fixed';
  /**
   * Habilita zebra striping (cores alternadas nas linhas).
   * @default true
   */
  striped?: boolean;
  /**
   * Escape hatch para passar `meta` (ex.: lookups) para cells/headers.
   */
  options?: {
    meta?: Record<string, unknown>;
  };
  onTableReady?: (table: TanstackTable<TData>) => void;
  className?: string;
  /** Accessible label for the table */
  ariaLabel?: string;
}

// =============================================================================
// DRAGGABLE HEADER
// =============================================================================

interface DraggableTableHeaderProps<TData> {
  header: Header<TData, unknown>;
  className?: string;
  style?: React.CSSProperties;
}

function DraggableTableHeader<TData>({
  header,
  className,
  style: extraStyle,
}: DraggableTableHeaderProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
    disabled: header.column.id === 'select',
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
    ...(extraStyle ?? {}),
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && 'bg-accent/50')}
      {...attributes}
      {...listeners}
    >
      <div className="min-w-0 text-muted-foreground">
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    </TableHead>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataTable<TData, TValue>({
  id,
  columns,
  data,
  pagination,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  isLoading,
  error,
  density: densityProp,
  rowSelection,
  onRowClick,
  emptyMessage = 'Nenhum resultado.',
  emptyComponent,
  hideTableBorder,
  hideColumnBorders,
  tableLayout = 'fixed',
  striped = true,
  options,
  onTableReady,
  className,
  ariaLabel = 'Tabela de dados',
}: DataTableProps<TData, TValue>) {
  // Generate stable ID for accessibility
  const tableId = React.useId();
  const resolvedId = id ?? tableId;
  const errorId = `${resolvedId}-error`;

  // Internal state
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);

  const density = densityProp ?? 'standard';

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => [
    'select',
    ...columns
      .map(
        (column) =>
          column.id ||
          ((column as ColumnDef<TData> & { accessorKey?: string })
            .accessorKey as string)
      )
      .filter(Boolean),
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Determine if using adapter pattern
  const isSortingAdapter =
    controlledSorting &&
    !Array.isArray(controlledSorting) &&
    typeof (controlledSorting as DataTableSortingAdapter).onSortingChange ===
      'function';

  const sortingState: SortingState = React.useMemo(() => {
    if (isSortingAdapter) {
      const adapter = controlledSorting as DataTableSortingAdapter;
      if (adapter.columnId && adapter.direction) {
        return [{ id: adapter.columnId, desc: adapter.direction === 'desc' }];
      }
      return [];
    }
    return (controlledSorting as SortingState | undefined) ?? internalSorting;
  }, [controlledSorting, internalSorting, isSortingAdapter]);

  const columnFilters = controlledColumnFilters ?? internalColumnFilters;

  const paginationState: PaginationState | undefined = pagination
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
    : undefined;

  // Selection column
  const selectionColumn = React.useMemo<ColumnDef<TData, unknown> | null>(() => {
    if (!rowSelection) return null;
    return {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todas as linhas da página"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Selecionar linha ${row.index + 1}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 44,
    };
  }, [rowSelection]);

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    const base = columns as unknown as ColumnDef<TData, unknown>[];
    return selectionColumn ? [selectionColumn, ...base] : base;
  }, [columns, selectionColumn]);

  // Create table instance
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: sortingState,
      columnVisibility,
      rowSelection: rowSelection?.state ?? internalRowSelection,
      columnFilters,
      columnOrder,
      pagination: paginationState,
    },
    manualPagination: !!pagination,
    manualSorting: !!controlledSorting,
    manualFiltering: !!controlledColumnFilters,
    pageCount: pagination?.totalPages ?? -1,
    enableRowSelection: !!rowSelection,
    getRowId: rowSelection?.getRowId,
    onRowSelectionChange: (updater) => {
      if (rowSelection) {
        const next =
          typeof updater === 'function' ? updater(rowSelection.state) : updater;
        rowSelection.onRowSelectionChange(next);
        return;
      }
      setInternalRowSelection((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      );
    },
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(sortingState) : updater;

      if (isSortingAdapter) {
        const adapter = controlledSorting as DataTableSortingAdapter;
        if (next.length === 0) {
          adapter.onSortingChange(null, null);
          return;
        }
        const sort = next[0];
        adapter.onSortingChange(sort.id, sort.desc ? 'desc' : 'asc');
        return;
      }

      if (onSortingChange) {
        onSortingChange(next);
        return;
      }
      setInternalSorting(next);
    },
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      if (!pagination) return;

      if (typeof updater === 'function') {
        const newState = updater(
          paginationState || { pageIndex: 0, pageSize: 10 }
        );
        pagination.onPageChange(newState.pageIndex);
        pagination.onPageSizeChange(newState.pageSize);
        return;
      }

      pagination.onPageChange(updater.pageIndex);
      pagination.onPageSizeChange(updater.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: options?.meta,
  });

  // Notify parent when table is ready
  React.useEffect(() => {
    onTableReady?.(table);
  }, [onTableReady, table]);

  // Drag and drop handler
  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id === 'select' || over.id === 'select') return;
    if (active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  }, []);

  // Cell padding based on density
  const cellPadding = React.useMemo(() => {
    switch (density) {
      case 'compact':
        return 'py-1 px-2';
      case 'relaxed':
        return 'py-4 px-4';
      default:
        return 'py-2 px-2';
    }
  }, [density]);

  const tableInner = (
    <div
      data-slot="data-table"
      className={cn('relative w-full', className)}
      aria-busy={isLoading ? 'true' : 'false'}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/50"
          role="status"
          aria-label="Carregando dados"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table
          id={resolvedId}
          aria-label={ariaLabel}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full',
            tableLayout === 'fixed' ? 'table-fixed' : 'table-auto'
          )}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header, index: number) => {
                    const columnSize = header.column.columnDef.size as
                      | number
                      | undefined;
                    const maxWidth = columnSize ? `${columnSize}px` : undefined;
                    // Headers são sempre centralizados
                    const alignClass = 'text-center';

                    const hasBorder =
                      !hideColumnBorders &&
                      index < headerGroup.headers.length - 1;

                    return (
                      <DraggableTableHeader
                        key={header.id}
                        header={header}
                        className={cn(
                          cellPadding,
                          alignClass,
                          index === 0 && 'pl-6',
                          index === headerGroup.headers.length - 1 && 'pr-6',
                          hasBorder && 'border-r border-border'
                        )}
                        style={
                          maxWidth
                            ? ({ maxWidth, width: maxWidth } as React.CSSProperties)
                            : undefined
                        }
                      />
                    );
                  })}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {error ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 px-6 text-center text-destructive"
                >
                  <span id={errorId} role="alert">
                    {error}
                  </span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'group',
                    onRowClick && 'cursor-pointer',
                    // Zebra striping: linhas ímpares com fundo sutil
                    striped && rowIndex % 2 === 1 && 'bg-muted/30'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? 'button' : undefined}
                >
                  {row.getVisibleCells().map((cell, index, all) => {
                    const columnSize = cell.column.columnDef.size as
                      | number
                      | undefined;
                    const maxWidth = columnSize ? `${columnSize}px` : undefined;
                    const meta = cell.column.columnDef.meta as
                      | { align?: 'left' | 'center' | 'right' }
                      | undefined;
                    const align = meta?.align ?? 'center';
                    const alignClass =
                      align === 'left'
                        ? 'text-left'
                        : align === 'right'
                          ? 'text-right'
                          : 'text-center';

                    const hasBorder =
                      !hideColumnBorders && index < all.length - 1;

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cellPadding,
                          alignClass,
                          index === 0 && 'pl-6',
                          index === all.length - 1 && 'pr-6',
                          hasBorder && 'border-r border-border'
                        )}
                        style={
                          maxWidth
                            ? ({ maxWidth, width: maxWidth } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <div className="min-w-0">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 px-6 text-center"
                >
                  {emptyComponent ?? emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );

  if (hideTableBorder) {
    return tableInner;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="w-full overflow-auto">{tableInner}</div>
    </div>
  );
}
