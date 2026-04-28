'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskLabel, TaskPriority, TaskStatus } from '@/app/(authenticated)/tarefas';
import {
  actionCriarTarefa,
  actionMarcarComoDone,
  actionMarcarComoTodo,
} from '@/app/(authenticated)/tarefas';

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  'in progress': 'Em andamento',
  done: 'Concluída',
  canceled: 'Cancelada',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const LABEL_LABEL: Record<TaskLabel, string> = {
  bug: 'Bug',
  feature: 'Funcionalidade',
  documentation: 'Documentação',
  audiencia: 'Audiência',
  expediente: 'Expediente',
  obrigacao: 'Obrigação',
  pericia: 'Perícia',
};

interface TarefasWidgetProps {
  initialTasks: Task[];
}

export function TarefasWidget({ initialTasks }: TarefasWidgetProps) {
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
    title: '',
    status: 'todo',
    label: 'feature',
    priority: 'medium',
  });

  const handleToggleDone = (task: Task) => {
    const willBeDone = task.status !== 'done';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: willBeDone ? 'done' : 'todo' } : t))
    );

    startTransition(async () => {
      const result = willBeDone
        ? await actionMarcarComoDone({ id: task.id })
        : await actionMarcarComoTodo({ id: task.id });

      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setErrorMessage(result.message || result.error || 'Não foi possível atualizar a tarefa.');
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
        setErrorMessage(result.message || result.error || 'Não foi possível criar a tarefa.');
        return;
      }

      setOpen(false);
      setForm({ title: '', status: 'todo', label: 'feature', priority: 'medium' });
      router.refresh();
    });
  };

  return (
    <GlassPanel className="h-full">
      <CardHeader>
        <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <CheckSquare className="size-5" />
          Tarefas
        </CardTitle>
        <CardAction>
          <Button
            size="icon" aria-label="Nova tarefa"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="size-5" />
            <span className="sr-only">Nova tarefa</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
        {tasks.length === 0 ? (
          <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-8 text-center")}>
            <CheckSquare className="size-12 text-muted-foreground/55" />
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "mt-4 text-sm text-muted-foreground")}>Nenhuma tarefa por aqui!</p>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>
              Clique no <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-primary")}>+</span> para criar uma.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const done = task.status === 'done';
            return (
              <div
                key={task.id}
                className={cn(
                  /* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ 'flex items-start gap-3 rounded-md border bg-background p-3 transition-colors',
                  done && 'bg-muted/50'
                )}
              >
                <Checkbox checked={done} onCheckedChange={() => handleToggleDone(task)} className="mt-1" />
                <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "min-w-0 flex-1 space-y-2")}>
                  <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading>; leading-none sem token DS */ 'text-sm font-medium leading-none', done && 'text-muted-foreground line-through')}>
                    {task.title}
                  </p>
                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap items-center gap-2")}>
                    <Badge variant="secondary">{STATUS_LABEL[task.status]}</Badge>
                    <Badge variant="outline">{LABEL_LABEL[task.label]}</Badge>
                    <Badge variant="outline">Prioridade: {PRIORITY_LABEL[task.priority]}</Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setErrorMessage(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-lg glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados para criar uma nova tarefa</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form id="dashboard-nova-tarefa-form" onSubmit={handleCreate} className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "px-6 py-4")}>
              <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 gap-4 md:grid-cols-2")}>
                <div className="md:col-span-2">
                  <Label htmlFor="dashboard-task-title">Título</Label>
                  <Input
                    id="dashboard-task-title"
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Ex: Revisar documento"
                    className="mt-2 bg-background"
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm((s) => ({ ...s, status: value as TaskStatus }))}>
                    <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background">
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
                    <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Etiqueta</Label>
                  <Select value={form.label} onValueChange={(value) => setForm((s) => ({ ...s, label: value as TaskLabel }))}>
                    <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Funcionalidade</SelectItem>
                      <SelectItem value="documentation">Documentação</SelectItem>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="expediente">Expediente</SelectItem>
                      <SelectItem value="obrigacao">Obrigação</SelectItem>
                      <SelectItem value="pericia">Perícia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errorMessage && (
                <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "mt-4 text-sm text-destructive")} role="alert">{errorMessage}</p>
              )}
            </form>
          </DialogBody>
          <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <Button type="submit" form="dashboard-nova-tarefa-form" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GlassPanel>
  );
}
