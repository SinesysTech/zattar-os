/**
 * ProcessoStatusBadge - Badge semântico para status de processo
 *
 * Exibe o status do processo com cores semânticas baseadas no design system.
 * Segue o padrão de AudienciaStatusBadge.
 */

import { Badge } from '@/components/ui/badge';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { StatusProcesso, STATUS_PROCESSO_LABELS } from '../domain';

interface ProcessoStatusBadgeProps {
  status: StatusProcesso;
  className?: string;
}

export function ProcessoStatusBadge({ status, className }: ProcessoStatusBadgeProps) {
  return (
    <Badge
      variant={getSemanticBadgeVariant('status', status)}
      className={className}
    >
      {STATUS_PROCESSO_LABELS[status]}
    </Badge>
  );
}
