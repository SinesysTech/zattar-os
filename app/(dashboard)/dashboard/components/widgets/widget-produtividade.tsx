'use client';

import { TrendingUp, TrendingDown, Minus, FileCheck } from 'lucide-react';
import { WidgetWrapper } from './widget-wrapper';
import { MiniAreaChart, CHART_COLORS } from '@/components/ui/charts';
import type { ProdutividadeResumo } from '@/backend/types/dashboard/types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetProdutividadeProps {
  data: ProdutividadeResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

export function WidgetProdutividade({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetProdutividadeProps) {
  // Preparar dados do gráfico
  const chartData = data.porDia.map((day) => ({
    name: new Date(day.data + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short',
    }),
    value: day.baixas,
  }));

  // Determinar tendência
  const trend =
    data.comparativoSemanaAnterior > 0
      ? 'up'
      : data.comparativoSemanaAnterior < 0
        ? 'down'
        : 'neutral';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <WidgetWrapper
      title="Produtividade"
      icon={FileCheck}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.baixasHoje}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.baixasSemana}</p>
            <p className="text-xs text-muted-foreground">Semana</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{data.baixasMes}</p>
            <p className="text-xs text-muted-foreground">Mês</p>
          </div>
        </div>

        {/* Gráfico de área */}
        {chartData.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            <MiniAreaChart
              data={chartData}
              dataKey="value"
              color={CHART_COLORS.primary}
              height={80}
              showXAxis
              gradient
            />
          </div>
        )}

        {/* Comparativo e média */}
        <div className="flex items-center justify-between pt-3 border-t text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">vs semana anterior</span>
            <div className={cn('flex items-center gap-1 font-medium', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {data.comparativoSemanaAnterior > 0 ? '+' : ''}
                {data.comparativoSemanaAnterior}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Média: </span>
            <span className="font-medium">{data.mediaDiaria.toFixed(1)}/dia</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
