'use client';

import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { WidgetWrapper } from './widget-wrapper';
import { Badge } from '@/components/ui/badge';
import type { ProdutividadeResumo } from '../../domain';

interface WidgetProdutividadeProps {
  data: ProdutividadeResumo;
  loading?: boolean;
  error?: string;
}

function getTrendIcon(direction: 'up' | 'down' | 'neutral') {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-3 w-3" />;
    case 'down':
      return <TrendingDown className="h-3 w-3" />;
    default:
      return <Minus className="h-3 w-3" />;
  }
}


export function WidgetProdutividade({
  data,
  loading,
  error,
}: WidgetProdutividadeProps) {
  if (loading) {
    return (
      <WidgetWrapper title="Produtividade" icon={BarChart3} loading={true}>
        <div />
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="Produtividade" icon={BarChart3} error={error}>
        <div />
      </WidgetWrapper>
    );
  }

  const trendDirection: 'up' | 'down' | 'neutral' =
    data.comparativoSemanaAnterior > 0
      ? 'up'
      : data.comparativoSemanaAnterior < 0
        ? 'down'
        : 'neutral';

  const maxBaixas = Math.max(...data.porDia.map((d) => d.baixas), 1);

  return (
    <WidgetWrapper title="Produtividade" icon={BarChart3}>
      <div className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{data.baixasHoje}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{data.baixasSemana}</p>
            <p className="text-xs text-muted-foreground">Esta Semana</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{data.baixasMes}</p>
            <p className="text-xs text-muted-foreground">Este Mês</p>
          </div>
        </div>

        {/* Comparativo */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {getTrendIcon(trendDirection)}
            <span className="text-sm font-medium">Comparativo Semana Anterior</span>
          </div>
          <Badge
            variant={trendDirection === 'up' ? 'success' : trendDirection === 'down' ? 'destructive' : 'outline'}
            className="text-xs"
          >
            {data.comparativoSemanaAnterior > 0 ? '+' : ''}
            {data.comparativoSemanaAnterior}%
          </Badge>
        </div>

        {/* Média diária */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Média Diária (Mês)</span>
            <span className="font-medium">{data.mediaDiaria.toFixed(1)}</span>
          </div>
        </div>

        {/* Gráfico de barras simples - últimos 7 dias */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Últimos 7 Dias</p>
          <div className="space-y-1.5">
            {data.porDia.map((dia) => {
              const percent = (dia.baixas / maxBaixas) * 100;
              const date = new Date(dia.data);
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
              const dayNumber = date.getDate();

              return (
                <div key={dia.data} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {dayName}, {dayNumber}
                    </span>
                    <span className="font-medium">{dia.baixas}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}

