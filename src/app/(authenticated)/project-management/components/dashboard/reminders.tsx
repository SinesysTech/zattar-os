"use client";

import { useTransition } from "react";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Text } from "@/components/ui/typography";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import { PRIORIDADE_LABELS, type Lembrete } from "../../domain";
import { actionConcluirLembrete } from "../../actions";
import { AddReminderDialog } from "./add-reminder-dialog";

interface RemindersProps {
  lembretes: Lembrete[];
}

const PRIORIDADE_DOT_COLORS: Record<string, string> = {
  baixa: "bg-muted-foreground",
  media: "bg-warning",
  alta: "bg-destructive",
  urgente: "bg-destructive",
};

function ReminderCard({ lembrete }: { lembrete: Lembrete }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await actionConcluirLembrete(lembrete.id, !lembrete.concluido);
    });
  };

  const dataFormatada = new Date(lembrete.dataHora).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "flex items-center text-body font-semibold capitalize")}>
          <span
            className={cn(
              "me-2 inline-block size-2 rounded-full",
              PRIORIDADE_DOT_COLORS[lembrete.prioridade] ?? "bg-muted-foreground"
            )}
          />
          {PRIORIDADE_LABELS[lembrete.prioridade]}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="ms-auto me-2"
          >
            <CircleCheck
              className={cn(
                "size-4",
                lembrete.concluido ? "text-success" : "text-muted-foreground"
              )}
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("stack-default")}>
        <div className={cn("text-muted-foreground text-body-sm")}>{dataFormatada}</div>
        <div className={cn("text-body-sm")}>{lembrete.texto}</div>
        {lembrete.projetoNome && (
          <Badge variant="outline">{lembrete.projetoNome}</Badge>
        )}
        {lembrete.tarefaTitulo && (
          <Badge variant="outline">{lembrete.tarefaTitulo}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function Reminders({ lembretes }: RemindersProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Lembretes</CardTitle>
        <CardAction>
          <AddReminderDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        {lembretes.length === 0 ? (
          <Text variant="caption" className="text-muted-foreground">
            Nenhum lembrete pendente.
          </Text>
        ) : (
          <div className={cn("grid inline-default sm:grid-cols-2 lg:grid-cols-3")}>
            {lembretes.map((lembrete) => (
              <ReminderCard key={lembrete.id} lembrete={lembrete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
