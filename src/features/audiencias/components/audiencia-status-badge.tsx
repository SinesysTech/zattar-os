import { StatusAudiencia, STATUS_AUDIENCIA_LABELS } from '@/features/audiencias';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSemanticBadgeVariant } from '@/lib/design-system';

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
}

export function AudienciaStatusBadge({ status, className }: AudienciaStatusBadgeProps) {
  const variant = getSemanticBadgeVariant('audiencia_status', status);

  return (
    <Badge variant={variant} className={cn('text-xs font-medium', className)}>
      {STATUS_AUDIENCIA_LABELS[status]}
    </Badge>
  );
}
