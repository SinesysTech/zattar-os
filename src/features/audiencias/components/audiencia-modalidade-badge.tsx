import { Audiencia, ModalidadeAudiencia, MODALIDADE_AUDIENCIA_LABELS } from '@/core/audiencias/domain';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Video, MapPin, GitCompareArrows } from 'lucide-react';

interface AudienciaModalidadeBadgeProps {
  modalidade: ModalidadeAudiencia | null;
  className?: string;
  compact?: boolean;
}

export function AudienciaModalidadeBadge({ modalidade, className, compact = false }: AudienciaModalidadeBadgeProps) {
  if (!modalidade) {
    return null;
  }

  let Icon;
  let colorClass = '';

  switch (modalidade) {
    case ModalidadeAudiencia.Virtual:
      Icon = Video;
      colorClass = 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800';
      break;
    case ModalidadeAudiencia.Presencial:
      Icon = MapPin;
      colorClass = 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:hover:bg-orange-800';
      break;
    case ModalidadeAudiencia.Hibrida:
      Icon = GitCompareArrows;
      colorClass = 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-100 dark:hover:bg-teal-800';
      break;
    default:
      Icon = null;
      break;
  }

  return (
    <Badge className={cn('flex items-center gap-1', colorClass, className, compact && 'px-2 py-0.5 text-[0.65rem]')}>
      {Icon && <Icon className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />}
      {!compact && MODALIDADE_AUDIENCIA_LABELS[modalidade]}
    </Badge>
  );
}
