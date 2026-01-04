"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, ClockIcon, Edit, FileIcon, FilePlus, PlusCircleIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { todoPriorityBadgeVariant, todoPriorityNamed, todoStatusBadgeVariant, todoStatusNamed } from "../enum";
import { useTodoStore } from "../store";
import type { Comment, SubTask, Todo, TodoFile } from "../types";
import {
  actionAdicionarAnexo,
  actionAdicionarComentario,
  actionAtualizarSubtarefa,
  actionRemoverAnexo,
  actionRemoverComentario,
  actionRemoverSubtarefa,
  actionCriarSubtarefa,
} from "../actions/todo-actions";

interface TodoDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string | null;
  onEditClick?: (id: string) => void;
}

export default function TodoDetailSheet({ isOpen, onClose, todoId, onEditClick }: TodoDetailSheetProps) {
  const { todos, upsertTodo } = useTodoStore();
  const [newComment, setNewComment] = React.useState("");
  const [newSubTask, setNewSubTask] = React.useState("");
  const [isAddingSubTask, setIsAddingSubTask] = React.useState(false);

  const todo = todos.find((t: Todo) => t.id === todoId);
  if (!todo) return null;

  const statusLabel = todoStatusNamed[todo.status as keyof typeof todoStatusNamed] ?? todo.status;
  const priorityLabel = todoPriorityNamed[todo.priority as keyof typeof todoPriorityNamed] ?? todo.priority;
  const statusVariant = todoStatusBadgeVariant[todo.status as keyof typeof todoStatusBadgeVariant] ?? "secondary";
  const priorityVariant = todoPriorityBadgeVariant[todo.priority as keyof typeof todoPriorityBadgeVariant] ?? "secondary";

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comentário obrigatório");
      return;
    }
    try {
      const updated = await actionAdicionarComentario({ todoId: todo.id, body: newComment.trim() });
      upsertTodo(updated);
      setNewComment("");
      toast.success("Comentário adicionado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar comentário");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          try {
            const updated = await actionAdicionarAnexo({
              todoId: todo.id,
              name: file.name,
              url: String(reader.result),
              type: file.type || null,
              size: file.size,
            });
            upsertTodo(updated);
            toast.success(`${file.name} anexado.`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : `Erro ao anexar ${file.name}`);
          } finally {
            resolve();
          }
        };
      });
    }

    e.target.value = "";
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.trim()) {
      toast.error("Título da subtarefa obrigatório");
      return;
    }
    try {
      const updated = await actionCriarSubtarefa({ todoId: todo.id, title: newSubTask.trim() });
      upsertTodo(updated);
      setNewSubTask("");
      setIsAddingSubTask(false);
      toast.success("Subtarefa adicionada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar subtarefa");
    }
  };

  const handleSubTaskToggle = async (subTaskId: string, completed: boolean) => {
    try {
      const updated = await actionAtualizarSubtarefa({ todoId: todo.id, subTaskId, completed });
      upsertTodo(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar subtarefa");
    }
  };

  const handleRemoveSubTask = async (subTaskId: string) => {
    try {
      const updated = await actionRemoverSubtarefa({ todoId: todo.id, subTaskId });
      upsertTodo(updated);
      toast.success("Subtarefa removida.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover subtarefa");
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      const updated = await actionRemoverAnexo({ todoId: todo.id, fileId });
      upsertTodo(updated);
      toast.success("Anexo removido.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover anexo");
    }
  };

  const handleRemoveComment = async (commentId: string) => {
    try {
      const updated = await actionRemoverComentario({ todoId: todo.id, commentId });
      upsertTodo(updated);
      toast.success("Comentário removido.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover comentário");
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start justify-between pe-6">
            <SheetTitle>{todo.title}</SheetTitle>
            {onEditClick && (
              <Button variant="outline" onClick={() => onEditClick(todo.id)}>
                <Edit />
                Editar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 capitalize">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <Badge variant={priorityVariant}>{priorityLabel}</Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Descrição</h4>
            <p className="text-muted-foreground text-sm">{todo.description || "Sem descrição."}</p>
          </div>

          <div className="grid grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Atribuído</h4>
              <p className="text-muted-foreground text-sm">{todo.assignedTo.join(", ") || "—"}</p>
            </div>
            {todo.dueDate && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Entrega</h4>
                <p className="text-muted-foreground text-sm">{format(new Date(todo.dueDate), "PPP")}</p>
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Criado</h4>
              <p className="text-muted-foreground text-sm">{format(new Date(todo.createdAt), "PPP")}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4 p-4">
          <h4 className="text-sm font-medium">Subtarefas</h4>
          {todo.subTasks.length > 0 ? (
            <div className="space-y-2">
              {todo.subTasks.map((subTask: SubTask) => (
                <div key={subTask.id} className="bg-muted flex items-center justify-between rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={subTask.completed} onCheckedChange={(checked) => handleSubTaskToggle(subTask.id, Boolean(checked))} />
                    <span className={cn("text-sm", subTask.completed && "text-muted-foreground line-through")}>{subTask.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveSubTask(subTask.id)} className="text-destructive">
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">Sem subtarefas.</div>
          )}

          {!isAddingSubTask && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setIsAddingSubTask(true)}>
                <PlusCircleIcon />
                <span>Adicionar subtarefa</span>
              </Button>
            </div>
          )}

          {isAddingSubTask && (
            <div className="flex gap-2">
              <Input
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="Título da subtarefa"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubTask();
                  if (e.key === "Escape") {
                    setIsAddingSubTask(false);
                    setNewSubTask("");
                  }
                }}
              />
              <Button onClick={handleAddSubTask}>
                <Check />
              </Button>
              <Button variant="outline" onClick={() => { setIsAddingSubTask(false); setNewSubTask(""); }}>
                <X />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Anexos</h4>
            <div>
              <input type="file" id="file-upload" multiple className="sr-only" onChange={handleFileUpload} />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <FilePlus />
                    Upload
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {todo.files.length > 0 ? (
            <div className="space-y-2">
              {todo.files.map((file: TodoFile) => (
                <div key={file.id} className="bg-muted flex items-center justify-between rounded-md p-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-4 w-4 shrink-0" />
                    <div className="overflow-hidden">
                      <Link href={file.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm hover:underline">
                        {file.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">
                        {formatFileSize(file.size)} {file.size ? "•" : ""} {format(new Date(file.uploadedAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file.id)} className="text-destructive">
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">Sem anexos.</div>
          )}
        </div>

        <Separator />

        <div className="space-y-4 p-4">
          <h4 className="text-sm font-medium">Comentários ({todo.comments.length})</h4>

          {todo.comments.length === 0 && <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">Sem comentários.</div>}

          <div className="space-y-2">
            {todo.comments.map((comment: Comment) => (
              <div key={comment.id} className="bg-muted group relative space-y-3 rounded-md p-3">
                <p className="text-sm">{comment.body}</p>
                <div className="text-muted-foreground flex justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="size-3" /> {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                  </div>
                  <div className="absolute end-2 bottom-2 flex items-center opacity-0 group-hover:opacity-100">
                    <Button variant="ghost" onClick={() => handleRemoveComment(comment.id)} className="text-destructive" size="sm">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea placeholder="Escreva um comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <Button onClick={handleAddComment}>Adicionar comentário</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


