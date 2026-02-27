"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { TaskStatusBadge } from "../shared/project-status-badge";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Tarefa } from "../../lib/domain";

interface TaskListProps {
  tarefas: Tarefa[];
}

const columns: ColumnDef<Tarefa>[] = [
  {
    accessorKey: "titulo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tarefa
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "projetoNome",
    header: "Projeto",
    cell: ({ row }) => row.original.projetoNome ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <TaskStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => (
      <PriorityIndicator prioridade={row.original.prioridade} />
    ),
  },
  {
    accessorKey: "responsavelNome",
    header: "Responsável",
    cell: ({ row }) => {
      const nome = row.original.responsavelNome;
      if (!nome) return "—";
      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage
              src={row.original.responsavelAvatar ?? ""}
              alt={nome}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{nome}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dataPrazo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Prazo
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = row.original.dataPrazo;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
];

export function TaskList({ tarefas }: TaskListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: tarefas,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} tarefas
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
