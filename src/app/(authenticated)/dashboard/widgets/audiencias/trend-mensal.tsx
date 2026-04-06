'use client';

/**
 * Widget: Trend Mensal de Audiencias
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.trendMensal.
 * Exibe SVG area chart com valor atual, delta vs anterior e media.
 *
 * Uso:
 *   import { TrendMensal } from '@/app/(authenticated)/dashboard/widgets/audiencias/trend-mensal'
 * ============================================================================
 */

import { TrendingUp } from 'lucide-react';
import {
  WidgetContainer,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

// ─── Inline TrendAreaChart ──────────────────────────────────────────────

function TrendAreaChart({
  data,
  width = 200,
  height = 60,
  color = 'var(--primary)',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;

  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  const gradientId = `trend-area-${color.replace(/[^a-z0-9]/g, '')}`;
  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-70"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="3.5"
        fill={color}
        className="opacity-90"
      />
    </svg>
  );
}

// ─── Widget ─────────────────────────────────────────────────────────────

export function TrendMensal() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="md" />;

  const trend = audiencias.trendMensal;

  if (!trend || trend.length < 2) {
    return (
      <WidgetContainer
        title="Tendencia Mensal"
        icon={TrendingUp}
        subtitle="Evolucao de audiencias"
      >
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <TrendingUp className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Dados de tendencia indisponiveis
          </p>
        </div>
      </WidgetContainer>
    );
  }

  const currentMonth = trend[trend.length - 1];
  const previousMonth = trend[trend.length - 2];
  const delta = currentMonth - previousMonth;
  const deltaPct = previousMonth > 0
    ? ((delta / previousMonth) * 100).toFixed(1)
    : '0';
  const average = Math.round(trend.reduce((a, b) => a + b, 0) / trend.length);
  const isPositive = delta >= 0;

  return (
    <WidgetContainer
      title="Tendencia Mensal"
      icon={TrendingUp}
      subtitle="Evolucao de audiencias (12 meses)"
    >
      <div className="space-y-3">
        {/* Stats row */}
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Mes Atual
            </p>
            <p className="font-display text-xl font-bold tabular-nums">
              {currentMonth}
            </p>
          </div>
          <div>
            <span
              className={`text-[11px] font-medium ${
                isPositive ? 'text-success/70' : 'text-destructive/70'
              }`}
            >
              {isPositive ? '+' : ''}
              {delta} ({isPositive ? '+' : ''}
              {deltaPct}%)
            </span>
            <p className="text-[9px] text-muted-foreground/50">
              vs. mes anterior
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Media
            </p>
            <p className="text-[14px] font-semibold tabular-nums">
              {average}
            </p>
          </div>
        </div>

        {/* Area chart */}
        <div className="flex justify-center">
          <TrendAreaChart
            data={trend}
            width={260}
            height={64}
            color={isPositive ? 'var(--success)' : 'var(--destructive)'}
          />
        </div>
      </div>
    </WidgetContainer>
  );
}
