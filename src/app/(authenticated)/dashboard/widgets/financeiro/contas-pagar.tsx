'use client';

/**
 * WidgetContasPagar — Aging de contas a pagar
 * Fonte: useDashboard() → data.dadosFinanceiros.contasPagarAging
 */

import { cn } from '@/lib/utils';
import { ArrowDownLeft } from 'lucide-react';
import { WidgetContainer, fmtMoeda } from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { tokenForTone } from '@/lib/design-system';
import { Text } from '@/components/ui/typography';

export function WidgetContasPagar() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="Contas a Pagar" icon={ArrowDownLeft} subtitle="Sem dados">
        <Text variant="caption" className="text-muted-foreground/60">Dados indisponíveis.</Text>
      </WidgetContainer>
    );
  }

  const fin = data.dadosFinanceiros;
  const aging = fin.contasPagarAging;
  const total = fin.contasPagar.valor;

  if (!aging || aging.length === 0) {
    return (
      <WidgetContainer
        title="Contas a Pagar"
        icon={ArrowDownLeft}
        subtitle="Aging"
        action={<span className={cn( "text-[11px] font-semibold text-destructive/70")}>{fmtMoeda(total)}</span>}
      >
        <Text variant="caption" className="text-muted-foreground/60">Nenhum dado de aging disponível.</Text>
      </WidgetContainer>
    );
  }

  const maxVal = Math.max(...aging.map((a) => a.valor));

  return (
    <WidgetContainer
      title="Contas a Pagar"
      icon={ArrowDownLeft}
      subtitle="Aging"
      action={<span className={cn( "text-[11px] font-semibold text-destructive/70")}>{fmtMoeda(total)}</span>}
    >
      <div className={cn("flex flex-col inline-tight")}>
        {aging.map((item) => (
          <div key={item.faixa} className={cn("flex items-center inline-medium")}>
            <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0 truncate">
              {item.faixa}
            </span>
            <div className="flex-1 h-4 rounded-full bg-border/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: maxVal > 0 ? `${(item.valor / maxVal) * 100}%` : '0%',
                  backgroundColor: tokenForTone(item.tone),
                }}
              />
            </div>
            <span className={cn( "text-[10px] font-medium tabular-nums w-20 text-right shrink-0")}>
              {fmtMoeda(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
