'use client';

/**
 * WidgetDREComparativo — DRE com sparklines (Receita, Despesa, Resultado)
 * Fonte: useDashboard() → data.dadosFinanceiros.dreComparativo
 */

import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { WidgetContainer, Stat, Sparkline, fmtMoeda } from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { Text } from '@/components/ui/typography';

export function WidgetDREComparativo() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="DRE Comparativo" icon={TrendingUp} subtitle="Sem dados">
        <Text variant="caption" className="text-muted-foreground/60">Dados indisponíveis.</Text>
      </WidgetContainer>
    );
  }

  const dre = data.dadosFinanceiros.dreComparativo;

  if (!dre) {
    return (
      <WidgetContainer title="DRE Comparativo" icon={TrendingUp} subtitle="12 meses">
        <Text variant="caption" className="text-muted-foreground/60">Nenhum dado de DRE disponível.</Text>
      </WidgetContainer>
    );
  }

  const { receita, despesa, resultado } = dre;

  // Last month values
  const receitaAtual = receita[receita.length - 1] ?? 0;
  const despesaAtual = despesa[despesa.length - 1] ?? 0;
  const resultadoAtual = resultado[resultado.length - 1] ?? 0;

  // Margin calculation
  const margem = receitaAtual > 0
    ? ((resultadoAtual / receitaAtual) * 100).toFixed(1)
    : '0.0';

  return (
    <WidgetContainer
      title="DRE Comparativo"
      icon={TrendingUp}
      subtitle="12 meses"
      action={
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1 text-[10px] text-muted-foreground/60")}>
          <TrendingUp className="size-3" />
          <span>Margem {margem}%</span>
        </div>
      }
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-3 gap-4")}>
        {/* Receita */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
          <Stat
            label="Receita"
            value={fmtMoeda(receitaAtual)}
            small
          />
          {receita.length >= 2 && (
            <Sparkline data={receita} color="var(--success)" width={70} height={20} />
          )}
        </div>

        {/* Despesa */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
          <Stat
            label="Despesa"
            value={fmtMoeda(despesaAtual)}
            small
          />
          {despesa.length >= 2 && (
            <Sparkline data={despesa} color="var(--destructive)" width={70} height={20} />
          )}
        </div>

        {/* Resultado */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
          <Stat
            label="Resultado"
            value={fmtMoeda(resultadoAtual)}
            deltaType={resultadoAtual >= 0 ? 'positive' : 'negative'}
            small
          />
          {resultado.length >= 2 && (
            <Sparkline
              data={resultado}
              color={resultadoAtual >= 0 ? 'var(--primary)' : 'var(--destructive)'}
              width={70}
              height={20}
            />
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
