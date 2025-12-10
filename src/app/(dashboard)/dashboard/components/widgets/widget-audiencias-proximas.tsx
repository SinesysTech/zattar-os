'use client';

import { Calendar, Video, MapPin, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WidgetWrapper, WidgetEmpty } from './widget-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AudienciaProxima, AudienciasResumo } from '@/backend/types/dashboard/types';
import { cn } from '@/app/_lib/utils/utils';

interface WidgetAudienciasProximasProps {
  audiencias: AudienciaProxima[];
  resumo?: AudienciasResumo;
  loading?: boolean;
  error?: string;
  className?: string;
  onRemove?: () => void;
}

function formatDate(dateStr: string): string {
  // Se a string já contém 'T', extrair apenas a parte da data
  const dateOnlyStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const date = new Date(dateOnlyStr + 'T00:00:00');
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

function AudienciaItem({ audiencia }: { audiencia: AudienciaProxima }) {
  const isVirtual = !!audiencia.url_audiencia_virtual;
  const Icon = isVirtual ? Video : MapPin;
  const color = isVirtual ? '#3b82f6' : '#22c55e';
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
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
            {formatDate(audiencia.data_audiencia)}
          </span>
          {audiencia.hora_audiencia && (
            <span className="text-sm text-muted-foreground">
              {audiencia.hora_audiencia}
            </span>
          )}
          {audiencia.tipo_audiencia && (
            <Badge variant="soft" tone="neutral" className="text-xs">
              {audiencia.tipo_audiencia}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {audiencia.numero_processo}
          {(audiencia.polo_ativo_nome || audiencia.polo_passivo_nome) && (
            <span className="ml-1 text-foreground/70">
              - {audiencia.polo_ativo_nome || '?'} x {audiencia.polo_passivo_nome || '?'}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Badge
            variant="soft"
            className="text-xs"
            style={{
              backgroundColor: `${color}15`,
              color: color,
              borderColor: `${color}30`
            }}
          >
            {isVirtual ? 'Virtual' : 'Presencial'}
          </Badge>
          {audiencia.sala && (
            <span className="text-xs text-muted-foreground">{audiencia.sala}</span>
          )}
          {audiencia.local && !audiencia.sala && (
            <span className="text-xs text-muted-foreground truncate">{audiencia.local}</span>
          )}

          {audiencia.url_audiencia_virtual && (
            <a
              href={audiencia.url_audiencia_virtual}
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

        {audiencia.responsavel_nome && (
          <p className="text-xs text-muted-foreground">
            Resp: <span className="font-medium">{audiencia.responsavel_nome}</span>
          </p>
        )}
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
          {resumo && (
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
          )}

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
