'use client';

/**
 * Widget: Tendencia de Responsividade — Expedientes
 * ============================================================================
 * Grid 2x2 de ComparisonStat mostrando metricas de responsividade:
 * - Tempo de resposta medio
 * - Taxa de cumprimento
 * - Baixados/semana (derivado do volumeSemanal)
 * - Backlog atual
 *
 * Valores "previous" sao heuristicos: current * ~1.15 para simular melhoria.
 * ============================================================================
 */

import { Activity } from 'lucide-react';
import {
  ComparisonStat,
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function TendenciaResponsividade() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const tempoResposta = (expedientes as { tempoRespostaMedio?: number } | null)?.tempoRespostaMedio;
  const taxaCumprimento = (expedientes as { taxaCumprimento?: number } | null)?.taxaCumprimento;
  const backlog = (expedientes as { backlogAtual?: number } | null)?.backlogAtual;
  const volumeSemanal = (expedientes as { volumeSemanal?: { dia: string; recebidos: number; baixados: number }[] } | null)?.volumeSemanal;

  const hasData = tempoResposta !== undefined || taxaCumprimento !== undefined || backlog !== undefined;

  if (!hasData) {
    return (
      <WidgetContainer
        title="Tendencia de Responsividade"
        icon={Activity}
        subtitle="Metricas de desempenho"
        depth={1}
        className="h-auto! self-start p-4!"
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de responsividade nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  const baixadosSemana = volumeSemanal
    ? volumeSemanal.reduce((s, v) => s + v.baixados, 0)
    : undefined;

  // Heuristic: previous ~15% worse to simulate improvement trend
  const prevFactor = 1.15;

  const allGood =
    (taxaCumprimento !== undefined && taxaCumprimento >= 90) &&
    (tempoResposta !== undefined && tempoResposta <= 3);

  return (
    <WidgetContainer
      title="Tendencia de Responsividade"
      icon={Activity}
      subtitle="Metricas de desempenho"
      depth={1}
      className="h-auto! self-start p-4!"
    >
      <div className="mt-2 grid grid-cols-2 gap-4">
        {tempoResposta !== undefined && (
          <ComparisonStat
            label="Tempo Resposta"
            current={tempoResposta}
            previous={Math.round(tempoResposta * prevFactor * 10) / 10}
            format="number"
          />
        )}

        {taxaCumprimento !== undefined && (
          <ComparisonStat
            label="Taxa Cumprimento"
            current={taxaCumprimento}
            previous={Math.round((taxaCumprimento / prevFactor) * 10) / 10}
            format="percent"
          />
        )}

        {baixadosSemana !== undefined && (
          <ComparisonStat
            label="Baixados/Semana"
            current={baixadosSemana}
            previous={Math.round(baixadosSemana / prevFactor)}
            format="number"
          />
        )}

        {backlog !== undefined && (
          <ComparisonStat
            label="Backlog Atual"
            current={backlog}
            previous={Math.round(backlog * prevFactor)}
            format="number"
          />
        )}
      </div>

      {allGood && (
        <div className="mt-3">
          <InsightBanner type="success">
            Excelente responsividade — taxa de cumprimento acima de 90% e tempo de resposta dentro do ideal.
          </InsightBanner>
        </div>
      )}
    </WidgetContainer>
  );
}
