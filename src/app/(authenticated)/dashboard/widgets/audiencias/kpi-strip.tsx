'use client';

/**
 * Widget: KPI Strip de Audiencias
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.*.
 * Composicao: Este Mes, Prox. 7 dias, Comparecimento ring, Duracao media.
 *
 * Uso:
 *   import { KpiStrip } from '@/app/(authenticated)/dashboard/widgets/audiencias/kpi-strip'
 * ============================================================================
 */

import { Calendar, Clock } from 'lucide-react';
import {
  WidgetContainer,
  Stat,
  ProgressRing,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

export function KpiStrip() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="sm" />;

  const comparecimento = audiencias.taxaComparecimento ?? 0;
  const duracaoMedia = audiencias.duracaoMedia ?? 0;

  const comparecimentoColor =
    comparecimento >= 80
      ? 'var(--success)'
      : comparecimento >= 60
        ? 'var(--warning)'
        : 'var(--destructive)';

  return (
    <WidgetContainer
      title="Audiencias"
      icon={Calendar}
      subtitle="Indicadores-chave"
    >
      <div className="grid grid-cols-4 gap-3 items-center">
        <Stat
          label="Este Mes"
          value={fmtNum(audiencias.proximos30dias)}
          small
        />

        <Stat
          label="Prox. 7 dias"
          value={fmtNum(audiencias.proximos7dias)}
          delta={
            audiencias.hoje > 0
              ? `${audiencias.hoje} hoje`
              : audiencias.amanha > 0
                ? `${audiencias.amanha} amanha`
                : undefined
          }
          deltaType={audiencias.hoje > 0 ? 'alert' : 'neutral'}
          small
        />

        <div className="flex flex-col items-center gap-1">
          <ProgressRing
            percent={comparecimento}
            size={44}
            color={comparecimentoColor}
          />
          <p className="text-[9px] text-muted-foreground/50 text-center">
            Comparecimento
          </p>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground/50" />
            <span className="font-display text-lg font-bold tabular-nums">
              {duracaoMedia > 0 ? `${duracaoMedia}` : '--'}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground/50 text-center">
            Duracao media (min)
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
