"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DialogFormShell } from "@/components/shared";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { priorities, statuses } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { actionCriarTarefa } from "../actions/tarefas-actions";
import type { TaskStatus, TaskLabel, TaskPriority } from "../domain";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [form, setForm] = React.useState<{
    title: string;
    status: TaskStatus;
    label: TaskLabel;
    priority: TaskPriority;
  }>({
    title: "",
    status: "todo",
    label: "feature",
    priority: "medium",
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setErrorMessage(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await actionCriarTarefa({
        title: form.title,
        status: form.status,
        label: form.label,
        priority: form.priority,
      });

      if (!result.success) {
        setErrorMessage(result.message || result.error || "Não foi possível criar a tarefa.");
        return;
      }

      setOpen(false);
      setForm({ title: "", status: "todo", label: "feature", priority: "medium" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          Nova tarefa
        </Button>
      </div>
      <div className="flex flex-col justify-between md:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar tarefas..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
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
          {table.getColumn("priority") && (
            <DataTableFacetedFilter
              column={table.getColumn("priority")}
              title="Prioridade"
              options={priorities}
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
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        </div>
      </div>

      <DialogFormShell
        open={open}
        onOpenChange={handleOpenChange}
        title="Nova tarefa"
        description="Preencha os dados para criar uma tarefa."
        footer={
          <Button type="submit" form="nova-tarefa-form" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        }
      >
        <form id="nova-tarefa-form" onSubmit={handleCreate} className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Ex: Revisar documento"
                className="mt-2 bg-white dark:bg-gray-950"
                required
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((s) => ({ ...s, status: value }))}
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950">
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((s) => ({ ...s, priority: value }))}
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950">
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Etiqueta</Label>
              <Select
                value={form.label}
                onValueChange={(value) => setForm((s) => ({ ...s, label: value }))}
              >
                <SelectTrigger className="mt-2 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950">
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Funcionalidade</SelectItem>
                  <SelectItem value="documentation">Documentação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
        </form>
      </DialogFormShell>
    </div>
  );
}
