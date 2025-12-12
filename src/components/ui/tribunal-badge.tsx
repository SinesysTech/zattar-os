'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSemanticBadgeVariant } from '@/lib/design-system';

/**
 * TribunalBadge - Badge para exibir siglas de tribunal.
 *
 * @ai-context Este componente usa o sistema de variantes semânticas.
 * A cor é determinada automaticamente pelo mapeamento em @/lib/design-system/variants.ts.
 * Para adicionar um novo tribunal, basta adicionar a entrada em TRIBUNAL_VARIANTS.
 *
 * @example
 * <TribunalBadge codigo="TRT1" />
 * <TribunalBadge codigo="TST" />
 * <TribunalBadge codigo="TJSP" />
 */
interface TribunalBadgeProps {
  codigo: string;
  className?: string;
}

export function TribunalBadge({ codigo, className }: TribunalBadgeProps) {
  if (!codigo) {
    return null;
  }

  // Obtém a variante semântica baseada no código do tribunal
  const variant = getSemanticBadgeVariant('tribunal', codigo);

  return (
    <Badge variant={variant} className={cn(className)}>
      {codigo}
    </Badge>
  );
}
