"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BellIcon, Calendar, FileIcon, Star } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import type { SubTask, Todo, TodoStatus } from "../types";
import { todoPriorityBadgeVariant, todoPriorityNamed, todoStatusBadgeVariant, todoStatusNamed } from "../enum";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TodoItemProps {
  todo: Todo;
  onClick?: () => void;
  onStatusChange?: (id: string, status: TodoStatus) => void;
  viewMode: "list" | "grid";
  onStarToggle?: (id: string, e: React.MouseEvent) => void;
  isDraggingOverlay?: boolean;
}

export default function TodoItem({
  todo,
  onClick,
  onStatusChange,
  viewMode,
  onStarToggle,
  isDraggingOverlay = false,
}: TodoItemProps) {
  const completedSubTasks = todo.subTasks?.filter((st: SubTask) => st.completed).length || 0;
  const totalSubTasks = todo.subTasks?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? (!isDraggingOverlay ? 0.4 : 0.8) : 1,
    zIndex: isDragging ? 100 : 1,
  } as const;

  const reminderDateFormatted = todo.reminderDate ? format(new Date(todo.reminderDate), "dd/MM/yyyy HH:mm") : null;

  const statusLabel = todoStatusNamed[todo.status as keyof typeof todoStatusNamed] ?? todo.status;
  const priorityLabel = todoPriorityNamed[todo.priority as keyof typeof todoPriorityNamed] ?? todo.priority;

  const statusVariant = todoStatusBadgeVariant[todo.status as keyof typeof todoStatusBadgeVariant] ?? "secondary";
  const priorityVariant = todoPriorityBadgeVariant[todo.priority as keyof typeof todoPriorityBadgeVariant] ?? "secondary";

  const handleToggleCompleted = () => {
    if (!onStatusChange) return;
    onStatusChange(todo.id, todo.status === "completed" ? "pending" : "completed");
  };

  const StarIcon = (
    <Star
      className={cn(
        "cursor-pointer",
        viewMode === "grid" ? "size-5" : "size-4",
        todo.starred ? "fill-primary text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
      )}
      onClick={(e) => (onStarToggle ? onStarToggle(todo.id, e) : undefined)}
    />
  );

  const StatusPriorityBadges = (
    <div className="flex items-center gap-2">
      <Badge variant={statusVariant} className="capitalize">
        {statusLabel}
      </Badge>
      <Badge variant={priorityVariant} className="capitalize">
        {priorityLabel}
      </Badge>
    </div>
  );

  if (viewMode === "grid") {
    return (
      <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
        <Card
          className={cn("flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md", todo.status === "completed" ? "opacity-70" : "")}
          onClick={onClick}
        >
          <CardContent className="flex h-full flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-start space-x-3">
                <Checkbox checked={todo.status === "completed"} onCheckedChange={handleToggleCompleted} onClick={(e) => e.stopPropagation()} />

                <h3 className={cn("text-md flex-1 leading-none font-medium", todo.status === "completed" ? "text-muted-foreground line-through" : "")}>
                  {todo.title}
                </h3>

                {StarIcon}
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
                <span>Atribuído:</span>
                {todo.assignedTo.map((user, idx) => (
                  <Badge key={idx} variant="outline" className="font-normal">
                    {user}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {todo.dueDate && (
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(todo.dueDate), "dd/MM/yyyy")}</span>
                  </div>
                )}

                {todo.reminderDate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-xs">
                          <BellIcon className="size-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lembrete: {reminderDateFormatted}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {totalSubTasks > 0 && (
                <div className="text-muted-foreground text-xs">
                  Subtarefas: {completedSubTasks}/{totalSubTasks}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between border-t">
            {StatusPriorityBadges}

            {todo.files.length > 0 && (
              <div className="flex items-center gap-1">
                <FileIcon className="text-muted-foreground size-3" />
                <span className="text-muted-foreground text-xs">{todo.files.length}</span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <Card className={cn("cursor-pointer transition-shadow hover:shadow-md", todo.status === "completed" ? "opacity-70" : "")} onClick={onClick}>
        <CardContent className="flex items-start gap-3">
          <Checkbox checked={todo.status === "completed"} onCheckedChange={handleToggleCompleted} onClick={(e) => e.stopPropagation()} />

          <div className="flex grow flex-col space-y-2">
            <div className="flex flex-col items-start justify-between space-y-1 lg:flex-row lg:space-y-0">
              <div className="flex items-center space-x-2">
                <h3 className={cn("text-md leading-none font-medium", todo.status === "completed" ? "text-muted-foreground line-through" : "")}>
                  {todo.title}
                </h3>
                {StarIcon}
              </div>

              {StatusPriorityBadges}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-1">
                {todo.assignedTo.map((user, idx) => (
                  <Badge key={idx} variant="outline" className="font-normal">
                    {user}
                  </Badge>
                ))}
              </div>

              {todo.dueDate && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(todo.dueDate), "dd/MM/yyyy")}</span>
                </div>
              )}

              {todo.reminderDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs">
                        <BellIcon className="size-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lembrete: {reminderDateFormatted}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {todo.files.length > 0 && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <FileIcon className="size-3" />
                  <span>{todo.files.length}</span>
                </div>
              )}

              {totalSubTasks > 0 && (
                <div className="text-muted-foreground text-xs">
                  Subtarefas: {completedSubTasks}/{totalSubTasks}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


