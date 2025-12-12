'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getSemanticBadgeVariant,
  getParteTipoLabel,
  type BadgeCategory,
  type BadgeVisualVariant,
} from '@/lib/design-system';

/**
 * SemanticBadge - Badge com variante visual determinada semanticamente.
 *
 * Este componente encapsula a lógica de mapeamento de domínio para variante visual,
 * eliminando a necessidade de funções getXXXColorClass() espalhadas pelo código.
 *
 * @ai-context SEMPRE use este componente para badges que representam entidades
 * de domínio (tribunais, status, partes, etc). NUNCA crie classes de cor hardcoded.
 *
 * @example
 * // Badge de tribunal
 * <SemanticBadge category="tribunal" value="TRT1">TRT1</SemanticBadge>
 *
 * // Badge de status de processo
 * <SemanticBadge category="status" value="ATIVO">Ativo</SemanticBadge>
 *
 * // Badge de tipo de parte (com label automático)
 * <SemanticBadge category="parte" value="PERITO" autoLabel />
 *
 * // Badge de audiência
 * <SemanticBadge category="audiencia_status" value="Marcada">Marcada</SemanticBadge>
 */

interface SemanticBadgeProps extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  /**
   * Categoria semântica do badge.
   * Determina qual mapeamento de variantes será usado.
   */
  category: BadgeCategory;

  /**
   * Valor a ser mapeado para uma variante visual.
   * Ex: 'TRT1', 'ATIVO', 'PERITO', 'Marcada'
   */
  value: string | number | null | undefined;

  /**
   * Se true, usa o label amigável automaticamente (apenas para 'parte').
   * Ex: 'PERITO' -> 'Perito'
   */
  autoLabel?: boolean;

  /**
   * Conteúdo customizado do badge.
   * Se não fornecido, usa `value` ou `autoLabel`.
   */
  children?: React.ReactNode;

  /**
   * Override manual da variante visual.
   * Use apenas em casos excepcionais.
   */
  variantOverride?: BadgeVisualVariant;
}

export function SemanticBadge({
  category,
  value,
  autoLabel = false,
  children,
  variantOverride,
  className,
  ...props
}: SemanticBadgeProps) {
  // Determina a variante visual baseada na categoria e valor
  const variant = variantOverride ?? getSemanticBadgeVariant(category, value);

  // Determina o conteúdo do badge
  const content = React.useMemo(() => {
    if (children) return children;

    if (autoLabel && category === 'parte' && typeof value === 'string') {
      return getParteTipoLabel(value);
    }

    return value ?? '';
  }, [children, autoLabel, category, value]);

  // Não renderiza se não houver valor
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <Badge variant={variant} className={cn(className)} {...props}>
      {content}
    </Badge>
  );
}

/**
 * Componentes especializados para casos de uso comuns.
 * Estes são atalhos convenientes para SemanticBadge com categoria pré-definida.
 */

interface SpecializedBadgeProps extends Omit<SemanticBadgeProps, 'category'> {
  value: string | null | undefined;
}

/**
 * Badge para tribunais (TRT1, TST, TJSP, etc).
 */
export function TribunalSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="tribunal" value={value} {...props} />;
}

/**
 * Badge para status de processo (ATIVO, ARQUIVADO, etc).
 */
export function StatusSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="status" value={value} {...props} />;
}

/**
 * Badge para grau de jurisdição (primeiro_grau, segundo_grau, etc).
 */
export function GrauSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="grau" value={value} {...props} />;
}

/**
 * Badge para polo processual (ATIVO/PASSIVO, AUTOR/REU, etc).
 */
export function PoloSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="polo" value={value} {...props} />;
}

/**
 * Badge para tipo de parte/terceiro (PERITO, TESTEMUNHA, etc).
 */
export function ParteTipoSemanticBadge({
  value,
  autoLabel = true,
  ...props
}: SpecializedBadgeProps & { autoLabel?: boolean }) {
  return <SemanticBadge category="parte" value={value} autoLabel={autoLabel} {...props} />;
}

/**
 * Badge para status de audiência (Marcada, Finalizada, Cancelada).
 */
export function AudienciaStatusSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="audiencia_status" value={value} {...props} />;
}

/**
 * Badge para modalidade de audiência (Virtual, Presencial, Híbrida).
 */
export function AudienciaModalidadeSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="audiencia_modalidade" value={value} {...props} />;
}

/**
 * Badge para tipo de expediente (por ID numérico).
 */
export function ExpedienteTipoSemanticBadge({
  value,
  ...props
}: Omit<SemanticBadgeProps, 'category'> & { value: number | null | undefined }) {
  return <SemanticBadge category="expediente_tipo" value={value} {...props} />;
}

/**
 * Badge para status de captura (pending, in_progress, completed, failed).
 */
export function CapturaStatusSemanticBadge({ value, ...props }: SpecializedBadgeProps) {
  return <SemanticBadge category="captura_status" value={value} {...props} />;
}
