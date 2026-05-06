'use client';

import { cn } from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniDonutChart, CHART_PALETTE } from '@/components/ui/charts/mini-chart';
import { Text } from '@/components/ui/typography';

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
        <CardHeader className={cn("pb-2")}>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className={cn("flex flex-col items-center inline-default")}>
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className={cn("stack-tight w-full")}>
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
      <CardHeader className={cn("pb-2")}>
        <CardTitle className={cn( "flex items-center inline-tight text-body-sm font-medium")}>
          <PieIcon className="h-4 w-4 text-muted-foreground" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex-1 flex flex-col inline-default")}>
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className={cn("text-body-sm text-muted-foreground")}>Sem dados disponíveis</p>
          </div>
        ) : (
          <>
            <MiniDonutChart
              data={chartData}
              height={160}
              thickness={18}
              centerContent={
                <div className="text-center">
                  <Text variant="caption">Total</Text>
                  <p className={cn( "text-body-sm font-bold font-heading")}>{formatarMoeda(total)}</p>
                </div>
              }
            />
            <div className={cn("stack-snug flex-1")}>
              {chartData.map((item, idx) => {
                const percentual = data[idx].percentual ?? (total > 0 ? (item.value / total) * 100 : 0);
                return (
                  <div
                    key={item.name}
                    className={cn("flex items-center justify-between inline-tight rounded-md px-2.5 py-1.5 text-body-sm hover:bg-muted/50 transition-colors")}
                  >
                    <div className={cn("flex items-center inline-tight min-w-0 flex-1")}>
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                    </div>
                    <div className={cn("flex items-center inline-medium shrink-0")}>
                      <Text variant="caption" className="tabular-nums">
                        {formatarPercentual(percentual)}
                      </Text>
                      <span className={cn( "font-medium tabular-nums")}>{formatarMoeda(item.value)}</span>
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
