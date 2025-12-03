'use client';

import { Building2, Scale, Calendar, FileCheck, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { WidgetWrapper } from './widget-wrapper';
import { MiniAreaChart, CHART_COLORS } from './mini-chart';
import { MetricasEscritorio } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetMetricasEscritorioProps {
  data: MetricasEscritorio;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricaCard({
  label,
  value,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  change?: number;
  icon: typeof Scale;
  color: string;
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div
        className="rounded-lg p-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold">{value.toLocaleString('pt-BR')}</p>
          {change !== undefined && (
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                isPositive && 'text-emerald-600',
                isNegative && 'text-red-600',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
              {isPositive ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function WidgetMetricasEscritorio({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetMetricasEscritorioProps) {
  const chartData = data.tendencia.map((t) => ({
    name: t.name,
    value: t.value,
    processos: t.processos,
    audiencias: t.audiencias,
  }));

  return (
    <WidgetWrapper
      title="Métricas do Escritório"
      icon={Building2}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Métricas principais em grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricaCard
            label="Processos"
            value={data.totalProcessos}
            change={data.comparativoMesAnterior.processos}
            icon={Scale}
            color={CHART_COLORS.info}
          />
          <MetricaCard
            label="Audiências"
            value={data.totalAudiencias}
            change={data.comparativoMesAnterior.audiencias}
            icon={Calendar}
            color={CHART_COLORS.success}
          />
          <MetricaCard
            label="Pendentes"
            value={data.totalPendentes}
            change={data.comparativoMesAnterior.pendentes}
            icon={FileCheck}
            color={CHART_COLORS.warning}
          />
          <MetricaCard
            label="Usuários"
            value={data.totalUsuarios}
            icon={Users}
            color={CHART_COLORS.primary}
          />
        </div>

        {/* Gráfico de tendência */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Tendência (últimos 6 meses)
          </p>
          <MiniAreaChart
            data={chartData}
            dataKey="value"
            color={CHART_COLORS.primary}
            height={80}
            showXAxis
            gradient
          />
        </div>

        {/* Valores financeiros */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Acordos</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(data.valorAcordos)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-400">Condenações</span>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(data.valorCondenacoes)}
            </p>
          </div>
        </div>

        {/* Status processos */}
        <div className="flex items-center justify-between pt-3 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Ativos</span>
            <span className="font-medium">{data.processosAtivos}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Arquivados</span>
            <span className="font-medium">{data.processosArquivados}</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
