"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFormShell } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Task, TaskLabel, TaskPriority, TaskStatus } from "@/app/(dashboard)/tarefas/domain";
import { actionCriarTarefa, actionMarcarComoDone, actionMarcarComoTodo } from "@/app/(dashboard)/tarefas/actions/tarefas-actions";

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  "in progress": "Em andamento",
  done: "Concluída",
  canceled: "Cancelada",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const LABEL_LABEL: Record<TaskLabel, string> = {
  bug: "Bug",
  feature: "Funcionalidade",
  documentation: "Documentação",
};

export function RecentTasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

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

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setErrorMessage(null);
  };

  const handleToggleDone = (task: Task) => {
    const willBeDone = task.status !== "done";

    // Otimismo: atualiza UI na hora
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: willBeDone ? "done" : "todo" } : t))
    );

    startTransition(async () => {
      const result = willBeDone
        ? await actionMarcarComoDone({ id: task.id })
        : await actionMarcarComoTodo({ id: task.id });

      if (!result.success) {
        // rollback simples
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setErrorMessage(result.message || result.error || "Não foi possível atualizar a tarefa.");
        return;
      }

      router.refresh();
    });
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tarefas</CardTitle>
        <CardDescription>Acompanhe e gerencie suas tarefas recentes.</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-950"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-muted-foreground text-sm">Nenhuma tarefa encontrada.</div>
        ) : (
          tasks.map((task) => {
            const done = task.status === "done";
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border bg-white p-3 transition-colors dark:bg-gray-950",
                  done && "bg-muted/50"
                )}
              >
                <Checkbox checked={done} onCheckedChange={() => handleToggleDone(task)} className="mt-1" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className={cn("text-sm font-medium leading-none", done && "text-muted-foreground line-through")}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{STATUS_LABEL[task.status]}</Badge>
                    <Badge variant="outline">{LABEL_LABEL[task.label]}</Badge>
                    <Badge variant="outline">Prioridade: {PRIORITY_LABEL[task.priority]}</Badge>
                    <span className="text-muted-foreground text-xs">{task.id}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <DialogFormShell
        open={open}
        onOpenChange={handleOpenChange}
        title="Nova tarefa"
        description="Preencha os dados para criar uma tarefa."
        footer={
          <Button type="submit" form="dashboard-nova-tarefa-form" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        }
      >
        <form id="dashboard-nova-tarefa-form" onSubmit={handleCreate} className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="dashboard-task-title">Título</Label>
              <Input
                id="dashboard-task-title"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Ex: Revisar documento"
                className="mt-2 bg-white dark:bg-gray-950"
                required
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((s) => ({ ...s, status: value as TaskStatus }))}>
                <SelectTrigger className="mt-2 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950">
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in progress">Em andamento</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((s) => ({ ...s, priority: value as TaskPriority }))}>
                <SelectTrigger className="mt-2 bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950">
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Etiqueta</Label>
              <Select value={form.label} onValueChange={(value) => setForm((s) => ({ ...s, label: value as TaskLabel }))}>
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
    </Card>
  );
}


