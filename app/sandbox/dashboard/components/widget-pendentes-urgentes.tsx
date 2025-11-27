'use client';

import { AlertCircle, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { ProgressBarChart } from './mini-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PendenteMock, PendentesResumo } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetPendentesUrgentesProps {
  pendentes: PendenteMock[];
  resumo: PendentesResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

function getUrgenciaConfig(diasRestantes: number) {
  if (diasRestantes < 0) {
    return {
      label: 'Vencido',
      color: '#ef4444',
      icon: AlertCircle,
      tone: 'danger' as const,
      bgClass: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
    };
  }
  if (diasRestantes === 0) {
    return {
      label: 'Hoje',
      color: '#f97316',
      icon: AlertTriangle,
      tone: 'warning' as const,
      bgClass: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
    };
  }
  if (diasRestantes === 1) {
    return {
      label: 'Amanhã',
      color: '#eab308',
      icon: Clock,
      tone: 'warning' as const,
      bgClass: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900',
    };
  }
  return {
    label: `${diasRestantes} dias`,
    color: '#22c55e',
    icon: CheckCircle,
    tone: 'success' as const,
    bgClass: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  };
}

function PendenteItem({ pendente }: { pendente: PendenteMock }) {
  const config = getUrgenciaConfig(pendente.dias_restantes);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        config.bgClass
      )}
    >
      <div
        className="rounded-full p-1.5 shrink-0"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="solid"
            className="text-xs font-medium"
            style={{ backgroundColor: config.color }}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            TRT{pendente.trt}
          </span>
        </div>

        <p className="text-sm font-medium truncate">{pendente.tipo_expediente}</p>

        <p className="text-xs text-muted-foreground truncate">
          {pendente.numero_processo}
        </p>

        <p className="text-xs truncate">
          <span className="text-muted-foreground">vs</span>{' '}
          <span>{pendente.polo_passivo}</span>
        </p>
      </div>
    </div>
  );
}

export function WidgetPendentesUrgentes({
  pendentes,
  resumo,
  loading,
  error,
  className,
  onRemove,
}: WidgetPendentesUrgentesProps) {
  const isEmpty = pendentes.length === 0;

  // Ordenar por urgência (vencidos primeiro, depois por dias restantes)
  const urgentes = [...pendentes]
    .sort((a, b) => a.dias_restantes - b.dias_restantes)
    .slice(0, 4);

  const progressData = resumo.porUrgencia.map((item) => ({
    name: item.urgencia,
    value: item.count,
    color: item.color,
  }));

  return (
    <WidgetWrapper
      title="Pendentes de Manifestação"
      icon={AlertCircle}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
      actions={
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link href="/expedientes">Ver todos</Link>
        </Button>
      }
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={CheckCircle}
          title="Tudo em dia!"
          description="Você não possui pendentes de manifestação"
        />
      ) : (
        <div className="space-y-4">
          {/* Stats e barra de progresso */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{resumo.total}</span>
                <span className="text-sm text-muted-foreground">pendentes</span>
              </div>
              {resumo.vencidos > 0 && (
                <Badge variant="solid" tone="danger" className="text-xs">
                  {resumo.vencidos} vencido{resumo.vencidos > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <ProgressBarChart data={progressData} height={6} showLabels />
          </div>

          {/* Lista de pendentes urgentes */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Mais urgentes</p>
            {urgentes.map((pendente) => (
              <PendenteItem key={pendente.id} pendente={pendente} />
            ))}
          </div>

          {/* Link para ver mais */}
          {pendentes.length > 4 && (
            <div className="pt-2 border-t">
              <Link
                href="/expedientes"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver mais {pendentes.length - 4} pendentes
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
