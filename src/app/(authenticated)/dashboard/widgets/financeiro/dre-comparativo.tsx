'use client';

/**
 * WidgetDREComparativo — DRE com sparklines (Receita, Despesa, Resultado)
 * Fonte: useDashboard() → data.dadosFinanceiros.dreComparativo
 */

import { TrendingUp } from 'lucide-react';
import { WidgetContainer, Stat, Sparkline, fmtMoeda } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function WidgetDREComparativo() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="DRE Comparativo" icon={TrendingUp} subtitle="Sem dados">
        <p className="text-xs text-muted-foreground/60">Dados indisponíveis.</p>
      </WidgetContainer>
    );
  }

  const dre = data.dadosFinanceiros.dreComparativo;

  if (!dre) {
    return (
      <WidgetContainer title="DRE Comparativo" icon={TrendingUp} subtitle="12 meses">
        <p className="text-xs text-muted-foreground/60">Nenhum dado de DRE disponível.</p>
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
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <TrendingUp className="size-3" />
          <span>Margem {margem}%</span>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-4">
        {/* Receita */}
        <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
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
