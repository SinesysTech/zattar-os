'use client';

/**
 * Widget: Resultado de Decisao — Expedientes
 * ============================================================================
 * Stacked bar + progress ring por item mostrando resultados de decisoes.
 * Usa data.expedientes.resultadoDecisao (opcional).
 * ============================================================================
 */

import { Activity } from 'lucide-react';
import {
  ProgressRing,
  StackedBar,
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function ResultadoDecisao() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const resultados = (expedientes as { resultadoDecisao?: { resultado: string; count: number; color: string }[] } | null)?.resultadoDecisao;

  if (!resultados || resultados.length === 0) {
    return (
      <WidgetContainer
        title="Resultado de Decisoes"
        icon={Activity}
        subtitle="Distribuicao por resultado"
        depth={1}
        className="h-auto! self-start p-4!"
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de resultado nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  const total = resultados.reduce((s, r) => s + r.count, 0);
  const segments = resultados.map((r) => ({
    value: r.count,
    color: r.color,
    label: r.resultado,
  }));

  return (
    <WidgetContainer
      title="Resultado de Decisoes"
      icon={Activity}
      subtitle="Distribuicao por resultado"
      depth={1}
      className="h-auto! self-start p-4!"
    >
      <div className="mt-2">
        <StackedBar segments={segments} height={10} />
      </div>

      <div className="mt-3 space-y-2">
        {resultados.map((r) => {
          const percent = total > 0 ? Math.round((r.count / total) * 100) : 0;
          return (
            <div key={r.resultado} className="flex items-center gap-3">
              <ProgressRing
                percent={percent}
                size={32}
                color={r.color}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{r.resultado}</p>
                <p className="text-[9px] text-muted-foreground/55">
                  {fmtNum(r.count)} expediente{r.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}
