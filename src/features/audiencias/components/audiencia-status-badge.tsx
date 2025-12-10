'use client';

import { StatusAudiencia, STATUS_AUDIENCIA_LABELS } from '@/core/audiencias/domain';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AudienciaStatusBadgeProps {
  status: StatusAudiencia;
  className?: string;
}

export function AudienciaStatusBadge({ status, className }: AudienciaStatusBadgeProps) {
  let colorClass = '';

  switch (status) {
    case StatusAudiencia.Marcada:
      colorClass =
        'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800';
      break;
    case StatusAudiencia.Finalizada:
      colorClass =
        'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800';
      break;
    case StatusAudiencia.Cancelada:
      colorClass =
        'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800';
      break;
    default:
      break;
  }

  return (
    <Badge className={cn('text-xs font-medium', colorClass, className)}>
      {STATUS_AUDIENCIA_LABELS[status]}
    </Badge>
  );
}
