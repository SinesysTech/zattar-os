"use client";

import {
  cn } from '@/lib/utils';
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { actionCriarTarefa } from "../actions/tarefas-actions";
import { priorities, statuses } from "../constants";
import type { TaskStatus, TaskLabel, TaskPriority } from "../domain";

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDialog({ open, onOpenChange }: TaskDialogProps) {
    const router = useRouter();
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

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
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

            onOpenChange(false);
            setForm({ title: "", status: "todo", label: "feature", priority: "medium" });
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-lg  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
          >
            <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
              <DialogTitle>Nova tarefa</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
            <form id="nova-tarefa-form" onSubmit={handleCreate}>
                <div className={cn("grid grid-cols-1 inline-default md:grid-cols-2")}>
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            variant="glass"
                            value={form.title}
                            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                            placeholder="Ex: Revisar documento"
                            className="mt-2 bg-card"
                            required
                        />
                    </div>

                    <div>
                        <Label>Status</Label>
                        <Select
                            value={form.status}
                            onValueChange={(value) => setForm((s) => ({ ...s, status: value as TaskStatus }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
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
                            onValueChange={(value) => setForm((s) => ({ ...s, priority: value as TaskPriority }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
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
                            onValueChange={(value) => setForm((s) => ({ ...s, label: value as TaskLabel }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                <SelectItem value="bug">Bug</SelectItem>
                                <SelectItem value="feature">Funcionalidade</SelectItem>
                                <SelectItem value="documentation">Documentação</SelectItem>
                                <SelectItem value="audiencia">Audiência</SelectItem>
                                <SelectItem value="expediente">Expediente</SelectItem>
                                <SelectItem value="pericia">Perícia</SelectItem>
                                <SelectItem value="obrigacao">Obrigação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {errorMessage && (
                    <p className={cn("mt-4 text-body-sm text-destructive")} role="alert">
                        {errorMessage}
                    </p>
                )}
            </form>
            </div>
            <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <div className="flex items-center gap-2">
                <Button type="submit" form="nova-tarefa-form" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    );
}
