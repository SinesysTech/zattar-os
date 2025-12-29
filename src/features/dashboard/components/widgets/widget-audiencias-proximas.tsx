'use client';

import Link from 'next/link';
import { Calendar, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import type { AudienciaProxima } from '../../domain';

interface WidgetAudienciasProximasProps {
  data: AudienciaProxima[];
  loading?: boolean;
  error?: string;
}

function formatAudienciaDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Hoje';
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Amanhã';
  }
  return formatDate(dateStr);
}

export function WidgetAudienciasProximas({
  data,
  loading,
  error,
}: WidgetAudienciasProximasProps) {
  if (loading) {
    return (
      <WidgetWrapper title="Próximas Audiências" icon={Calendar} loading={true}>
        <div />
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="Próximas Audiências" icon={Calendar} error={error}>
        <div />
      </WidgetWrapper>
    );
  }

  if (data.length === 0) {
    return (
      <WidgetWrapper title="Próximas Audiências" icon={Calendar}>
        <WidgetEmpty
          icon={Calendar}
          title="Nenhuma audiência agendada"
          description="Não há audiências próximas no momento"
        />
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper title="Próximas Audiências" icon={Calendar}>
      <div className="space-y-3">
        {data.slice(0, 5).map((audiencia) => {
          const isToday = formatAudienciaDate(audiencia.data_audiencia) === 'Hoje';
          const isTomorrow = formatAudienciaDate(audiencia.data_audiencia) === 'Amanhã';

          return (
            <div
              key={audiencia.id}
              className={`p-3 rounded-lg border ${
                isToday ? 'bg-primary/5 border-primary/20' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{audiencia.numero_processo}</p>
                    {isToday && (
                      <Badge variant="destructive" className="text-xs">
                        Hoje
                      </Badge>
                    )}
                    {isTomorrow && (
                      <Badge variant="outline" className="text-xs">
                        Amanhã
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatAudienciaDate(audiencia.data_audiencia)}</span>
                    {audiencia.hora_audiencia && (
                      <>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{audiencia.hora_audiencia.substring(0, 5)}</span>
                      </>
                    )}
                  </div>
                  {audiencia.tipo_audiencia && (
                    <p className="text-xs text-muted-foreground">{audiencia.tipo_audiencia}</p>
                  )}
                  {audiencia.sala && (
                    <p className="text-xs text-muted-foreground">Sala: {audiencia.sala}</p>
                  )}
                </div>
                {audiencia.url_audiencia_virtual && (
                  <a
                    href={audiencia.url_audiencia_virtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir link da audiência virtual em nova aba"
                    title="Abrir audiência virtual"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        <Link href="/audiencias">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            Ver todas as audiências
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </WidgetWrapper>
  );
}

