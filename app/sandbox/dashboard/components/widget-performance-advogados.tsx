'use client';

import { Trophy, Medal, Award, Star, Scale, Calendar, FileCheck, Clock } from 'lucide-react';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { MiniBarChart, CHART_PALETTE } from './mini-chart';
import { Badge } from '@/components/ui/badge';
import { PerformanceAdvogado } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetPerformanceAdvogadosProps {
  data: PerformanceAdvogado[];
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['#f59e0b', '#94a3b8', '#cd7f32'];

function AdvogadoRankItem({
  advogado,
  rank,
}: {
  advogado: PerformanceAdvogado;
  rank: number;
}) {
  const isTop3 = rank < 3;
  const RankIcon = rankIcons[rank] || Star;
  const color = rankColors[rank] || '#6b7280';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        isTop3 ? 'bg-muted/70' : 'hover:bg-muted/50'
      )}
    >
      {/* Posição */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
          isTop3 && 'shadow-sm'
        )}
        style={{
          backgroundColor: isTop3 ? `${color}20` : 'transparent',
        }}
      >
        {isTop3 ? (
          <RankIcon className="h-4 w-4" style={{ color }} />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {rank + 1}º
          </span>
        )}
      </div>

      {/* Info do advogado */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {advogado.usuario.nome_exibicao}
          </span>
          {advogado.usuario.cargo && (
            <Badge variant="soft" tone="neutral" className="text-[10px]">
              {advogado.usuario.cargo}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            {advogado.processosAtivos}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {advogado.audienciasRealizadas}
          </span>
          <span className="flex items-center gap-1">
            <FileCheck className="h-3 w-3" />
            {advogado.pendentesResolvidos}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {advogado.tempoMedioResolucao}d
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="text-lg font-bold" style={{ color: isTop3 ? color : undefined }}>
          {advogado.score}
        </p>
        <p className="text-[10px] text-muted-foreground">pontos</p>
      </div>
    </div>
  );
}

export function WidgetPerformanceAdvogados({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetPerformanceAdvogadosProps) {
  const isEmpty = data.length === 0;

  // Dados para o gráfico
  const chartData = data.slice(0, 5).map((a) => ({
    name: a.usuario.nome_exibicao.split(' ')[0],
    value: a.score,
  }));

  // Estatísticas agregadas
  const avgScore = data.length > 0
    ? Math.round(data.reduce((acc, a) => acc + a.score, 0) / data.length)
    : 0;
  const avgResolucao = data.length > 0
    ? (data.reduce((acc, a) => acc + a.tempoMedioResolucao, 0) / data.length).toFixed(1)
    : 0;

  return (
    <WidgetWrapper
      title="Performance dos Advogados"
      icon={Trophy}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={Trophy}
          title="Sem dados de performance"
          description="Não há dados suficientes para calcular a performance"
        />
      ) : (
        <div className="space-y-4">
          {/* Gráfico de barras */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Score por advogado</p>
            <MiniBarChart
              data={chartData}
              height={100}
              color={CHART_PALETTE[0]}
              showXAxis
            />
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xl font-bold">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Score médio</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xl font-bold">{avgResolucao}d</p>
              <p className="text-xs text-muted-foreground">Tempo médio resolução</p>
            </div>
          </div>

          {/* Ranking */}
          <div className="space-y-1 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Ranking</p>
            {data.slice(0, 5).map((advogado, index) => (
              <AdvogadoRankItem
                key={advogado.usuario.id}
                advogado={advogado}
                rank={index}
              />
            ))}
          </div>

          {/* Legenda de métricas */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Score = Processos×5 + Audiências×3 + Pendentes×2 - Tempo médio
            </p>
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
