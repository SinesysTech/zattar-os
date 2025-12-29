import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, FileIcon, Star } from "lucide-react";
import { priorityClasses, statusClasses } from "@/features/tasks/types";
import type { Todo, TodoStatus } from "@/features/tasks/types";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AppBadge } from "@/components/ui/app-badge";
import { Checkbox } from "@/components/ui/checkbox";

interface TodoItemProps {
  todo: Todo;
  onClick?: () => void;
  onStatusChange?: (id: string, status: TodoStatus) => void;
  viewMode: "list" | "grid";
  onStarToggle?: (id: string, e: React.MouseEvent) => void;
  isDraggingOverlay?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onClick,
  onStatusChange,
  viewMode,
  onStarToggle,
  isDraggingOverlay = false
}) => {
  const completedSubTasks = todo.subTasks?.filter((st: { id: string; title: string; completed: boolean }) => st.completed).length || 0;
  const totalSubTasks = todo.subTasks?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? (!isDraggingOverlay ? 0.4 : 0.8) : 1,
    zIndex: isDragging ? 100 : 1
  };

  if (viewMode === "grid") {
    return (
      <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
        <Card
          className={cn(
            "flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md",
            todo.status === "done" ? "opacity-70" : ""
          )}
          onClick={onClick}>
          <CardContent className="flex h-full flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={todo.status === "done"}
                  onCheckedChange={() =>
                    onStatusChange
                      ? onStatusChange(
                        todo.id,
                        todo.status === "done" ? "todo" : "done"
                      )
                      : undefined
                  }
                  onClick={(e) => e.stopPropagation()}
                />

                <h3
                  className={cn(
                    "text-md flex-1 leading-none font-medium",
                    todo.status === "done" ? "text-muted-foreground line-through" : ""
                  )}>
                  {todo.title}
                </h3>

                <Star
                  className={cn(
                    "size-5 cursor-pointer",
                    todo.starred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  )}
                  onClick={(e) => (onStarToggle ? onStarToggle(todo.id, e) : undefined)}
                />
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
                <span>Assigned to:</span>
                {todo.assignedTo.map((user: string, idx: number) => (
                  <AppBadge key={idx} variant="outline" className="font-normal">
                    {user}
                  </AppBadge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {todo.dueDate && (
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(todo.dueDate), "MMM d, yyyy")}</span>
                  </div>
                )}

                {totalSubTasks > 0 && (
                  <div className="text-muted-foreground text-xs">
                    Subtasks: {completedSubTasks}/{totalSubTasks}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between border-t">
            <div className="flex items-center gap-2 capitalize">
              <AppBadge className={statusClasses[todo.status]}>{todo.status.replace("-", " ")}</AppBadge>
              <AppBadge className={priorityClasses[todo.priority]}>{todo.priority}</AppBadge>
            </div>

            {(todo.files?.length || 0) > 0 && (
              <div className="flex items-center gap-1">
                <FileIcon className="text-muted-foreground size-3" />
                <span className="text-muted-foreground text-xs">{todo.files?.length}</span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md",
          todo.status === "done" ? "opacity-70" : ""
        )}
        onClick={onClick}>
        <CardContent className="flex items-start gap-3">
          <Checkbox
            checked={todo.status === "done"}
            onCheckedChange={() =>
              onStatusChange
                ? onStatusChange(todo.id, todo.status === "done" ? "todo" : "done")
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          />

          <div className="flex grow flex-col space-y-2">
            <div className="flex flex-col items-start justify-between space-y-1 lg:flex-row lg:space-y-0">
              <div className="flex items-center space-x-2">
                <h3
                  className={cn(
                    "text-md leading-none font-medium",
                    todo.status === "done" ? "text-muted-foreground line-through" : ""
                  )}>
                  {todo.title}
                </h3>

                <Star
                  className={cn(
                    "size-4 cursor-pointer",
                    todo.starred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  )}
                  onClick={(e) => (onStarToggle ? onStarToggle(todo.id, e) : undefined)}
                />
              </div>

              <div className="flex items-center gap-2 capitalize">
                <AppBadge className={statusClasses[todo.status]}>
                  {todo.status.replace("-", " ")}
                </AppBadge>
                <AppBadge className={priorityClasses[todo.priority]}>{todo.priority}</AppBadge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-1">
                {todo.assignedTo.map((user: string, idx: number) => (
                  <AppBadge key={idx} variant="outline" className="font-normal">
                    {user}
                  </AppBadge>
                ))}
              </div>

              {todo.dueDate && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(todo.dueDate), "MMM d, yyyy")}</span>
                </div>
              )}

              {todo.files && todo.files.length > 0 && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <FileIcon className="size-3" />
                  <span>{todo.files.length}</span>
                </div>
              )}

              {totalSubTasks > 0 && (
                <div className="text-muted-foreground text-xs">
                  Subtasks: {completedSubTasks}/{totalSubTasks}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoItem;
