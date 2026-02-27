"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusBadge } from "../shared/project-status-badge";
import { ProgressIndicator } from "../shared/progress-indicator";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Projeto } from "../../lib/domain";

interface ReportsProps {
  projetos: Projeto[];
}

const columns: ColumnDef<Projeto>[] = [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Projeto
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "clienteNome",
    header: "Cliente",
    cell: ({ row }) => row.original.clienteNome ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    filterFn: (row, _id, value) => value.includes(row.original.status),
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => (
      <PriorityIndicator prioridade={row.original.prioridade} />
    ),
  },
  {
    accessorKey: "dataInicio",
    header: "Início",
    cell: ({ row }) => {
      const d = row.original.dataInicio;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
  {
    accessorKey: "dataPrevisaoFim",
    header: "Prazo",
    cell: ({ row }) => {
      const d = row.original.dataPrevisaoFim;
      return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
    },
  },
  {
    accessorKey: "orcamento",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0!"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Orçamento
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.original.orcamento;
      if (val == null) return "—";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    },
  },
  {
    accessorKey: "progresso",
    header: "Progresso",
    cell: ({ row }) => (
      <div className="w-full">
        <ProgressIndicator value={row.original.progresso} />
      </div>
    ),
  },
];

export function Reports({ projetos }: ReportsProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: projetos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  return (
    <div className="space-y-4">
      <div className="z-0 mt-0 flex items-center justify-start gap-3 lg:-mt-14 lg:justify-end">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Buscar projetos..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-[250px] pl-8 md:w-[300px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Colunas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
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
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="text-muted-foreground text-sm">
          Exibindo {table.getFilteredRowModel().rows.length} de{" "}
          {projetos.length} projetos
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
