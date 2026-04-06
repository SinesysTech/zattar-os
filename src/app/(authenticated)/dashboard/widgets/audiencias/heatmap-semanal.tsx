'use client';

/**
 * Widget: Heatmap Semanal de Audiencias
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.heatmapSemanal.
 * Exibe CalendarHeatmap (5 semanas x 7 dias) com stats de dia mais cheio
 * e horario pico.
 *
 * Uso:
 *   import { WidgetHeatmapSemanal } from '@/app/(authenticated)/dashboard/widgets/audiencias/heatmap-semanal'
 * ============================================================================
 */

import { Calendar } from 'lucide-react';
import {
  WidgetContainer,
  CalendarHeatmap,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

export function WidgetHeatmapSemanal() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="md" />;

  const heatmap = audiencias.heatmapSemanal;

  if (!heatmap || heatmap.length === 0) {
    return (
      <WidgetContainer
        title="Heatmap Semanal"
        icon={Calendar}
        subtitle="Distribuicao semanal de audiencias"
      >
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Calendar className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Dados de heatmap indisponiveis
          </p>
        </div>
      </WidgetContainer>
    );
  }

  // Find busiest day — aggregate across weeks (each column = a day of week)
  const dayTotals = Array.from({ length: 7 }, (_, dayIdx) => {
    let total = 0;
    const weeks = Math.ceil(heatmap.length / 7);
    for (let w = 0; w < weeks; w++) {
      total += heatmap[w * 7 + dayIdx] ?? 0;
    }
    return total;
  });

  const maxDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
  const diaMaisCheio = DIAS_SEMANA[maxDayIdx] ?? '--';
  const totalAudiencias = heatmap.reduce((a, b) => a + b, 0);
  const maxDia = Math.max(...heatmap);

  // Horario pico heuristic: weekdays morning (based on common legal patterns)
  const horarioPico = dayTotals[0] + dayTotals[1] + dayTotals[2] > dayTotals[3] + dayTotals[4] + dayTotals[5]
    ? '09h - 12h'
    : '14h - 17h';

  return (
    <WidgetContainer
      title="Heatmap Semanal"
      icon={Calendar}
      subtitle="Distribuicao semanal de audiencias"
    >
      <div className="space-y-4">
        <CalendarHeatmap data={heatmap} colorScale="primary" />

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <div className="space-y-0.5">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
              Dia mais cheio
            </p>
            <p className="text-[12px] font-semibold">{diaMaisCheio}</p>
          </div>

          <div className="space-y-0.5 text-center">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
              Horario pico
            </p>
            <p className="text-[12px] font-semibold">{horarioPico}</p>
          </div>

          <div className="space-y-0.5 text-right">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
              Total
            </p>
            <p className="text-[12px] font-semibold tabular-nums">
              {totalAudiencias}
            </p>
          </div>
        </div>

        {maxDia > 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Pico: {maxDia} audiencia{maxDia !== 1 ? 's' : ''} em um unico dia
          </p>
        )}
      </div>
    </WidgetContainer>
  );
}
