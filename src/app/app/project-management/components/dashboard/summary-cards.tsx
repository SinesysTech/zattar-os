import { Briefcase, ListTodo, Clock, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardSummary } from "../../lib/domain";

interface SummaryCardsProps {
  data: DashboardSummary;
}

function formatVariacao(valor: number): { text: string; color: string } {
  if (valor > 0) return { text: `+${valor}%`, color: "text-green-600" };
  if (valor < 0) return { text: `${valor}%`, color: "text-red-600" };
  return { text: "0%", color: "text-muted-foreground" };
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const cards = [
    {
      title: "Projetos Ativos",
      value: data.projetosAtivos.toString(),
      variacao: formatVariacao(data.projetosAtivosVariacao),
      icon: Briefcase,
    },
    {
      title: "Tarefas Pendentes",
      value: data.tarefasPendentes.toString(),
      variacao: formatVariacao(data.tarefasPendentesVariacao),
      icon: ListTodo,
    },
    {
      title: "Horas Registradas",
      value: `${data.horasRegistradas}h`,
      variacao: formatVariacao(data.horasRegistradasVariacao),
      icon: Clock,
    },
    {
      title: "Taxa de Conclusão",
      value: `${data.taxaConclusao}%`,
      variacao: formatVariacao(data.taxaConclusaoVariacao),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/10 grid gap-4 *:data-[slot=card]:bg-gradient-to-t md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>
              <span className={card.variacao.color}>
                {card.variacao.text}
              </span>{" "}
              em relação ao mês anterior
            </CardDescription>
            <CardAction>
              <card.icon className="text-muted-foreground/50 size-4 lg:size-6" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl lg:text-3xl">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
