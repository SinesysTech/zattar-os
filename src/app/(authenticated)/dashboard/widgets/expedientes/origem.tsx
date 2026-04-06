'use client';

/**
 * Widget: Distribuicao por Origem — Expedientes
 * ============================================================================
 * Donut chart mostrando a distribuicao de expedientes por origem.
 * Usa data.expedientes.porOrigem (opcional).
 * ============================================================================
 */

import { FileText } from 'lucide-react';
import {
  MiniDonut,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function OrigemDistribution() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const porOrigem = (expedientes as { porOrigem?: { origem: string; count: number; color: string }[] } | null)?.porOrigem;

  if (!porOrigem || porOrigem.length === 0) {
    return (
      <WidgetContainer
        title="Origem dos Expedientes"
        icon={FileText}
        subtitle="Distribuicao por origem"
        depth={1}
        className="h-auto! self-start p-4!"
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de origem nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  const total = porOrigem.reduce((s, o) => s + o.count, 0);
  const segments = porOrigem.map((o) => ({
    value: o.count,
    color: o.color,
    label: o.origem,
  }));

  return (
    <WidgetContainer
      title="Origem dos Expedientes"
      icon={FileText}
      subtitle="Distribuicao por origem"
      depth={1}
      className="h-auto! self-start p-4!"
    >
      <div className="flex items-center gap-5 mt-2">
        <MiniDonut
          segments={segments}
          size={80}
          strokeWidth={10}
          centerLabel={fmtNum(total)}
        />

        <div className="flex-1 space-y-1.5">
          {porOrigem.map((o) => (
            <div key={o.origem} className="flex items-center gap-2">
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: o.color }}
              />
              <span className="text-[10px] text-muted-foreground/70 flex-1 truncate">
                {o.origem}
              </span>
              <span className="text-[11px] font-bold tabular-nums">
                {fmtNum(o.count)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
