import { StatusAudiencia, STATUS_AUDIENCIA_LABELS } from '../domain';
import { cn } from '@/lib/utils';
import { IconCircle } from '@/components/ui/icon-circle';
import { Check } from 'lucide-react';
import { SemanticBadge } from '@/components/ui/semantic-badge';

/**
 * AudienciaStatusBadge - Badge para exibir status de audiência.
 *
 * @ai-context Este componente usa o sistema de variantes semânticas.
 * A cor é determinada automaticamente pelo mapeamento em @/lib/design-system/variants.ts.
 *
 * @example
 * <AudienciaStatusBadge status={StatusAudiencia.Marcada} />
 * <AudienciaStatusBadge status={StatusAudiencia.Finalizada} />
 */
interface AudienciaStatusBadgeProps {
  status: StatusAudiencia;
  className?: string;
  compact?: boolean;
}

export function AudienciaStatusBadge({ status, className, compact = false }: AudienciaStatusBadgeProps) {
  if (compact && status === StatusAudiencia.Finalizada) {
    return (
      <IconCircle
        icon={Check}
        size="sm"
        className={cn(
          'border-success/15 bg-success/5 text-success',
          className
        )}
        aria-label={STATUS_AUDIENCIA_LABELS[status]}
        title={STATUS_AUDIENCIA_LABELS[status]}
      />
    );
  }

  return (
    <SemanticBadge category="audiencia_status" value={status} className={cn('text-xs font-medium', className)}>
      {STATUS_AUDIENCIA_LABELS[status]}
    </SemanticBadge>
  );
}
