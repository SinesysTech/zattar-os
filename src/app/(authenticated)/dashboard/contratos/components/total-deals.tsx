import { cn } from '@/lib/utils';
import { BriefcaseBusiness } from "lucide-react";
import { Card, CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { actionContarPartesContrariasComEstatisticas } from "@/app/(authenticated)/partes/server-actions";
import type { CrmDateFilter } from "../crm-date-filter";
import { toCrmDateFilterInput } from "../crm-date-filter";

export async function TotalDeals({ dateFilter }: { dateFilter: CrmDateFilter }) {
  const result = await actionContarPartesContrariasComEstatisticas(toCrmDateFilterInput(dateFilter));

  const total = result.success && result.data ? result.data.total : 0;
  const variacao = result.success && result.data ? result.data.variacaoPercentual : null;
  const comparacaoLabel = result.success && result.data ? (result.data as { comparacaoLabel?: string }).comparacaoLabel : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Total de Partes Contrárias</CardDescription>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
          <h4 className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="...">; lg:text-3xl sem equivalente DS */ "font-display text-2xl lg:text-3xl")}>{total.toLocaleString('pt-BR')}</h4>
          {variacao !== null && (
            <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-muted-foreground text-sm")}>
              <span className={variacao >= 0 ? "text-success" : "text-destructive"}>
                {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}%
              </span>{" "}
              {comparacaoLabel || "em relação ao mês anterior"}
            </div>
          )}
          {!result.success && (
            <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-muted-foreground text-sm")}>
              <span className="text-destructive">Erro ao carregar</span>
            </div>
          )}
        </div>
        <CardAction>
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4")}>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <BriefcaseBusiness className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
