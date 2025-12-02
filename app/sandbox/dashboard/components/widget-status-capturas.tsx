'use client';

import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { MiniDonutChart } from './mini-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CapturaMock, StatusCapturas } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetStatusCapturasProps {
  data: StatusCapturas;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  sucesso: { icon: CheckCircle, color: '#22c55e', label: 'Sucesso' },
  erro: { icon: XCircle, color: '#ef4444', label: 'Erro' },
  em_andamento: { icon: Loader2, color: '#3b82f6', label: 'Em andamento' },
  cancelado: { icon: XCircle, color: '#6b7280', label: 'Cancelado' },
};

const tipoLabels: Record<string, string> = {
  acervo_geral: 'Acervo Geral',
  arquivados: 'Arquivados',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  timeline: 'Timeline',
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function CapturaItem({ captura }: { captura: CapturaMock }) {
  const config = statusConfig[captura.status];
  const Icon = config.icon;
  const isRunning = captura.status === 'em_andamento';

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div
        className={cn('rounded-full p-1.5 shrink-0', isRunning && 'animate-pulse')}
        style={{ backgroundColor: `${config.color}15` }}
      >
        <Icon
          className={cn('h-3.5 w-3.5', isRunning && 'animate-spin')}
          style={{ color: config.color }}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {tipoLabels[captura.tipo] || captura.tipo}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(captura.inicio)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{captura.advogado}</span>
          <span>•</span>
          <span>TRT{captura.trt}</span>
          <span>•</span>
          <span>{captura.grau}</span>
        </div>

        {captura.status === 'sucesso' && captura.processosCapturados && (
          <p className="text-xs text-emerald-600">
            {captura.processosCapturados} processos capturados
          </p>
        )}

        {captura.status === 'erro' && captura.erro && (
          <p className="text-xs text-red-600 truncate">{captura.erro}</p>
        )}
      </div>
    </div>
  );
}

export function WidgetStatusCapturas({
  data,
  loading,
  error,
  className,
  onRemove,
}: WidgetStatusCapturasProps) {
  const isEmpty = data.ultimasCapturas.length === 0;

  const donutData = data.porStatus.map((s) => ({
    name: s.status,
    value: s.count,
    color: s.color,
  }));

  return (
    <WidgetWrapper
      title="Status das Capturas"
      icon={Database}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
      actions={
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      }
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={Database}
          title="Nenhuma captura recente"
          description="Não há registros de capturas nas últimas 24 horas"
        />
      ) : (
        <div className="space-y-4">
          {/* Resumo com donut */}
          <div className="flex items-center gap-4">
            <div className="w-20">
              <MiniDonutChart
                data={donutData}
                height={80}
                thickness={30}
                centerContent={
                  <div className="text-center">
                    <span className="text-lg font-bold">
                      {Math.round(data.taxaSucesso)}%
                    </span>
                  </div>
                }
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Taxa de Sucesso</p>
              <div className="flex flex-wrap gap-2">
                {data.porStatus.map((status) => (
                  <div key={status.status} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-muted-foreground">
                      {status.status}: {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de capturas */}
          <div className="space-y-1 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Últimas capturas</p>
            {data.ultimasCapturas.slice(0, 5).map((captura) => (
              <CapturaItem key={captura.id} captura={captura} />
            ))}
          </div>

          {/* Por tipo */}
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Por tipo</p>
            <div className="flex flex-wrap gap-2">
              {data.porTipo.map((tipo) => (
                <Badge
                  key={tipo.tipo}
                  variant="soft"
                  tone="neutral"
                  className="text-xs"
                >
                  {tipo.tipo}: {tipo.count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
