"use client";

import {
  cn } from '@/lib/utils';
import React from "react";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup,
  RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import { DateTimePicker } from "@/components/layout/pickers/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useReminders } from "../../hooks";
import { CATEGORIAS_LEMBRETE, type PrioridadeLembrete } from "../../domain";

export function AddReminderDialog() {
  const { criar, isPending } = useReminders();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>();
  const [newReminder, setNewReminder] = React.useState<{
    texto: string;
    prioridade: PrioridadeLembrete;
    categoria: string;
  }>({
    texto: "",
    prioridade: "medium",
    categoria: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReminder.texto.trim() || !date || !newReminder.categoria) {
      return;
    }

    const success = await criar({
      texto: newReminder.texto,
      prioridade: newReminder.prioridade,
      categoria: newReminder.categoria,
      data_lembrete: date.toISOString(),
    });

    if (success) {
      setNewReminder({
        texto: "",
        prioridade: "medium",
        categoria: "",
      });
      setDate(undefined);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        size="icon" aria-label="Adicionar Lembrete"
        variant="ghost"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <PlusCircleIcon className="size-5" />
        <span className="sr-only">Adicionar Lembrete</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
            <DialogTitle>Novo Lembrete</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados para adicionar um novo lembrete</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
            <form
              id="add-reminder-form"
              onSubmit={handleSubmit}
              className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "stack-default px-6 py-4")}
            >
              <div className={cn("grid inline-tight")}>
                <Label htmlFor="reminder-text">Nota</Label>
                <Input
                  id="reminder-text"
                  variant="glass"
                  placeholder="Digite seu lembrete"
                  value={newReminder.texto}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, texto: e.target.value })
                  }
                  disabled={isPending}
                  required
                />
              </div>

              <div className={cn("grid inline-tight")}>
                <Label htmlFor="reminder-date">Data e Hora</Label>
                <DateTimePicker date={date} setDate={setDate} />
              </div>

              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid gap-3")}>
                <Label>Prioridade</Label>
                <RadioGroup
                  value={newReminder.prioridade}
                  onValueChange={(value) =>
                    setNewReminder({
                      ...newReminder,
                      prioridade: value as PrioridadeLembrete,
                    })
                  }
                  className={cn(/* design-system-escape: space-x-4 → migrar para <Inline gap="default"> */ "flex space-x-4")}
                  disabled={isPending}
                >
                  <div className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2")}>
                    <RadioGroupItem value="low" id="priority-low" />
                    <Label htmlFor="priority-low" className="cursor-pointer">
                      Baixa
                    </Label>
                  </div>
                  <div className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2")}>
                    <RadioGroupItem value="medium" id="priority-medium" />
                    <Label htmlFor="priority-medium" className="cursor-pointer">
                      Média
                    </Label>
                  </div>
                  <div className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2")}>
                    <RadioGroupItem value="high" id="priority-high" />
                    <Label htmlFor="priority-high" className="cursor-pointer">
                      Alta
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className={cn("grid inline-tight")}>
                <Label htmlFor="reminder-category">Categoria</Label>
                <Select
                  value={newReminder.categoria}
                  onValueChange={(value) =>
                    setNewReminder({ ...newReminder, categoria: value })
                  }
                  disabled={isPending}
                  required
                >
                  <SelectTrigger
                    id="reminder-category"
                    className="w-full"
                  >
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_LEMBRETE.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                form="add-reminder-form"
                disabled={isPending}
              >
                {isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
