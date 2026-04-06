'use client';

/**
 * Widget: Saude dos Prazos — Expedientes
 * ============================================================================
 * Score de saude baseado em vencidos, venceHoje e proximos7dias.
 * Formula: 100 - (vencidos * 15) - (venceHoje * 8) - (proximos7dias * 3)
 * Clamped entre 0 e 100.
 * ============================================================================
 */

import { AlertTriangle } from 'lucide-react';
import {
  AnimatedNumber,
  GaugeMeter,
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';
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
      className="h-auto! self-start p-4!"
    >
      <div className="flex items-start gap-4 mt-1">
        <GaugeMeter
          value={score}
          max={100}
          label="score"
          status={status}
          size={90}
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Vencidos
            </span>
            <AnimatedNumber
              value={vencidos}
              className="font-display text-lg font-bold text-destructive/80"
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Vencem Hoje
            </span>
            <AnimatedNumber
              value={venceHoje}
              className="font-display text-lg font-bold text-warning/80"
            />
          </div>

          {tempoResposta !== undefined && (
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                Prazo Medio
              </span>
              <span className="font-display text-sm font-bold">
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
