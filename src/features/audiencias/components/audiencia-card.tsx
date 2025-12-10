'use client';

import type { Audiencia } from '@/core/audiencias/domain';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';

interface AudienciaCardProps {
  audiencia: Audiencia;
  compact?: boolean;
  onClick?: (audienciaId: number) => void;
}

export function AudienciaCard({ audiencia, compact = false, onClick }: AudienciaCardProps) {
  const dataInicio = new Date(audiencia.dataInicio);
  const dataFim = new Date(audiencia.dataFim);

  const handleCardClick = () => {
    if (onClick) {
      onClick(audiencia.id);
    }
  };

  return (
    <Card
      className={cn(
        'group relative z-10 my-0.5 w-full cursor-pointer overflow-hidden rounded-md border',
        'transition-all duration-200 ease-in-out hover:shadow-lg',
        compact ? 'h-auto py-1' : 'py-2'
      )}
      onClick={handleCardClick}
    >
      <CardContent className={cn('flex flex-col gap-1', compact ? 'p-2 text-xs' : 'p-3 text-sm')}>
        <div className="flex items-center justify-between">
          <span className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')}>
            {format(dataInicio, 'HH:mm', { locale: ptBR })} -{' '}
            {format(dataFim, 'HH:mm', { locale: ptBR })}
          </span>
          <AudienciaStatusBadge status={audiencia.status} />
        </div>
        <div className={cn('font-medium', compact ? 'text-xs truncate' : 'text-sm')}>
          {audiencia.numeroProcesso}
        </div>
        <div className="flex items-center gap-2">
          {audiencia.tipoDescricao && (
            <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
              {audiencia.tipoDescricao}
            </span>
          )}
          {audiencia.modalidade && (
            <AudienciaModalidadeBadge modalidade={audiencia.modalidade} compact={compact} />
          )}
        </div>
        {!compact && audiencia.observacoes && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{audiencia.observacoes}</p>
        )}
      </CardContent>
    </Card>
  );
}
