import type { AssinaturaDigitalSegmento } from '@/backend/types/assinatura-digital/types';

// Re-export generateSlug from the centralized slug-helpers module
export { generateSlug } from '@/app/_lib/assinatura-digital/slug-helpers';

// Re-export validateSlug as validateSlugFormat from the centralized slug-helpers module
export { validateSlug as validateSlugFormat } from '@/app/_lib/assinatura-digital/slug-helpers';

/**
 * Returns the display name for a segmento, falling back to slug or 'Sem nome' if nome is not available.
 *
 * @param segmento - The segmento object
 * @returns The display name string
 *
 * @example
 * getSegmentoDisplayName({ nome: 'Jurídico', slug: 'juridico' }) // 'Jurídico'
 * getSegmentoDisplayName({ nome: '', slug: 'juridico' }) // 'juridico'
 * getSegmentoDisplayName({ nome: null, slug: '' }) // 'Sem nome'
 */
export function getSegmentoDisplayName(segmento: AssinaturaDigitalSegmento): string {
  return segmento.nome || segmento.slug || 'Sem nome';
}

/**
 * Formats the ativo status for display in a badge.
 *
 * @param ativo - Boolean indicating if the segmento is active
 * @returns 'Ativo' if true, 'Inativo' if false
 *
 * @example
 * formatAtivoBadge(true) // 'Ativo'
 * formatAtivoBadge(false) // 'Inativo'
 */
export function formatAtivoBadge(ativo: boolean): string {
  return ativo ? 'Ativo' : 'Inativo';
}

/**
 * Returns the badge variant for the ativo status.
 *
 * @param ativo - Boolean indicating if the segmento is active
 * @returns 'default' for active, 'secondary' for inactive
 *
 * @example
 * getAtivoBadgeVariant(true) // 'default'
 * getAtivoBadgeVariant(false) // 'secondary'
 */
export function getAtivoBadgeVariant(ativo: boolean): 'default' | 'secondary' {
  return ativo ? 'default' : 'secondary';
}

// Note: truncateText is exported from format-template.ts to avoid duplicate exports