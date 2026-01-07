"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { FileUp, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { statuses } from "./data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push("/app/assinatura-digital/documentos/novo")}
        >
          <FileUp className="size-4" />
          Novo documento
        </Button>
      </div>
      <div className="flex flex-col justify-between md:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar documentos..."
              value={(table.getColumn("titulo")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("titulo")?.setFilterValue(event.target.value)}
              className="h-8 w-[150px] bg-white ps-8 dark:bg-gray-950 lg:w-[250px]"
            />
          </div>
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statuses}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-white hover:bg-white/90 dark:bg-gray-950"
              onClick={() => table.resetColumnFilters()}>
              Limpar
              <X />
            </Button>
          )}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <DataTableViewOptions table={table} />
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/app/assinatura-digital/documentos/novo")}
          >
            <FileUp className="size-4" />
            Novo documento
          </Button>
        </div>
      </div>
    </div>
  );
}
