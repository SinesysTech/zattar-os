"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTodoStore } from "../store";
import { todoFormSchema, type TodoFormValues } from "../schemas";
import type { Todo } from "../types";
import {
  priorityDotColors,
  statusDotColors,
  EnumTodoStatus,
  todoStatusNamed,
  EnumTodoPriority,
} from "../enum";
import { toast } from "sonner";
import { actionCriarTodo, actionAtualizarTodo } from "../actions/todo-actions";
import { UserSelector } from "./user-selector";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddTodoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editTodoId?: string | null;
}

const defaultValues: TodoFormValues = {
  title: "",
  description: "",
  assigneeUserIds: [],
  status: EnumTodoStatus.Pending,
  priority: EnumTodoPriority.Medium,
  dueDate: undefined,
  reminderDate: undefined,
};

export function AddTodoSheet({ isOpen, onClose, editTodoId }: AddTodoSheetProps) {
  const { todos, upsertTodo } = useTodoStore();
  const [selectedUserIds, setSelectedUserIds] = React.useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues,
  });

  // If editTodoId is provided, load that todo's data
  React.useEffect(() => {
    if (isOpen) {
      if (editTodoId) {
        const todoToEdit = todos.find((todo: Todo) => todo.id === editTodoId);
        if (todoToEdit) {
          const userIds = todoToEdit.assignees.map((a) => a.id);
          form.reset({
            title: todoToEdit.title,
            description: todoToEdit.description || "",
            assigneeUserIds: userIds,
            status: todoToEdit.status as TodoFormValues["status"],
            priority: todoToEdit.priority as TodoFormValues["priority"],
            dueDate: todoToEdit.dueDate ? new Date(todoToEdit.dueDate) : undefined,
            reminderDate: todoToEdit.reminderDate ? new Date(todoToEdit.reminderDate) : undefined,
          });
          setSelectedUserIds(userIds);
        }
      } else {
        form.reset(defaultValues);
        setSelectedUserIds([]);
      }
    }
  }, [editTodoId, todos, isOpen, form]);

  const onSubmit = async (data: TodoFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert dates to the correct format
      const dueDateStr = data.dueDate
        ? format(data.dueDate, "yyyy-MM-dd")
        : null;
      const reminderDateStr = data.reminderDate
        ? data.reminderDate.toISOString()
        : null;

      if (editTodoId) {
        // Update existing todo
        const result = await actionAtualizarTodo({
          id: editTodoId,
          title: data.title,
          description: data.description || null,
          assigneeUserIds: selectedUserIds,
          status: data.status,
          priority: data.priority,
          dueDate: dueDateStr,
          reminderDate: reminderDateStr,
        });

        if (result.success) {
          toast.success("To-do atualizado com sucesso.");
          upsertTodo(result.data as Todo);
          form.reset();
          setSelectedUserIds([]);
          onClose();
        } else {
          toast.error(result.error || "Erro ao atualizar to-do.");
        }
      } else {
        // Create new todo
        const result = await actionCriarTodo({
          title: data.title,
          description: data.description,
          assigneeUserIds: selectedUserIds,
          status: data.status,
          priority: data.priority,
          dueDate: dueDateStr,
          reminderDate: reminderDateStr,
        });

        if (result.success) {
          toast.success("To-do criado com sucesso.");
          upsertTodo(result.data as Todo);
          form.reset();
          setSelectedUserIds([]);
          onClose();
        } else {
          toast.error(result.error || "Erro ao criar to-do.");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar to-do:", error);
      toast.error("Erro inesperado ao salvar to-do.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle>{editTodoId ? "Editar To-Do" : "Novo To-Do"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 pt-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título" className="bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite a descrição"
                      rows={4}
                      className="bg-white"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeUserIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atribuir a</FormLabel>
                  <FormControl>
                    <UserSelector
                      selectedUserIds={selectedUserIds}
                      onSelectionChange={(userIds) => {
                        setSelectedUserIds(userIds);
                        field.onChange(userIds);
                      }}
                      error={form.formState.errors.assigneeUserIds?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {field.value ? format(field.value, "PPP") : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Lembrete</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {field.value ? format(field.value, "PPP p") : "Selecione uma data/hora"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EnumTodoStatus).map((status: EnumTodoStatus) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <span className={cn("size-2 rounded-full", statusDotColors[status])} />
                                {todoStatusNamed[status]}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full capitalize bg-white">
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EnumTodoPriority).map((priority: EnumTodoPriority) => (
                            <SelectItem key={priority} value={priority} className="capitalize">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn("size-2 rounded-full", priorityDotColors[priority])}
                                />
                                {priority}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : editTodoId
                  ? "Salvar Alterações"
                  : "Criar To-Do"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

