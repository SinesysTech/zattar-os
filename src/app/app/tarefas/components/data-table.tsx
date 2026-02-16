"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { DataShell, DataTableToolbar } from "@/components/shared/data-shell";
import { ViewModePopover } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { X, List } from "lucide-react";

import { priorities, statuses, labels } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { TaskDialog } from "./task-dialog";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // TanStack Table's useReactTable returns functions that cannot be memoized by React Compiler.
  // This is expected and safe - the library handles memoization internally.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    initialState: {
      pagination: {
        pageSize: 25
      }
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <>
      <DataShell
        footer={<DataTablePagination table={table} />}
        header={
          <DataTableToolbar
            table={table}
            title="Tarefas"
            actionButton={{
              label: "Nova tarefa",
              onClick: () => setIsCreateDialogOpen(true),
            }}
            viewModeSlot={
              <ViewModePopover
                value="lista"
                onValueChange={() => { }}
                options={[
                  { value: 'lista', label: 'Lista', icon: List }
                ]}
                className="hidden lg:flex" // Keep it aligned, technically tasks uses list only for now
              />
            }
            filtersSlot={
              <>
                {table.getColumn("status") && (
                  <DataTableFacetedFilter
                    column={table.getColumn("status")}
                    title="Status"
                    options={statuses}
                  />
                )}
                {table.getColumn("priority") && (
                  <DataTableFacetedFilter
                    column={table.getColumn("priority")}
                    title="Prioridade"
                    options={priorities}
                  />
                )}
                {table.getColumn("label") && (
                  <DataTableFacetedFilter
                    column={table.getColumn("label")}
                    title="Tipo"
                    options={labels}
                  />
                )}
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-card hover:bg-accent"
                    onClick={() => table.resetColumnFilters()}
                  >
                    Limpar
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            }
          />
        }
      >
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DataShell>

      <TaskDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
}
