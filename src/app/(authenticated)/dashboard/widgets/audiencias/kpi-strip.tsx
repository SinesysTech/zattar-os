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

import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';
import {
  WidgetContainer,
  Stat,
  ProgressRing,
  fmtNum,
} from '../primitives';
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
      <div className={cn("grid grid-cols-4 inline-medium items-center")}>
        <Stat
          label="Este Mes"
          value={fmtNum(audiencias.proximos30dias)}
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
        />

        <div className={cn("flex flex-col items-center inline-micro")}>
          <ProgressRing
            percent={comparecimento}
            size={44}
            color={comparecimentoColor}
          />
          <p className="text-[9px] text-muted-foreground/50 text-center">
            Comparecimento
          </p>
        </div>

        <div className={cn("flex flex-col items-center inline-nano")}>
          <div className={cn("flex items-center inline-micro")}>
            <Clock className="size-3 text-muted-foreground/50" />
            <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-display text-body-lg font-bold tabular-nums")}>
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
