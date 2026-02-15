"use client";

import * as React from "react";
import {
  GripVertical,
  Paperclip,
  MessageSquare,
  PlusCircleIcon,
  CheckIcon,
  SlidersHorizontalIcon,
  SearchIcon,
  MoreHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Kanban from "@/components/ui/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { DialogFormShell } from "@/components/shared/dialog-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AddAssigne from "./add-assigne";
import type { KanbanBoardData } from "../domain";
import {
  actionCriarColunaKanban,
  actionCriarTarefaKanban,
  actionExcluirColunaKanban,
  actionSincronizarKanban,
} from "../actions/kanban-actions";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
  progress: number;
  attachments?: number;
  comments?: number;
  users: TaskUser[];
}

interface TaskUser {
  name: string;
  src: string;
  alt?: string;
  fallback?: string;
}

type KanbanBoardProps = { initialBoard: KanbanBoardData };

export default function KanbanBoard({ initialBoard }: KanbanBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const syncTimeoutRef = React.useRef<number | null>(null);
  const creatingColumnRef = React.useRef(false);
  const creatingTaskRef = React.useRef(false);

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    return [...initialBoard.columns]
      .sort((a, b) => a.position - b.position)
      .map((c) => c.id);
  });

  const [columns, setColumns] = React.useState<Record<string, Task[]>>(initialBoard.tasksByColumn);

  const [columnTitles, setColumnTitles] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const col of initialBoard.columns) {
      initial[col.id] = col.title;
    }
    return initial;
  });

  const [filteredColumns, setFilteredColumns] = React.useState(columns);

  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterPriority, setFilterPriority] = React.useState<string | null>(null);
  const [filterUser, setFilterUser] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = React.useState(false);
  const [newColumnTitle, setNewColumnTitle] = React.useState("");
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [columnToDelete, setColumnToDelete] = React.useState<string | null>(null);
  const [novoPopoverOpen, setNovoPopoverOpen] = React.useState(false);

  const [isNewTaskOpen, setIsNewTaskOpen] = React.useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = React.useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<"low" | "medium" | "high">("medium");

  const getActiveFilters = () => {
    const filters = [];
    if (filterStatus) filters.push(filterStatus);
    if (filterPriority) filters.push(filterPriority);
    if (filterUser) filters.push(filterUser);
    return filters;
  };

  const [searchQuery, setSearchQuery] = React.useState("");

  const filterTasks = React.useCallback(() => {
    const filtered: Record<string, Task[]> = { ...columns };

    Object.keys(filtered).forEach((columnKey) => {
      filtered[columnKey] = columns[columnKey].filter((task) => {
        const searchMatch =
          searchQuery === "" ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());

        const statusMatch =
          !filterStatus ||
          (filterStatus === "completed"
            ? task.progress === 100
            : filterStatus === "inProgress"
              ? task.progress > 0 && task.progress < 100
              : filterStatus === "notStarted"
                ? task.progress === 0
                : true);

        const priorityMatch = !filterPriority || task.priority === filterPriority;

        const userMatch = !filterUser || task.users.some((user) => user.name === filterUser);

        return searchMatch && statusMatch && priorityMatch && userMatch;
      });
    });

    setFilteredColumns(filtered);
  }, [columns, searchQuery, filterStatus, filterPriority, filterUser]);

  React.useEffect(() => {
    filterTasks();
  }, [filterTasks]);

  const buildSyncPayload = React.useCallback(
    (value: Record<string, Task[]>) => {
      // Importante: usar uma ordem estável para evitar hydration mismatch.
      // `columnOrder` garante consistência entre SSR e client.
      const ordered = columnOrder.filter((id) => id in value);
      const extras = Object.keys(value).filter((id) => !ordered.includes(id));
      const columnIds = [...ordered, ...extras];

      const columnsPayload = columnIds.map((id, index) => ({
        id,
        title: columnTitles[id] ?? "Coluna",
        position: index,
      }));

      const tasksPayload = columnIds.flatMap((columnId) =>
        value[columnId].map((task, index) => ({
          id: task.id,
          columnId,
          position: index,
        }))
      );

      return { columns: columnsPayload, tasks: tasksPayload };
    },
    [columnOrder, columnTitles]
  );

  const scheduleSync = React.useCallback(
    (value: Record<string, Task[]>) => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        const payload = buildSyncPayload(value);
        startTransition(async () => {
          const result = await actionSincronizarKanban(payload);
          if (!result.success) {
            setSyncError(result.message || result.error || "Falha ao salvar o Kanban.");
            return;
          }
          setSyncError(null);
          router.refresh();
        });
      }, 600);
    },
    [buildSyncPayload, router, startTransition]
  );

  const handleBoardValueChange = (next: Record<string, Task[]>) => {
    // `next` vem do Kanban (Dnd), então a ordem das keys reflete o drag-drop.
    // Persistimos essa ordem localmente para render e sync.
    setColumnOrder(Object.keys(next));
    setColumns(next);
    setFilteredColumns(next);
    scheduleSync(next);
  };

  const FilterDropdown = () => {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-background">
            <SlidersHorizontalIcon />
            <span className="hidden lg:inline">
              {getActiveFilters().length > 0 ? (
                <>Filtros ({getActiveFilters().length})</>
              ) : (
                "Filtros"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Buscar filtros..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

              {/* Status Filters */}
              <CommandGroup heading="Status">
                <CommandItem
                  onSelect={() => {
                    setFilterStatus("completed");
                    setOpen(false);
                  }}>
                  <span>Concluídas</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setFilterStatus("inProgress");
                    setOpen(false);
                  }}>
                  <span>Em andamento</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setFilterStatus("notStarted");
                    setOpen(false);
                  }}>
                  <span>Não iniciadas</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Priority Filters */}
              <CommandGroup heading="Prioridade">
                <CommandItem
                  onSelect={() => {
                    setFilterPriority("high");
                    setOpen(false);
                  }}>
                  <span>Alta</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setFilterPriority("medium");
                    setOpen(false);
                  }}>
                  <span>Média</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setFilterPriority("low");
                    setOpen(false);
                  }}>
                  <span>Baixa</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* User Filters */}
              <CommandGroup heading="Atribuído a">
                {Array.from(
                  new Set(
                    Object.values(columns).flatMap((tasks) =>
                      tasks.flatMap((task) => task.users.map((user) => user.name))
                    )
                  )
                ).map((userName) => (
                  <CommandItem
                    key={userName}
                    onSelect={() => {
                      setFilterUser(userName);
                      setOpen(false);
                    }}>
                    {(() => {
                      const match = Object.values(columns)
                        .flat()
                        .find((task) => task.users.some((user) => user.name === userName));
                      const src = match?.users.find((u) => u.name === userName)?.src;
                      return (
                        <Avatar className="mr-2 h-5 w-5">
                          <AvatarImage
                            src={src}
                            alt={userName}
                          />
                          <AvatarFallback>{userName[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <span>{userName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* Clear Filters */}
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setFilterStatus(null);
                    setFilterPriority(null);
                    setFilterUser(null);
                    setOpen(false);
                  }}
                  className="justify-center text-center">
                  Limpar filtros
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  function addColumn(title: string) {
    if (creatingColumnRef.current) return;
    if (!title.trim()) return;

    creatingColumnRef.current = true;
    startTransition(async () => {
      try {
        const result = await actionCriarColunaKanban({ title });
        if (!result.success) {
          setSyncError(result.message || result.error || "Falha ao criar coluna.");
          return;
        }

        const col = result.data;

        // Atualiza imediatamente para o usuário ver sem precisar clicar de novo.
        setColumnOrder((prev) => [...prev, col.id]);
        setColumns((prev) => ({ ...prev, [col.id]: [] }));
        setFilteredColumns((prev) => ({ ...prev, [col.id]: [] }));
        setColumnTitles((prev) => ({ ...prev, [col.id]: col.title }));

        setNewColumnTitle("");
        setIsNewColumnModalOpen(false);
        setSyncError(null);
        router.refresh();
      } finally {
        creatingColumnRef.current = false;
      }
    });
  }

  const openNewTask = (columnId?: string) => {
    const firstColumn = columnOrder[0] ?? "";
    setNewTaskColumnId(columnId ?? firstColumn);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setIsNewTaskOpen(true);
  };

  const handleCreateTask = () => {
    if (!newTaskColumnId || !newTaskTitle.trim()) return;
    if (creatingTaskRef.current) return;

    creatingTaskRef.current = true;

    startTransition(async () => {
      try {
        const result = await actionCriarTarefaKanban({
          columnId: newTaskColumnId,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() ? newTaskDescription.trim() : undefined,
          priority: newTaskPriority,
        });

        if (!result.success) {
          setSyncError(result.message || result.error || "Falha ao criar tarefa.");
          return;
        }

        const created = result.data;
        setColumns((prev) => ({
          ...prev,
          [created.columnId]: [...(prev[created.columnId] ?? []), created.task as Task],
        }));
        setFilteredColumns((prev) => ({
          ...prev,
          [created.columnId]: [...(prev[created.columnId] ?? []), created.task as Task],
        }));

        setIsNewTaskOpen(false);
        setSyncError(null);
        router.refresh();
      } finally {
        creatingTaskRef.current = false;
      }
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    startTransition(async () => {
      const result = await actionExcluirColunaKanban({ columnId });
      if (!result.success) {
        setSyncError(result.message || result.error || "Falha ao excluir coluna.");
        return;
      }

      setColumnOrder((prev) => prev.filter((id) => id !== columnId));
      setColumns((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
      setFilteredColumns((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
      setColumnTitles((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });

      setColumnToDelete(null);
      setSyncError(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden w-auto lg:block">
            <SearchIcon className="absolute top-2.5 left-3 size-4 opacity-50" />
            <Input
              placeholder="Buscar tarefas..."
              className="bg-background ps-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="none lg:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" aria-label="Buscar" className="bg-background">
                  <SearchIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="end">
                <Input
                  placeholder="Buscar tarefas..."
                  className="bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <FilterDropdown />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AddAssigne />

          <Popover open={novoPopoverOpen} onOpenChange={setNovoPopoverOpen}>
            <PopoverTrigger asChild>
              <Button disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Novo</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="end">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setNovoPopoverOpen(false);
                    openNewTask();
                  }}
                >
                  Nova tarefa
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setNovoPopoverOpen(false);
                    setIsNewColumnModalOpen(true);
                  }}
                >
                  Novo board
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {syncError && (
        <div className="text-sm text-destructive" role="alert">
          {syncError}
        </div>
      )}

      <Kanban.Root
        value={filteredColumns}
        onValueChange={handleBoardValueChange}
        getItemValue={(item) => item.id}>
        <Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
          {columnOrder.map((columnValue) => {
            const tasks = filteredColumns[columnValue] ?? [];
            return (
              <Kanban.Column
                key={columnValue}
                value={columnValue}
                className="w-[340px] min-w-[340px] rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{columnTitles[columnValue]}</span>
                    <Badge variant="outline">{tasks.length}</Badge>
                  </div>
                  <div className="flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Opções da coluna"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setColumnToDelete(columnValue)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir coluna
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Kanban.ColumnHandle asChild>
                      <Button variant="ghost" size="icon">
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </Kanban.ColumnHandle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openNewTask(columnValue)}
                          aria-label="Adicionar tarefa"
                        >
                          <PlusCircleIcon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adicionar tarefa</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {tasks.length > 0 ? (
                  <div className="flex flex-col gap-2 p-0.5">
                    {tasks.map((task) => (
                      <Kanban.Item key={task.id} value={task.id} asHandle asChild>
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold">
                              {task.title}
                            </CardTitle>
                            <CardDescription>
                              {task.description?.trim() ? task.description : "Sem descrição."}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-muted-foreground flex items-center justify-between text-sm">
                              <div className="flex -space-x-2 overflow-hidden">
                                {task.users.map((user, index) => (
                                  <Avatar key={index} className="border-background border-2">
                                    <AvatarImage
                                      src={user.src || "/placeholder.svg"}
                                      alt={user.alt}
                                    />
                                    <AvatarFallback>{user.fallback}</AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 rounded-lg border p-1">
                                <div className="relative size-4">
                                  <svg
                                    className="size-full -rotate-90"
                                    viewBox="0 0 36 36"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="16"
                                      fill="none"
                                      className="stroke-current text-gray-200 dark:text-neutral-700"
                                      stroke-width="2"></circle>
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="16"
                                      fill="none"
                                      className={cn("stroke-current", {
                                        "text-green-600!": task.progress === 100,
                                        "text-orange-500!":
                                          task.progress > 50 && task.progress < 100
                                      })}
                                      stroke-width="2"
                                      strokeDasharray={2 * Math.PI * 16}
                                      strokeDashoffset={
                                        2 * Math.PI * 16 -
                                        (2 * Math.PI * 16 * task.progress) / 100
                                      }
                                      stroke-linecap="round"></circle>
                                  </svg>
                                </div>
                                {`${task.progress}%`}
                              </div>
                            </div>
                            <Separator />
                            <div className="text-muted-foreground flex items-center justify-between text-sm">
                              <Badge className="capitalize" variant="outline">
                                {task.priority}
                              </Badge>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Paperclip className="h-4 w-4" />
                                  <span>{task.attachments ?? 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{task.comments ?? 0}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Kanban.Item>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center gap-4 pt-4">
                    <div className="text-muted-foreground text-sm">Nenhuma tarefa aqui.</div>
                    <Button variant="outline" onClick={() => openNewTask(columnValue)}>
                      Adicionar tarefa
                    </Button>
                  </div>
                )}
              </Kanban.Column>
            );
          })}
        </Kanban.Board>
        <Kanban.Overlay>
          <div className="bg-primary/10 size-full rounded-md" />
        </Kanban.Overlay>
      </Kanban.Root>

      <AlertDialog open={columnToDelete != null} onOpenChange={(open) => (!open ? setColumnToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a coluna{" "}
              <span className="font-medium text-foreground">
                {columnToDelete ? (columnTitles[columnToDelete] ?? "Coluna") : "Coluna"}
              </span>
              ? As tarefas dessa coluna serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || !columnToDelete}
              onClick={() => {
                if (!columnToDelete) return;
                handleDeleteColumn(columnToDelete);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogFormShell
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        title="Nova tarefa"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewTaskOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={isPending || !newTaskTitle.trim() || !newTaskColumnId}>
              Criar
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 px-6 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Título</label>
            <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Ex: Revisar petição" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Coluna</label>
            <Select value={newTaskColumnId} onValueChange={setNewTaskColumnId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione uma coluna" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {columnOrder.map((id) => (
                  <SelectItem key={id} value={id}>
                    {columnTitles[id] ?? "Coluna"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Prioridade</label>
            <Select
              value={newTaskPriority}
              onValueChange={(v) => {
                if (v === "low" || v === "medium" || v === "high") setNewTaskPriority(v);
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-950">
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </DialogFormShell>

      <Dialog open={isNewColumnModalOpen} onOpenChange={setIsNewColumnModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo board</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Input
              id="name"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              className="col-span-3"
              placeholder="Digite o nome do board..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newColumnTitle.trim()) {
                  if (creatingColumnRef.current) return;
                  addColumn(newColumnTitle.trim());
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending || !newColumnTitle.trim()}
              onClick={() => addColumn(newColumnTitle.trim())}
            >
              <CheckIcon />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
