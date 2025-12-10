'use client';

import { AlertCircle, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { ProgressBarChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ExpedienteUrgente, ExpedientesResumo } from '@/backend/types/dashboard/types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetExpedientesUrgentesProps {
  expedientes: ExpedienteUrgente[];
  resumo?: ExpedientesResumo;
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

function ExpedienteItem({ expediente }: { expediente: ExpedienteUrgente }) {
  const config = getUrgenciaConfig(expediente.dias_restantes);
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
            {expediente.origem === 'expedientes_manuais' ? 'Manual' : 'PJE'}
          </span>
        </div>

        <p className="text-sm font-medium truncate">{expediente.tipo_expediente}</p>

        <p className="text-xs text-muted-foreground truncate">
          {expediente.numero_processo}
        </p>
      </div>
    </div>
  );
}

export function WidgetExpedientesUrgentes({
  expedientes,
  resumo,
  loading,
  error,
  className,
  onRemove,
}: WidgetExpedientesUrgentesProps) {
  const isEmpty = expedientes.length === 0;

  // Ordenar por urgência (vencidos primeiro, depois por dias restantes)
  const urgentes = [...expedientes]
    .sort((a, b) => a.dias_restantes - b.dias_restantes)
    .slice(0, 4);

  // Preparar dados da barra de progresso
  const progressData = resumo
    ? [
        { name: 'Vencidos', value: resumo.vencidos, color: '#ef4444' },
        { name: 'Hoje', value: resumo.venceHoje, color: '#f97316' },
        { name: 'Amanhã', value: resumo.venceAmanha, color: '#eab308' },
        { name: '7 dias', value: resumo.proximos7dias, color: '#22c55e' },
      ].filter(item => item.value > 0)
    : [];

  return (
    <WidgetWrapper
      title="Expedientes Urgentes"
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
          description="Você não possui expedientes urgentes"
        />
      ) : (
        <div className="space-y-4">
          {/* Stats e barra de progresso */}
          {resumo && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{resumo.total}</span>
                  <span className="text-sm text-muted-foreground">expedientes</span>
                </div>
                {resumo.vencidos > 0 && (
                  <Badge variant="solid" tone="danger" className="text-xs">
                    {resumo.vencidos} vencido{resumo.vencidos > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {progressData.length > 0 && (
                <ProgressBarChart data={progressData} height={6} showLabels />
              )}
            </div>
          )}

          {/* Lista de expedientes urgentes */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Mais urgentes</p>
            {urgentes.map((expediente) => (
              <ExpedienteItem key={`${expediente.origem}-${expediente.id}`} expediente={expediente} />
            ))}
          </div>

          {/* Link para ver mais */}
          {expedientes.length > 4 && (
            <div className="pt-2 border-t">
              <Link
                href="/expedientes"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver mais {expedientes.length - 4} expedientes
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
