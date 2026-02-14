'use client';

import Link from 'next/link';
import { AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import type { ExpedienteUrgente } from '../../domain';

interface WidgetExpedientesUrgentesProps {
  data: ExpedienteUrgente[];
  loading?: boolean;
  error?: string;
}

function getStatusBadge(expediente: ExpedienteUrgente) {
  if (expediente.dias_restantes < 0) {
    return (
      <Badge variant="destructive" className="text-xs">
        Vencido ({Math.abs(expediente.dias_restantes)} dias)
      </Badge>
    );
  }
  if (expediente.dias_restantes === 0) {
    return (
      <Badge variant="destructive" className="text-xs">
        Vence hoje
      </Badge>
    );
  }
  if (expediente.dias_restantes <= 3) {
    return (
      <Badge variant="warning" className="text-xs">
        {expediente.dias_restantes} dias
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {expediente.dias_restantes} dias
    </Badge>
  );
}

export function WidgetExpedientesUrgentes({
  data,
  loading,
  error,
}: WidgetExpedientesUrgentesProps) {
  if (loading) {
    return (
      <WidgetWrapper title="Expedientes Urgentes" icon={AlertTriangle} loading={true}>
        <div />
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="Expedientes Urgentes" icon={AlertTriangle} error={error}>
        <div />
      </WidgetWrapper>
    );
  }

  if (data.length === 0) {
    return (
      <WidgetWrapper title="Expedientes Urgentes" icon={AlertTriangle}>
        <WidgetEmpty
          icon={AlertTriangle}
          title="Nenhum expediente urgente"
          description="Todos os expedientes estão em dia"
        />
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper title="Expedientes Urgentes" icon={AlertTriangle}>
      <div className="space-y-3">
        {data.slice(0, 5).map((expediente) => {
          const isVencido = expediente.dias_restantes < 0;
          const isUrgente = expediente.dias_restantes <= 3;

          return (
            <div
              key={expediente.id}
              className={`p-3 rounded-lg border ${
                isVencido
                  ? 'bg-destructive/5 border-destructive/20'
                  : isUrgente
                    ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                    : 'bg-card'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{expediente.numero_processo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {expediente.tipo_expediente}
                    </p>
                  </div>
                  {getStatusBadge(expediente)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Prazo: {formatDate(expediente.prazo_fatal)}</span>
                </div>
                {expediente.responsavel_nome && (
                  <p className="text-xs text-muted-foreground">
                    Responsável: {expediente.responsavel_nome}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <Link href="/expedientes">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            Ver todos os expedientes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </WidgetWrapper>
  );
}

