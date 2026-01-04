"use client";

import React from "react";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/layout/pickers/date-time-picker";
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

  const handleAddReminder = async () => {
    if (!newReminder.texto.trim()) {
      return;
    }

    if (!date) {
      return;
    }

    if (!newReminder.categoria) {
      return;
    }

    const success = await criar({
      texto: newReminder.texto,
      prioridade: newReminder.prioridade,
      categoria: newReminder.categoria,
      data_lembrete: date.toISOString(),
    });

    if (success) {
      // Resetar form
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircleIcon />
          Adicionar Lembrete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Novo Lembrete</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="text">Nota</Label>
            <Input
              id="text"
              placeholder="Digite seu lembrete"
              value={newReminder.texto}
              onChange={(e) =>
                setNewReminder({ ...newReminder, texto: e.target.value })
              }
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Data e Hora</Label>
            <DateTimePicker date={date} setDate={setDate} />
          </div>

          <div className="grid gap-3">
            <Label>Prioridade</Label>
            <RadioGroup
              value={newReminder.prioridade}
              onValueChange={(value) =>
                setNewReminder({
                  ...newReminder,
                  prioridade: value as PrioridadeLembrete,
                })
              }
              className="flex space-x-4"
              disabled={isPending}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">
                  Baixa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">
                  Média
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">
                  Alta
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={newReminder.categoria}
              onValueChange={(value) =>
                setNewReminder({ ...newReminder, categoria: value })
              }
              disabled={isPending}
            >
              <SelectTrigger id="category" className="w-full">
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
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAddReminder} disabled={isPending}>
            {isPending ? "Adicionando..." : "Adicionar Lembrete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
