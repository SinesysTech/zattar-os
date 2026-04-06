'use client';

/**
 * Widget: Volume Semanal — Expedientes
 * ============================================================================
 * Grafico de barras dual mostrando recebidos vs baixados por dia da semana.
 * Usa data.expedientes.volumeSemanal (opcional).
 * ============================================================================
 */

import { Activity } from 'lucide-react';
import {
  MiniBar,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function VolumeSemanal() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const volumeSemanal = (expedientes as { volumeSemanal?: { dia: string; recebidos: number; baixados: number }[] } | null)?.volumeSemanal;

  if (!volumeSemanal || volumeSemanal.length === 0) {
    return (
      <WidgetContainer
        title="Volume Semanal"
        icon={Activity}
        subtitle="Recebidos vs baixados"
        depth={1}
        className="h-auto! self-start p-4!"
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de volume semanal nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  const barData = volumeSemanal.map((v) => ({
    label: v.dia,
    value: v.recebidos,
    value2: v.baixados,
  }));

  const totalRecebidos = volumeSemanal.reduce((s, v) => s + v.recebidos, 0);
  const totalBaixados = volumeSemanal.reduce((s, v) => s + v.baixados, 0);

  return (
    <WidgetContainer
      title="Volume Semanal"
      icon={Activity}
      subtitle="Recebidos vs baixados"
      depth={1}
      className="h-auto! self-start p-4!"
    >
      <div className="mt-2">
        <MiniBar
          data={barData}
          height={56}
          barColor="bg-primary/60"
          barColor2="bg-success/50"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/10 pt-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary/60" />
            <span className="text-[9px] text-muted-foreground/60">
              Recebidos: {fmtNum(totalRecebidos)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-success/50" />
            <span className="text-[9px] text-muted-foreground/60">
              Baixados: {fmtNum(totalBaixados)}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-bold tabular-nums">
          {fmtNum(totalRecebidos + totalBaixados)}
        </span>
      </div>
    </WidgetContainer>
  );
}
