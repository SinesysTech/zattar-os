"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, KanbanSquare, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ComboboxOption } from "@/components/ui/combobox";
import { TaskBoard } from "../../../components/tasks/task-board";
import { TaskList } from "../../../components/tasks/task-list";
import { TaskFormDialog } from "../../../components/tasks/task-form";
import type { Projeto, Tarefa } from "../../../lib/domain";

interface ProjectTasksViewProps {
  projeto: Projeto;
  tarefas: Tarefa[];
  membros: ComboboxOption[];
  usuarioAtualId: number;
}

export function ProjectTasksView({
  projeto,
  tarefas,
  membros,
  usuarioAtualId,
}: ProjectTasksViewProps) {
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">(
    "kanban"
  );
  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/app/project-management/projects/${projeto.id}`}
            >
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tarefas
            </h1>
            <p className="text-muted-foreground text-sm">
              {projeto.nome}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              if (v) setViewMode(v as "kanban" | "list");
            }}
            variant="outline"
          >
            <ToggleGroupItem
              value="kanban"
              aria-label="Visualização Kanban"
            >
              <KanbanSquare className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="Visualização em lista"
            >
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 size-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <TaskBoard tarefas={tarefas} />
      ) : (
        <TaskList tarefas={tarefas} />
      )}

      <TaskFormDialog
        projetoId={projeto.id}
        membros={membros}
        usuarioAtualId={usuarioAtualId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
