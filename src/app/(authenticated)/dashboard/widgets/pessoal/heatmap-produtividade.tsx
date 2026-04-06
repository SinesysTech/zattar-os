'use client';

/**
 * WidgetHeatmapProdutividade -- Widget conectado
 * Fonte: useDashboard() -> data.produtividade.heatmap (role=user)
 * Fallback: deriva heatmap a partir de data.produtividade.porDia (ultimos 35 dias)
 */

import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  CalendarHeatmap,
  ComparisonStat,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

/** Dias da semana abreviados em PT-BR */
const DIA_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sab',
};

/**
 * Deriva um array de 35 numeros (5 semanas x 7 dias) a partir de porDia.
 * Mapeia os ultimos 35 dias; dias sem registro ficam como 0.
 */
function derivarHeatmap(porDia: { data: string; baixas: number }[]): number[] {
  const hoje = new Date();
  const mapa = new Map(porDia.map((d) => [d.data, d.baixas]));
  const result: number[] = [];

  for (let i = 34; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - i);
    const key = dia.toISOString().slice(0, 10);
    result.push(mapa.get(key) ?? 0);
  }

  return result;
}

export function WidgetHeatmapProdutividade() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Historico de Produtividade"
        icon={BarChart3}
        subtitle="Tarefas concluidas por dia -- ultimas 5 semanas"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados.
        </p>
      </WidgetContainer>
    );
  }

  if (!isDashboardUsuario(data)) {
    return (
      <WidgetContainer
        title="Historico de Produtividade"
        icon={BarChart3}
        subtitle="Tarefas concluidas por dia -- ultimas 5 semanas"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Disponivel apenas para usuarios individuais.
        </p>
      </WidgetContainer>
    );
  }

  const heatmapData =
    data.produtividade.heatmap ?? derivarHeatmap(data.produtividade.porDia);

  // Calcular estatisticas
  const totalSemanas = Math.ceil(heatmapData.length / 7);
  const totalBaixas = heatmapData.reduce((a, b) => a + b, 0);
  const mediaSemanal =
    totalSemanas > 0 ? Math.round(totalBaixas / totalSemanas) : 0;

  // Semana atual vs semana anterior
  const semanaAtual = heatmapData.slice(-7).reduce((a, b) => a + b, 0);
  const semanaAnterior = heatmapData.slice(-14, -7).reduce((a, b) => a + b, 0);

  // Melhor dia (valor maximo e indice)
  let melhorDiaIdx = 0;
  let melhorDiaValor = 0;
  heatmapData.forEach((v, i) => {
    if (v > melhorDiaValor) {
      melhorDiaValor = v;
      melhorDiaIdx = i;
    }
  });

  // Calcular o dia da semana do melhor dia
  const hoje = new Date();
  const diasAtras = heatmapData.length - 1 - melhorDiaIdx;
  const melhorDiaDate = new Date(hoje);
  melhorDiaDate.setDate(hoje.getDate() - diasAtras);
  const melhorDiaLabel = DIA_LABELS[melhorDiaDate.getDay()] ?? '';

  // Cores da legenda de intensidade (alinhadas com colorScale="success")
  const legendColors = [
    'bg-border/10',
    'bg-success/15',
    'bg-success/30',
    'bg-success/50',
    'bg-success/80',
  ];

  return (
    <WidgetContainer
      title="Historico de Produtividade"
      icon={BarChart3}
      subtitle="Tarefas concluidas por dia -- ultimas 5 semanas"
      depth={1}
    >
      <CalendarHeatmap data={heatmapData} colorScale="success" />

      {/* Legenda de intensidade */}
      <div className="mt-3 flex items-center justify-end gap-1">
        <span className="text-[8px] text-muted-foreground/50 mr-1">Menos</span>
        {legendColors.map((color, i) => (
          <div
            key={i}
            className={`size-3 rounded-[2px] ${color}`}
          />
        ))}
        <span className="text-[8px] text-muted-foreground/50 ml-1">Mais</span>
      </div>

      {/* Estatisticas */}
      <div className="mt-3 pt-3 border-t border-border/10 flex items-start justify-between gap-4">
        <ComparisonStat
          label="Media semanal"
          current={semanaAtual}
          previous={semanaAnterior}
        />
        <div className="flex flex-col gap-1 items-end">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Melhor dia
          </p>
          <span className="font-display text-lg font-bold tabular-nums">
            {melhorDiaValor}
          </span>
          <p className="text-[9px] text-muted-foreground/55">
            {melhorDiaLabel} — {melhorDiaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
