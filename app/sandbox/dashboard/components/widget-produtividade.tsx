'use client';

import { TrendingUp, Scale, Calendar, FileCheck, CheckSquare } from 'lucide-react';
import { WidgetWrapper } from './widget-wrapper';
import { MiniAreaChart, CHART_COLORS, CHART_PALETTE } from './mini-chart';
import { ProdutividadeResumo } from '../types/dashboard.types';

interface WidgetProdutividadeProps {
  data: ProdutividadeResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

const metrics = [
  { key: 'processosAtribuidos', label: 'Processos', icon: Scale, color: CHART_PALETTE[0] },
  { key: 'audienciasRealizadas', label: 'Audiências', icon: Calendar, color: CHART_PALETTE[1] },
  { key: 'pendentesResolvidos', label: 'Pendentes', icon: FileCheck, color: CHART_PALETTE[2] },
  { key: 'tarefasConcluidas', label: 'Tarefas', icon: CheckSquare, color: CHART_PALETTE[3] },
];

export function WidgetProdutividade({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetProdutividadeProps) {
  // Calcular totais do período
  const totals = data.ultimoMes.reduce(
    (acc, day) => ({
      processosAtribuidos: acc.processosAtribuidos + day.processosAtribuidos,
      audienciasRealizadas: acc.audienciasRealizadas + day.audienciasRealizadas,
      pendentesResolvidos: acc.pendentesResolvidos + day.pendentesResolvidos,
      tarefasConcluidas: acc.tarefasConcluidas + day.tarefasConcluidas,
    }),
    { processosAtribuidos: 0, audienciasRealizadas: 0, pendentesResolvidos: 0, tarefasConcluidas: 0 }
  );

  // Preparar dados do gráfico (últimos 14 dias para melhor visualização)
  const chartData = data.ultimoMes.slice(-14).map((day) => ({
    name: day.periodo,
    value: day.processosAtribuidos + day.audienciasRealizadas + day.pendentesResolvidos,
    ...day,
  }));

  return (
    <WidgetWrapper
      title="Produtividade"
      icon={TrendingUp}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Gráfico de área */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Últimos 14 dias</p>
          <MiniAreaChart
            data={chartData}
            dataKey="value"
            color={CHART_COLORS.primary}
            height={100}
            showXAxis
            gradient
          />
        </div>

        {/* Métricas do mês */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const value = totals[metric.key as keyof typeof totals];

            return (
              <div
                key={metric.key}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div
                  className="rounded-md p-1.5"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: metric.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Média diária */}
        <div className="flex items-center justify-between pt-3 border-t text-sm">
          <span className="text-muted-foreground">Média diária</span>
          <span className="font-medium">
            {data.mediaProcessosDia.toFixed(1)} processos/dia
          </span>
        </div>
      </div>
    </WidgetWrapper>
  );
}
