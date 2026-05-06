'use client';

/**
 * Widget: Saude dos Prazos — Expedientes
 * ============================================================================
 * Score de saude baseado em vencidos, venceHoje e proximos7dias.
 * Formula: 100 - (vencidos * 15) - (venceHoje * 8) - (proximos7dias * 3)
 * Clamped entre 0 e 100.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import {
  AnimatedNumber,
  GaugeMeter,
  InsightBanner,
  WidgetContainer,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function SaudePrazos() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : {
          total: data.metricas.totalExpedientes,
          vencidos: data.metricas.expedientesVencidos,
          venceHoje: 0,
          venceAmanha: 0,
          proximos7dias: 0,
          porTipo: [],
          tempoRespostaMedio: undefined as number | undefined,
        };

  const { vencidos, venceHoje, proximos7dias } = expedientes;
  const tempoResposta = 'tempoRespostaMedio' in expedientes
    ? (expedientes as { tempoRespostaMedio?: number }).tempoRespostaMedio
    : undefined;

  const rawScore = 100 - (vencidos * 15) - (venceHoje * 8) - (proximos7dias * 3);
  const score = Math.max(0, Math.min(100, rawScore));

  const status: 'good' | 'warning' | 'danger' =
    score >= 70 ? 'good' : score >= 40 ? 'warning' : 'danger';

  return (
    <WidgetContainer
      title="Saude dos Prazos"
      icon={AlertTriangle}
      subtitle="Score de conformidade de prazos"
      depth={1}
      className={cn(/* design-system-escape: p-4! → usar <Inset> */ "h-auto! self-start p-4!")}
    >
      <div className={cn("flex items-start inline-default mt-1")}>
        <GaugeMeter
          value={score}
          max={100}
          label="score"
          status={status}
          size={90}
        />

        <div className={cn("flex-1 stack-tight")}>
          <div className={cn("flex items-baseline inline-tight")}>
            <span className={cn("text-[10px] text-muted-foreground/50 uppercase tracking-wider")}>
              Vencidos
            </span>
            <AnimatedNumber
              value={vencidos}
              className={cn( "font-display text-body-lg font-bold text-destructive/80")}
            />
          </div>

          <div className={cn("flex items-baseline inline-tight")}>
            <span className={cn("text-[10px] text-muted-foreground/50 uppercase tracking-wider")}>
              Vencem Hoje
            </span>
            <AnimatedNumber
              value={venceHoje}
              className={cn( "font-display text-body-lg font-bold text-warning/80")}
            />
          </div>

          {tempoResposta !== undefined && (
            <div className={cn("flex items-baseline inline-tight")}>
              <span className={cn("text-[10px] text-muted-foreground/50 uppercase tracking-wider")}>
                Prazo Medio
              </span>
              <span className={cn( "font-display text-body-sm font-bold")}>
                {tempoResposta}d
              </span>
            </div>
          )}
        </div>
      </div>

      {venceHoje > 0 && (
        <div className="mt-3">
          <InsightBanner type="warning">
            {venceHoje} expediente{venceHoje > 1 ? 's' : ''} vence{venceHoje > 1 ? 'm' : ''} hoje — priorize a tratativa imediata.
          </InsightBanner>
        </div>
      )}
    </WidgetContainer>
  );
}
