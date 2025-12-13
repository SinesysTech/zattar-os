'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Header,
  flexRender,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
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

import { DataTablePagination } from './data-table-pagination';
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { cn } from '@/lib/utils';

// --- Types ---
interface DataTableProps<TData, TValue> {
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
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  
  isLoading?: boolean;
  error?: string | null;

  // New features
  actionSlot?: React.ReactNode;
  /** Valor do campo de busca (controlado externamente). */
  searchValue?: string;
  /** Handler do campo de busca (para refetch server-side, por exemplo). */
  onSearchValueChange?: (value: string) => void;
  /** Slot para filtros adicionais (ex.: Situação, Tipo de pessoa). */
  filtersSlot?: React.ReactNode;
}

// --- Draggable Header Component ---
function DraggableTableHeader<TData>({
  header,
  className,
}: {
  header: Header<TData, unknown>;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: header.column.id, disabled: header.column.id === 'select' });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && 'bg-accent/50')}
      {...attributes}
      {...listeners}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>
  );
}

// --- Main DataTable Component ---
export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  isLoading,
  error,
  actionSlot,
  searchValue,
  onSearchValueChange,
  filtersSlot,
}: DataTableProps<TData, TValue>) {
  // --- Local State (for uncontrolled mode) ---
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => [
    'select',
    ...columns
      .map(
        (column) =>
          column.id ||
          ((column as ColumnDef<TData> & { accessorKey?: string }).accessorKey as string)
      )
      .filter(Boolean),
  ]);
  
  // Density State
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // --- Derived State ---
  const sorting = controlledSorting ?? internalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  
  const paginationState: PaginationState | undefined = pagination
    ? {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
    : undefined;

  const selectionColumn = React.useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 44,
    }),
    []
  );

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(
    () => [selectionColumn, ...(columns as unknown as ColumnDef<TData, unknown>[])],
    [columns, selectionColumn]
  );

  // --- Table Instance ---
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnOrder,
      pagination: paginationState,
    },
    // Flags for server-side
    manualPagination: !!pagination,
    manualSorting: !!controlledSorting,
    manualFiltering: !!controlledColumnFilters,
    pageCount: pagination?.totalPages ?? -1,

    // Handlers
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange ?? setInternalSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    
    // Pagination Handler (Adapter)
    onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
            const newState = updater(paginationState || { pageIndex: 0, pageSize: 10 });
            pagination?.onPageChange(newState.pageIndex);
            pagination?.onPageSizeChange(newState.pageSize);
        } else {
             pagination?.onPageChange(updater.pageIndex);
             pagination?.onPageSizeChange(updater.pageSize);
        }
    },

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Client-side filtering if not manual
    getPaginationRowModel: getPaginationRowModel(), // Client-side pagination if not manual
    getSortedRowModel: getSortedRowModel(),     // Client-side sorting if not manual
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Handle Drag End
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over) return;
    // keep selection checkbox column pinned at the start
    if (active.id === 'select' || over.id === 'select') return;
    if (active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  }

  // Calculate cell padding based on density
  const getCellPadding = () => {
      switch (density) {
          case 'compact': return 'py-1 px-2';
          case 'relaxed': return 'py-4 px-4';
          default: return 'py-2 px-2'; // standard
      }
  }

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Outer Card Container for Premium Look */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Toolbar: vertical padding only so separators can go full-width */}
          <div className="pt-6 pb-4">
            <DataTableAdvancedToolbar 
                table={table} 
                actionSlot={actionSlot}
                density={density}
                onDensityChange={setDensity}
                searchValue={searchValue}
                onSearchValueChange={onSearchValueChange}
                filtersSlot={filtersSlot}
            />
          </div>
          
          <div className="relative border-t">
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            >
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                    >
                        {headerGroup.headers.map((header, index) => (
                        <DraggableTableHeader
                          key={header.id}
                          header={header}
                          className={cn(
                            getCellPadding(),
                            index === 0 && 'pl-6',
                            index === headerGroup.headers.length - 1 && 'pr-6'
                          )}
                        />
                        ))}
                    </SortableContext>
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {error ? (
                    <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 px-6 text-center text-destructive"
                    >
                        {error}
                    </TableCell>
                    </TableRow>
                ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                    >
                        {row.getVisibleCells().map((cell, index, all) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            getCellPadding(),
                            index === 0 && 'pl-6',
                            index === all.length - 1 && 'pr-6'
                          )}
                        >
                            {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                            )}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 px-6 text-center"
                    >
                        No results.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </DndContext>
          </div>
          {/* Pagination: full-width divider + consistent horizontal padding */}
          <div className="border-t">
            <div className="px-6 py-4">
              <DataTablePagination table={table} />
            </div>
          </div>
      </div>
    </div>
  );
}
