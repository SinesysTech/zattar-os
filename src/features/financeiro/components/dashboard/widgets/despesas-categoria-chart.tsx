'use client';

import { PieChart as PieIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniDonutChart, CHART_PALETTE } from '@/components/ui/charts/mini-chart';

// ============================================================================
// Helpers
// ============================================================================

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(valor) >= 1_000_000 ? 'compact' : 'standard',
  }).format(valor);

const formatarPercentual = (valor: number): string =>
  `${Math.round(valor)}%`;

// ============================================================================
// Types
// ============================================================================

interface CategoriaValor {
  categoria: string;
  valor: number;
  percentual?: number;
}

interface DespesasCategoriaChartProps {
  data: CategoriaValor[];
  isLoading: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DespesasCategoriaChart({ data, isLoading }: DespesasCategoriaChartProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="space-y-2 w-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((acc, item) => acc + item.valor, 0);

  const chartData = data.map((item, idx) => ({
    name: item.categoria || 'Sem categoria',
    value: item.valor,
    color: CHART_PALETTE[idx % CHART_PALETTE.length],
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieIcon className="h-4 w-4 text-muted-foreground" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        ) : (
          <>
            <MiniDonutChart
              data={chartData}
              height={160}
              thickness={18}
              centerContent={
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-bold font-heading">{formatarMoeda(total)}</p>
                </div>
              }
            />
            <div className="space-y-1.5 flex-1">
              {chartData.map((item, idx) => {
                const percentual = data[idx].percentual ?? (total > 0 ? (item.value / total) * 100 : 0);
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatarPercentual(percentual)}
                      </span>
                      <span className="font-medium tabular-nums">{formatarMoeda(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
