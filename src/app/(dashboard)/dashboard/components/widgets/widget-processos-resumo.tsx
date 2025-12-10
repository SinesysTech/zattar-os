'use client';

import { Scale } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { MiniDonutChart, CHART_COLORS, CHART_PALETTE } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProcessoResumo } from '@/backend/types/dashboard/types';

interface WidgetProcessosResumoProps {
  data: ProcessoResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

export function WidgetProcessosResumo({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetProcessosResumoProps) {
  const isEmpty = data.total === 0;

  const donutData = [
    { name: 'Ativos', value: data.ativos, color: CHART_COLORS.success },
    { name: 'Arquivados', value: data.arquivados, color: CHART_COLORS.muted },
  ];

  // Top TRTs
  const topTRTs = [...data.porTRT]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const percentualAtivos = data.total > 0 ? Math.round((data.ativos / data.total) * 100) : 0;

  return (
    <WidgetWrapper
      title="Meus Processos"
      icon={Scale}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
      actions={
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link href="/processos">Ver todos</Link>
        </Button>
      }
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={Scale}
          title="Nenhum processo atribuído"
          description="Você ainda não possui processos sob sua responsabilidade"
        />
      ) : (
        <div className="space-y-4">
          {/* Números principais */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{data.total}</span>
                <span className="text-sm text-muted-foreground">processos</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-muted-foreground">
                    {data.ativos} ativos
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {data.arquivados} arquivados
                  </span>
                </div>
              </div>
            </div>
            <div className="w-24">
              <MiniDonutChart
                data={donutData}
                height={80}
                thickness={25}
                centerContent={
                  <div className="text-center">
                    <span className="text-lg font-bold">{percentualAtivos}%</span>
                  </div>
                }
              />
            </div>
          </div>

          {/* Distribuição por TRT */}
          {topTRTs.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Por Tribunal</p>
              <div className="flex flex-wrap gap-2">
                {topTRTs.map((item, index) => (
                  <Badge
                    key={item.trt}
                    variant="soft"
                    tone="neutral"
                    className="text-xs"
                    style={{
                      borderColor: CHART_PALETTE[index % CHART_PALETTE.length],
                      color: CHART_PALETTE[index % CHART_PALETTE.length],
                    }}
                  >
                    TRT{item.trt}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Distribuição por Grau */}
          {data.porGrau.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Por Grau</p>
              <div className="flex gap-4">
                {data.porGrau.map((item) => (
                  <div key={item.grau} className="flex items-center gap-2">
                    <Badge
                      variant="soft"
                      tone={item.grau === '1º Grau' || item.grau === 'primeiro_grau' ? 'success' : 'warning'}
                      className="text-xs"
                    >
                      {item.grau === 'primeiro_grau' ? '1º Grau' : item.grau === 'segundo_grau' ? '2º Grau' : item.grau}
                    </Badge>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
