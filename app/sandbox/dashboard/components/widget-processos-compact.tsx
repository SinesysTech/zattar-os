'use client';

import { Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { MiniDonutChart, CHART_COLORS } from './mini-chart';
import { Badge } from '@/components/ui/badge';
import { ProcessoResumo } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetProcessosCompactProps {
  data: ProcessoResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

export function WidgetProcessosCompact({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetProcessosCompactProps) {
  const isEmpty = data.total === 0;

  const donutData = [
    { name: 'Ativos', value: data.ativos, color: CHART_COLORS.success },
    { name: 'Arquivados', value: data.arquivados, color: '#94a3b8' },
  ];

  // Top TRTs
  const topTRTs = data.porTRT
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <WidgetWrapper
      title="Distribuição de Processos"
      icon={Scale}
      loading={loading}
      error={error}
      className={cn('', className)}
      onRemove={onRemove}
      contentClassName="pt-0"
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={Scale}
          title="Nenhum processo atribuído"
          description="Você ainda não possui processos"
        />
      ) : (
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="w-20 shrink-0">
            <MiniDonutChart
              data={donutData}
              height={80}
              thickness={25}
              centerContent={
                <div className="text-center">
                  <span className="text-sm font-bold">{Math.round((data.ativos / data.total) * 100)}%</span>
                </div>
              }
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Legenda */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Ativos:</span>
                <span className="font-semibold">{data.ativos}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-muted-foreground">Arquiv.:</span>
                <span className="font-semibold">{data.arquivados}</span>
              </div>
            </div>

            {/* Por Grau */}
            <div className="flex gap-2">
              {data.porGrau.map((item) => (
                <Badge
                  key={item.grau}
                  variant="soft"
                  tone={item.grau === '1º Grau' ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {item.grau}: {item.count}
                </Badge>
              ))}
            </div>

            {/* Por TRT */}
            {topTRTs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topTRTs.map((item, index) => (
                  <span
                    key={item.trt}
                    className="text-xs text-muted-foreground"
                  >
                    TRT{item.trt}: {item.count}
                    {index < topTRTs.length - 1 && ' •'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Link */}
          <Link
            href="/processos"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </WidgetWrapper>
  );
}
