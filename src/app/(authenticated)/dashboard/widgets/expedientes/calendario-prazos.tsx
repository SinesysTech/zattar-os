'use client';

/**
 * Widget: Calendario de Prazos — Expedientes
 * ============================================================================
 * Heatmap estilo GitHub mostrando densidade de prazos por dia.
 * Usa data.expedientes.calendarioPrazos (opcional).
 * colorScale="destructive" para destacar urgencia.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import {
  CalendarHeatmap,
  WidgetContainer,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function CalendarioPrazos() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const calendarioPrazos = (expedientes as { calendarioPrazos?: number[] } | null)?.calendarioPrazos;

  if (!calendarioPrazos || calendarioPrazos.length === 0) {
    return (
      <WidgetContainer
        title="Calendario de Prazos"
        icon={CalendarDays}
        subtitle="Densidade de prazos por dia"
        depth={1}
        className={cn(/* design-system-escape: p-4! → usar <Inset> */ "h-auto! self-start p-4!")}
      >
        <p className={cn("text-[11px] text-muted-foreground/60 py-6 text-center")}>
          Dados de calendario nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Calendario de Prazos"
      icon={CalendarDays}
      subtitle="Densidade de prazos por dia"
      depth={1}
      className={cn(/* design-system-escape: p-4! → usar <Inset> */ "h-auto! self-start p-4!")}
    >
      <div className="mt-2">
        <CalendarHeatmap
          data={calendarioPrazos}
          colorScale="destructive"
        />
      </div>

      <div className={cn("mt-3 flex items-center inline-snug justify-end")}>
        <span className="text-[8px] text-muted-foreground/50">Menos</span>
        <div className={cn("flex inline-nano")}>
          <div className="size-3 rounded-[2px] bg-border/10" />
          <div className="size-3 rounded-[2px] bg-destructive/15" />
          <div className="size-3 rounded-[2px] bg-destructive/30" />
          <div className="size-3 rounded-[2px] bg-destructive/50" />
          <div className="size-3 rounded-[2px] bg-destructive/80" />
        </div>
        <span className="text-[8px] text-muted-foreground/50">Mais</span>
      </div>
    </WidgetContainer>
  );
}
