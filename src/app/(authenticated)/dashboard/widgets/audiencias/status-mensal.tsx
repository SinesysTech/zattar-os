'use client';

/**
 * Widget: Status Mensal de Audiencias
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.statusMensal.
 * Exibe barras agrupadas (marcadas/realizadas/canceladas) por mes.
 *
 * Uso:
 *   import { StatusMensal } from '@/app/(authenticated)/dashboard/widgets/audiencias/status-mensal'
 * ============================================================================
 */

import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  MiniBar,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

const LEGEND_ITEMS = [
  { label: 'Marcadas', color: 'bg-primary/60' },
  { label: 'Realizadas', color: 'bg-success/60' },
  { label: 'Canceladas', color: 'bg-destructive/50' },
];

export function StatusMensal() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="md" />;

  const statusMensal = audiencias.statusMensal;

  if (!statusMensal || statusMensal.length === 0) {
    return (
      <WidgetContainer
        title="Status Mensal"
        icon={BarChart3}
        subtitle="Marcadas vs realizadas vs canceladas"
      >
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <BarChart3 className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Dados de status mensal indisponiveis
          </p>
        </div>
      </WidgetContainer>
    );
  }

  // Transform to MiniBar format — value = marcadas, value2 = realizadas
  // MiniBar supports value + value2, we show canceladas separately via a third grouped bar
  const barData = statusMensal.map((item) => ({
    label: item.mes,
    value: item.marcadas,
    value2: item.realizadas,
  }));

  // Compute total canceladas for insight
  const totalCanceladas = statusMensal.reduce((acc, s) => acc + s.canceladas, 0);
  const totalMarcadas = statusMensal.reduce((acc, s) => acc + s.marcadas, 0);
  const taxaCancelamento = totalMarcadas > 0
    ? ((totalCanceladas / totalMarcadas) * 100).toFixed(1)
    : '0';

  return (
    <WidgetContainer
      title="Status Mensal"
      icon={BarChart3}
      subtitle="Marcadas vs realizadas vs canceladas"
    >
      <div className="space-y-4">
        <MiniBar
          data={barData}
          height={56}
          barColor="bg-primary/60"
          barColor2="bg-success/60"
        />

        {/* Canceladas mini-bar below */}
        <div className="flex items-end gap-2 w-full" style={{ height: 24 }}>
          {statusMensal.map((item) => {
            const maxCanc = Math.max(...statusMensal.map((s) => s.canceladas), 1);
            return (
              <div key={`canc-${item.mes}`} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex gap-0.5 items-end w-full" style={{ height: 16 }}>
                  <div
                    className="flex-1 rounded-t-sm bg-destructive/50 transition-all duration-500"
                    style={{ height: `${(item.canceladas / maxCanc) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 justify-center">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`size-2 rounded-sm ${item.color}`} />
              <span className="text-[9px] text-muted-foreground/60">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Cancelamento insight */}
        {totalCanceladas > 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Taxa de cancelamento: {taxaCancelamento}%
          </p>
        )}
      </div>
    </WidgetContainer>
  );
}
