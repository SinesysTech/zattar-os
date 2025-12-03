'use client';

import { Calendar, Video, MapPin, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudienciaMock, AudienciasResumo } from '../types/dashboard.types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetAudienciasProximasProps {
  audiencias: AudienciaMock[];
  resumo: AudienciasResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

const modalidadeConfig: Record<string, { icon: typeof Video; color: string; label: string }> = {
  VIDEOCONFERENCIA: { icon: Video, color: '#3b82f6', label: 'Virtual' },
  TELEPRESENCIAL: { icon: Video, color: '#8b5cf6', label: 'Telepresencial' },
  PRESENCIAL: { icon: MapPin, color: '#22c55e', label: 'Presencial' },
  HIBRIDA: { icon: Video, color: '#f59e0b', label: 'Híbrida' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
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

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function AudienciaItem({ audiencia }: { audiencia: AudienciaMock }) {
  const config = modalidadeConfig[audiencia.modalidade] || modalidadeConfig.PRESENCIAL;
  const Icon = config.icon;
  const isToday = formatDate(audiencia.data_audiencia) === 'Hoje';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/50',
        isToday && 'border-primary/50 bg-primary/5'
      )}
    >
      <div
        className="rounded-md p-2 shrink-0"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
            {formatDate(audiencia.data_audiencia)}
          </span>
          <span className="text-sm text-muted-foreground">
            {audiencia.hora_audiencia}
          </span>
          <Badge variant="soft" tone="neutral" className="text-xs">
            {audiencia.tipo_audiencia}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {audiencia.numero_processo}
        </p>

        <div className="flex items-center gap-2">
          <p className="text-xs truncate">
            <span className="text-muted-foreground">vs</span>{' '}
            <span className="font-medium">{audiencia.polo_passivo}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Badge
            variant="soft"
            className="text-xs"
            style={{
              backgroundColor: `${config.color}15`,
              color: config.color,
              borderColor: `${config.color}30`
            }}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{audiencia.sala}</span>

          {audiencia.url_virtual && (
            <a
              href={audiencia.url_virtual}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-primary hover:text-primary/80"
              aria-label="Acessar audiência virtual"
              title="Acessar audiência virtual"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function WidgetAudienciasProximas({
  audiencias,
  resumo,
  loading,
  error,
  className,
  onRemove,
}: WidgetAudienciasProximasProps) {
  const isEmpty = audiencias.length === 0;
  const proximas = audiencias.slice(0, 4);

  return (
    <WidgetWrapper
      title="Próximas Audiências"
      icon={Calendar}
      loading={loading}
      error={error}
      className={className}
      onRemove={onRemove}
      actions={
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link href="/audiencias">Ver todas</Link>
        </Button>
      }
    >
      {isEmpty ? (
        <WidgetEmpty
          icon={Calendar}
          title="Nenhuma audiência agendada"
          description="Você não possui audiências nos próximos dias"
        />
      ) : (
        <div className="space-y-3">
          {/* Stats rápidos */}
          <div className="flex gap-4 pb-3 border-b">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{resumo.hoje}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{resumo.proximos7dias}</p>
              <p className="text-xs text-muted-foreground">7 dias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{resumo.proximos30dias}</p>
              <p className="text-xs text-muted-foreground">30 dias</p>
            </div>
          </div>

          {/* Lista de audiências */}
          <div className="space-y-2">
            {proximas.map((audiencia) => (
              <AudienciaItem key={audiencia.id} audiencia={audiencia} />
            ))}
          </div>

          {/* Link para ver mais */}
          {audiencias.length > 4 && (
            <div className="pt-2 border-t">
              <Link
                href="/audiencias"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver mais {audiencias.length - 4} audiências
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
