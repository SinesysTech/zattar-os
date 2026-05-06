import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/avatar-url";
import { Text } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MembroAtivo, DashboardSummary } from "../../domain";

function TrendIndicator({
  value,
  variacao,
}: {
  value: React.ReactNode;
  variacao: number;
}) {
  const isPositive = variacao >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
      <Icon className={cn("size-4", isPositive ? "text-success" : "text-destructive")} />
      {value}
    </span>
  );
}

interface SuccessMetricsProps {
  membros: MembroAtivo[];
  resumo: DashboardSummary;
}

export function SuccessMetrics({ membros, resumo }: SuccessMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Membros Ativos</CardDescription>
        <CardTitle className="font-display text-page-title lg:text-3xl">
          {membros.length}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "mb-2 text-body-sm font-bold")}>Destaques do Mês</p>
        {membros.length > 0 ? (
          <div className={cn(/* design-system-escape: -space-x-4 sem equivalente DS */ "flex -space-x-4")}>
            <TooltipProvider>
              {membros.map((membro) => (
                <Tooltip key={membro.usuarioId}>
                  <TooltipTrigger>
                    <Avatar size="xl" className="border-card border-4 hover:z-10">
                      <AvatarImage
                        src={membro.avatar ?? ""}
                        alt={membro.nome}
                      />
                      <AvatarFallback>
                        {generateAvatarFallback(membro.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {membro.nome} — {membro.totalTarefasConcluidas} tarefas
                    concluídas
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        ) : (
          <Text variant="caption" className="text-muted-foreground">
            Nenhum membro ativo.
          </Text>
        )}
        <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "mt-8 mb-2 text-body-sm font-bold")}>Resumo</p>
        <div className={cn(/* design-system-escape: *:py-3 sem equivalente DS */ "divide-y *:py-3")}>
          <div className={cn("flex justify-between text-body-sm")}>
            <span>Projetos Ativos</span>
            <TrendIndicator
              value={resumo.projetosAtivos}
              variacao={resumo.projetosAtivosVariacao}
            />
          </div>
          <div className={cn("flex justify-between text-body-sm")}>
            <span>Taxa de Conclusão</span>
            <TrendIndicator
              value={`${resumo.taxaConclusao}%`}
              variacao={resumo.taxaConclusaoVariacao}
            />
          </div>
          <div className={cn("flex justify-between text-body-sm")}>
            <span>Horas este Mês</span>
            <TrendIndicator
              value={`${resumo.horasRegistradas}h`}
              variacao={resumo.horasRegistradasVariacao}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
