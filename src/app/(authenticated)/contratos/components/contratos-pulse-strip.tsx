'use client';

import { FileCheck, DollarSign, Clock, TrendingUp } from 'lucide-react';
import {
  PulseKpiCard,
  PulseKpiBar,
  PulseKpiGrid,
} from '@/components/shared/pulse-kpi-card';
import {
  AnimatedNumber,
  Sparkline,
  fmtMoeda,
} from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContratosPulseStripProps {
  ativos: number;
  valorTotal: number;
  vencendo30d: number;
  novosMes: number;
  total: number;
  trendMensal?: number[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContratosPulseStrip({
  ativos,
  valorTotal,
  vencendo30d,
  novosMes,
  total,
  trendMensal,
}: ContratosPulseStripProps) {
  const pctAtivos = total > 0 ? Math.round((ativos / total) * 100) : 0;
  const pctVencendo = total > 0 ? Math.round((vencendo30d / total) * 100) : 0;
  const pctNovos = total > 0 ? Math.round((novosMes / total) * 100) : 0;
  const isVencendoAlert = vencendo30d > 0;

  return (
    <PulseKpiGrid>
      {/* ── Ativos ─────────────────────────────────────────────────── */}
      <PulseKpiCard
        label="Ativos"
        icon={FileCheck}
        iconColor="text-primary/60"
        iconBg="bg-primary/8"
        footer={<PulseKpiBar pct={pctAtivos} color="bg-primary/25" />}
      >
        <AnimatedNumber value={ativos} />
      </PulseKpiCard>

      {/* ── Valor Total ────────────────────────────────────────────── */}
      <PulseKpiCard
        label="Valor Total"
        icon={DollarSign}
        iconColor="text-primary/60"
        iconBg="bg-primary/8"
        footer={
          <div className="mt-2.5 h-6 flex items-center justify-center">
            {trendMensal && trendMensal.length >= 2 && (
              <Sparkline data={trendMensal} width={120} height={24} />
            )}
          </div>
        }
      >
        <span className="tabular-nums">{fmtMoeda(valorTotal)}</span>
      </PulseKpiCard>

      {/* ── Vencendo 30d ───────────────────────────────────────────── */}
      <PulseKpiCard
        label="Vencendo 30d"
        icon={Clock}
        iconColor={cn('text-warning/60')}
        iconBg="bg-warning/8"
        iconHighlightBorder={isVencendoAlert ? 'border border-warning/20' : undefined}
        highlight={isVencendoAlert}
        highlightBorderColor="border-warning/15"
        footer={<PulseKpiBar pct={pctVencendo} color="bg-warning/25" />}
      >
        <AnimatedNumber
          value={vencendo30d}
          className={isVencendoAlert ? 'text-warning/80' : ''}
        />
      </PulseKpiCard>

      {/* ── Novos/Mês ──────────────────────────────────────────────── */}
      <PulseKpiCard
        label="Novos/Mês"
        icon={TrendingUp}
        iconColor="text-success/60"
        iconBg="bg-success/8"
        footer={<PulseKpiBar pct={pctNovos} color="bg-success/25" />}
      >
        <AnimatedNumber value={novosMes} />
      </PulseKpiCard>
    </PulseKpiGrid>
  );
}
