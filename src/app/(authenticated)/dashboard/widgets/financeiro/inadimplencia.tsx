'use client';

/**
 * Widget: Inadimplência
 * ============================================================================
 * Conectado ao dashboard financeiro real. Calcula a taxa de inadimplência
 * a partir de valorVencido / (receitasPendentes + valorVencido).
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import {
  WidgetContainer,
  ProgressRing,
  InsightBanner,
  fmtMoeda,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboardFinanceiro } from '../../hooks';

export function WidgetInadimplencia() {
  const { data, isLoading, error } = useDashboardFinanceiro();

  if (isLoading) {
    return <WidgetSkeleton size="sm" />;
  }

  if (error || !data) {
    return (
      <WidgetContainer
        title="Inadimplência"
        subtitle="Sobre carteira a receber"
        icon={AlertTriangle}
      >
        <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-6 text-center")}>
          Dados de inadimplência indisponíveis.
        </p>
      </WidgetContainer>
    );
  }

  const valorVencido = data.valorVencido ?? 0;
  const receitasPendentes = data.receitasPendentes ?? 0;
  // Carteira a receber = pendentes + vencidas (vencidas são um subconjunto de pendentes na query original)
  const totalAReceber = receitasPendentes;
  const inadimplenciaPercent = totalAReceber > 0
    ? Math.round((valorVencido / totalAReceber) * 100)
    : 0;
  const isAlert = inadimplenciaPercent > 10;
  const ringColor = isAlert ? 'var(--destructive)' : 'var(--success)';

  return (
    <WidgetContainer
      title="Inadimplência"
      subtitle="Sobre carteira a receber"
      icon={AlertTriangle}
    >
      <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex items-center gap-5 mt-1")}>
        <ProgressRing
          percent={Math.min(inadimplenciaPercent, 100)}
          size={72}
          color={ringColor}
        />
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
          <div>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5")}>
              Em atraso
            </p>
            <p
              className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold font-display tabular-nums")}
              style={{ color: ringColor }}
            >
              {valorVencido > 0 ? fmtMoeda(valorVencido) : '—'}
            </p>
          </div>
          <div>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5")}>
              Carteira total
            </p>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold font-display tabular-nums text-muted-foreground/70")}>
              {totalAReceber > 0 ? fmtMoeda(totalAReceber) : '—'}
            </p>
          </div>
        </div>
      </div>

      {isAlert && (
        <div className="mt-4">
          <InsightBanner type="alert">
            Inadimplência em {inadimplenciaPercent}% — {data.contasVencidas} conta(s) vencida(s).
          </InsightBanner>
        </div>
      )}

      {!isAlert && totalAReceber > 0 && (
        <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-4 pt-3 border-t border-border/10")}>
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 text-success/60")}>
            <TrendingDown className="size-3.5" />
            <span className="text-[10px]">Dentro da meta de 10%</span>
          </div>
        </div>
      )}

      {totalAReceber === 0 && (
        <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-4 pt-3 border-t border-border/10")}>
          <p className="text-[9px] text-muted-foreground/55 text-center">
            Sem receitas pendentes no período.
          </p>
        </div>
      )}
    </WidgetContainer>
  );
}
