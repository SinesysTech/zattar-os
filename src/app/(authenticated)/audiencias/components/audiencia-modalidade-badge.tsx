import { ModalidadeAudiencia, MODALIDADE_AUDIENCIA_LABELS } from '../domain';
import { IconCircle } from '@/components/ui/icon-circle';
import { cn } from '@/lib/utils';
import { Video, MapPin, GitCompareArrows } from 'lucide-react';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { SemanticBadge } from '@/components/ui/semantic-badge';

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

const VARIANT_TO_CIRCLE_CLASS: Record<string, string> = {
  info: 'border-info/15 bg-info/5 text-info',
  success: 'border-success/15 bg-success/5 text-success',
  warning: 'border-warning/15 bg-warning/5 text-warning',
  destructive: 'border-destructive/15 bg-destructive/5 text-destructive',
  neutral: 'border-muted bg-muted text-muted-foreground',
  accent: 'border-warning/15 bg-warning/5 text-warning',
  default: 'border-border bg-background text-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-background text-foreground',
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

  if (compact) {
    if (!Icon) return null;

    return (
      <IconCircle
        icon={Icon}
        size="sm"
        className={cn(VARIANT_TO_CIRCLE_CLASS[variant] ?? VARIANT_TO_CIRCLE_CLASS.neutral, className)}
        aria-label={MODALIDADE_AUDIENCIA_LABELS[modalidade]}
        title={MODALIDADE_AUDIENCIA_LABELS[modalidade]}
      />
    );
  }

  return (
    <SemanticBadge category="audiencia_modalidade" value={modalidade} className={cn('flex items-center gap-1', className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {MODALIDADE_AUDIENCIA_LABELS[modalidade]}
    </SemanticBadge>
  );
}
