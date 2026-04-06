'use client';

/**
 * WidgetSaldoTrend — Saldo atual + tendência de 12 meses
 * Fonte: useDashboard() → data.dadosFinanceiros.saldoTotal + saldoTrend
 */

import { Wallet } from 'lucide-react';
import { WidgetContainer, Stat, MiniArea, fmtMoeda } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function WidgetSaldoTrend() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer title="Saldo" icon={Wallet} subtitle="Sem dados">
        <p className="text-xs text-muted-foreground/60">Dados indisponíveis.</p>
      </WidgetContainer>
    );
  }

  const fin = data.dadosFinanceiros;
  const saldo = fin.saldoTotal;
  const trend = fin.saldoTrend;

  // Calculate percentage change from trend data
  let pctChange: number | null = null;
  if (trend && trend.length >= 2) {
    const previous = trend[trend.length - 2];
    if (previous !== 0) {
      pctChange = ((saldo - previous) / Math.abs(previous)) * 100;
    }
  }

  const deltaType = pctChange !== null
    ? pctChange >= 0 ? 'positive' : 'negative'
    : 'neutral';

  const deltaText = pctChange !== null
    ? `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% vs mês anterior`
    : undefined;

  return (
    <WidgetContainer title="Saldo" icon={Wallet} subtitle="Tendência 12 meses">
      <div className="flex items-center justify-between gap-4">
        <Stat
          label="Saldo atual"
          value={fmtMoeda(saldo)}
          delta={deltaText}
          deltaType={deltaType}
        />

        {trend && trend.length >= 2 && (
          <MiniArea
            data={trend}
            width={120}
            height={40}
            color={saldo >= 0 ? 'var(--primary)' : 'var(--destructive)'}
          />
        )}
      </div>
    </WidgetContainer>
  );
}
