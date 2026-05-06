import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Stack, Inline } from '@/components/ui/stack';
import { Text } from '@/components/ui/typography';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';

interface AudienciaCardProps {
  audiencia: Audiencia;
  compact?: boolean;
  onClick?: (audienciaId: number) => void;
}

export function AudienciaCard({ audiencia, compact = false, onClick }: AudienciaCardProps) {
  const dataInicio = parseISO(audiencia.dataInicio);
  const dataFim = parseISO(audiencia.dataFim);

  // Verifica se tem ata disponível
  const isRealizada = audiencia.status === StatusAudiencia.Finalizada;
  const hasAta = isRealizada && (audiencia.ataAudienciaId || audiencia.urlAtaAudiencia);

  const handleCardClick = () => {
    if (onClick) {
      onClick(audiencia.id);
    }
  };

  return (
    <div onClick={handleCardClick} className={cn('cursor-pointer', compact ? 'my-0.5' : 'my-0.5')}>
      <GlassPanel depth={1} className={cn(
        'group relative z-10 w-full overflow-hidden rounded-md',
        'transition-all duration-200 ease-in-out hover:shadow-lg',
        compact ? 'h-auto' : '',
      )}>
        <Stack gap="tight" className={cn(compact ? /* design-system-escape: p-2 → usar <Inset> */ 'inset-tight' : /* design-system-escape: p-3 → usar <Inset> */ 'inset-medium')}>
        <Inline justify="between">
          <Inline gap="tight">
            {/* Indicador de Ata */}
            {hasAta && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-success/15 text-success">
                    <FileText className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Ata disponível</TooltipContent>
              </Tooltip>
            )}
            <Text variant={compact ? 'micro-caption' : 'caption'} className={cn( "font-semibold")}>
              {format(dataInicio, 'HH:mm', { locale: ptBR })} - {format(dataFim, 'HH:mm', { locale: ptBR })}
            </Text>
          </Inline>
          <AudienciaStatusBadge status={audiencia.status} compact={compact} />
        </Inline>
        
        <Text variant={compact ? 'micro-caption' : 'caption'} className={cn( 'font-medium', compact && 'truncate')}>
          {audiencia.numeroProcesso}
        </Text>

        <Inline gap="tight">
          {audiencia.tipoDescricao && (
            <Text variant={compact ? 'micro-caption' : 'caption'} className="text-muted-foreground">
              {audiencia.tipoDescricao}
            </Text>
          )}
          {audiencia.modalidade && <AudienciaModalidadeBadge modalidade={audiencia.modalidade} compact={compact} />}
        </Inline>

        {!compact && audiencia.observacoes && (
          <Text variant="micro-caption" className="text-muted-foreground line-clamp-2">
            {audiencia.observacoes}
          </Text>
        )}
        </Stack>
      </GlassPanel>
    </div>
  );
}
