import { ModalidadeAudiencia, MODALIDADE_AUDIENCIA_LABELS } from '@/features/audiencias';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Video, MapPin, GitCompareArrows } from 'lucide-react';
import { getSemanticBadgeVariant } from '@/lib/design-system';

/**
 * AudienciaModalidadeBadge - Badge para exibir modalidade de audiência.
 *
 * @ai-context Este componente usa o sistema de variantes semânticas.
 * A cor é determinada automaticamente pelo mapeamento em @/lib/design-system/variants.ts.
 *
 * @example
 * <AudienciaModalidadeBadge modalidade={ModalidadeAudiencia.Virtual} />
 * <AudienciaModalidadeBadge modalidade={ModalidadeAudiencia.Presencial} compact />
 */
interface AudienciaModalidadeBadgeProps {
  modalidade: ModalidadeAudiencia | null;
  className?: string;
  compact?: boolean;
}

/**
 * Mapeamento de modalidade para ícone.
 * Mantido localmente pois é específico deste componente.
 */
const MODALIDADE_ICONS: Record<ModalidadeAudiencia, React.ElementType | null> = {
  [ModalidadeAudiencia.Virtual]: Video,
  [ModalidadeAudiencia.Presencial]: MapPin,
  [ModalidadeAudiencia.Hibrida]: GitCompareArrows,
};

export function AudienciaModalidadeBadge({
  modalidade,
  className,
  compact = false,
}: AudienciaModalidadeBadgeProps) {
  if (!modalidade) {
    return null;
  }

  const variant = getSemanticBadgeVariant('audiencia_modalidade', modalidade);
  const Icon = MODALIDADE_ICONS[modalidade];

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1',
        compact && 'px-2 py-0.5 text-[0.65rem]',
        className
      )}
    >
      {Icon && <Icon className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />}
      {!compact && MODALIDADE_AUDIENCIA_LABELS[modalidade]}
    </Badge>
  );
}
