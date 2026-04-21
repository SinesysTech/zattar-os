'use client';

import { AlertTriangle, Clock, CalendarClock, Wallet } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ResumoObrigacoesDB } from '../../repository';

interface ObrigacoesPulseStripProps {
  resumo: ResumoObrigacoesDB | null;
  isLoading?: boolean;
}

interface PulseMetric {
  label: string;
  quantidade: number;
  valor: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  highlight?: boolean;
  showValue?: boolean;
  negativeOnNegative?: boolean;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function PulseSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassPanel key={i} depth={1} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function ObrigacoesPulseStrip({ resumo, isLoading }: ObrigacoesPulseStripProps) {
  if (isLoading || !resumo) return <PulseSkeleton />;

  const saldo = resumo.saldoPrevisto;
  const saldoNegativo = saldo < 0;

  const metrics: PulseMetric[] = [
    {
      label: 'Vencidas',
      quantidade: resumo.vencidas.quantidade,
      valor: resumo.vencidas.valor,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      highlight: resumo.vencidas.quantidade > 0,
      showValue: true,
    },
    {
      label: 'Vence Hoje',
      quantidade: resumo.vencendoHoje.quantidade,
      valor: resumo.vencendoHoje.valor,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning',
      showValue: true,
    },
    {
      label: 'Próximos 7d',
      quantidade: resumo.vencendoEm7Dias.quantidade,
      valor: resumo.vencendoEm7Dias.valor,
      icon: CalendarClock,
      color: 'text-primary',
      bgColor: 'bg-primary',
      showValue: true,
    },
    {
      label: 'Saldo Previsto',
      quantidade: 0,
      valor: Math.abs(saldo),
      icon: Wallet,
      color: saldoNegativo ? 'text-destructive' : 'text-success',
      bgColor: saldoNegativo ? 'bg-destructive' : 'bg-success',
      showValue: true,
      negativeOnNegative: saldoNegativo,
    },
  ];

  const totalPendente = resumo.pendentesTotal.quantidade;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const pct =
          totalPendente > 0 && metric.quantidade > 0
            ? Math.round((metric.quantidade / totalPendente) * 100)
            : 0;
        const isSaldo = metric.label === 'Saldo Previsto';

        return (
          <GlassPanel
            key={metric.label}
            depth={metric.highlight ? 2 : 1}
            className={cn(
              'px-4 py-3.5',
              metric.highlight && metric.quantidade > 0 && 'border-destructive/15',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p
                    className={cn(
                      'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                      metric.highlight && metric.quantidade > 0 && 'text-destructive/80',
                      isSaldo && metric.negativeOnNegative && 'text-destructive/80',
                    )}
                  >
                    {isSaldo ? (
                      <>
                        {metric.negativeOnNegative ? '−' : ''}
                        {CURRENCY.format(metric.valor)}
                      </>
                    ) : (
                      <AnimatedNumber value={metric.quantidade} />
                    )}
                  </p>
                </div>
                {!isSaldo && metric.showValue && (
                  <p className="text-[10px] text-muted-foreground/45 tabular-nums mt-0.5">
                    {CURRENCY.format(metric.valor)}
                  </p>
                )}
                {isSaldo && (
                  <p className="text-[10px] text-muted-foreground/45 mt-0.5">
                    {saldoNegativo ? 'Déficit esperado' : 'Superávit esperado'}
                  </p>
                )}
              </div>
              <IconContainer
                size="md"
                className={cn(
                  `${metric.bgColor}/8`,
                  metric.highlight && metric.quantidade > 0 && 'border border-destructive/20',
                )}
              >
                <Icon className={cn('size-4', `${metric.color}/60`)} />
              </IconContainer>
            </div>

            {/* Barra de proporção (não exibida para saldo) */}
            {!isSaldo && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      `${metric.bgColor}/25`,
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
                  {pct}%
                </span>
              </div>
            )}
          </GlassPanel>
        );
      })}
    </div>
  );
}
