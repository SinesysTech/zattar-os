"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleCheck, Trash2 } from "lucide-react";
import { AddReminderDialog } from "./add-reminder-dialog";
import { useReminders } from "../../hooks";
import { PRIORIDADE_LABELS, type Lembrete } from "../../domain";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RemindersProps {
  lembretes?: Lembrete[];
}

export function Reminders({ lembretes: initialReminders = [] }: RemindersProps) {
  const { lembretes, marcarConcluido, deletar, isPending } = useReminders({
    lembretes: initialReminders,
    concluido: false,
    limite: 3,
  });

  const formatarDataLembrete = (dataISO: string): string => {
    const data = parseISO(dataISO);

    if (isToday(data)) {
      return `Hoje, ${format(data, "HH:mm", { locale: ptBR })}`;
    }

    if (isTomorrow(data)) {
      return `Amanhã, ${format(data, "HH:mm", { locale: ptBR })}`;
    }

    return format(data, "dd/MM/yyyy, HH:mm", { locale: ptBR });
  };

  const handleToggleConcluido = async (id: number, concluido: boolean) => {
    await marcarConcluido(id, !concluido);
  };

  const handleDeletar = async (id: number) => {
    if (confirm("Deseja realmente deletar este lembrete?")) {
      await deletar(id);
    }
  };

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Lembretes</CardTitle>
        <CardAction>
          <AddReminderDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        {lembretes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Nenhum lembrete pendente.</p>
            <p className="mt-2 text-sm">
              Clique em &quot;Adicionar Lembrete&quot; para criar um novo.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {lembretes.slice(0, 3).map((lembrete) => (
                <Card key={lembrete.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base font-semibold capitalize">
                      <span
                        className={cn("d-inline me-2 size-2 rounded-full", {
                          "bg-gray-400": lembrete.prioridade === "low",
                          "bg-orange-400": lembrete.prioridade === "medium",
                          "bg-red-600": lembrete.prioridade === "high",
                        })}
                      ></span>{" "}
                      {PRIORIDADE_LABELS[lembrete.prioridade]}{" "}
                      <button
                        onClick={() =>
                          handleToggleConcluido(lembrete.id, lembrete.concluido)
                        }
                        disabled={isPending}
                        className="ms-auto me-2 transition-colors hover:opacity-80"
                        title={
                          lembrete.concluido
                            ? "Marcar como pendente"
                            : "Marcar como concluído"
                        }
                      >
                        {lembrete.concluido ? (
                          <CircleCheck className="size-4 text-green-600" />
                        ) : (
                          <CircleCheck className="size-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeletar(lembrete.id)}
                        disabled={isPending}
                        className="transition-colors hover:text-destructive"
                        title="Deletar lembrete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {formatarDataLembrete(lembrete.data_lembrete)}
                    </div>
                    <div
                      className={cn("text-sm", {
                        "line-through opacity-60": lembrete.concluido,
                      })}
                    >
                      {lembrete.texto}
                    </div>
                    <Badge variant="outline">{lembrete.categoria}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            {lembretes.length > 3 && (
              <div className="mt-4 text-end">
                <Button
                  variant="link"
                  className="text-muted-foreground hover:text-primary"
                  asChild
                >
                  <a href="#">
                    Mostrar outros {lembretes.length - 3} lembretes
                  </a>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
