import type { FormsignFormulario, FormsignTemplate } from '@/backend/types/formsign-admin/types';

// Re-export generateSlug from the centralized slug-helpers module
export { generateSlug } from '@/app/_lib/formsign/slug-helpers';

/**
 * Returns the display name for a formulario, falling back to a default if nome is not available.
 */
export function getFormularioDisplayName(formulario: FormsignFormulario): string {
  return formulario.nome || `Formulário #${formulario.id}`;
}

/**
 * Formats a boolean value for display in a badge.
 */
export function formatBooleanBadge(value: boolean): string {
  return value ? 'Sim' : 'Não';
}

/**
 * Returns the badge variant for a boolean value.
 */
export function getBooleanBadgeVariant(value: boolean): 'default' | 'secondary' {
  return value ? 'default' : 'secondary';
}

/**
 * Returns the badge tone for the ativo status.
 * Use with <Badge tone={...}> instead of variant.
 */
export function getAtivoBadgeTone(ativo: boolean): 'success' | 'neutral' {
  return ativo ? 'success' : 'neutral';
}

/**
 * Formats the ativo status for display.
 */
export function formatAtivoStatus(ativo: boolean): string {
  return ativo ? 'Ativo' : 'Inativo';
}

/**
 * Generates a preview text for selected templates.
 * Shows up to 3 template names, then "e mais X" if more.
 */
export function getTemplatePreviewText(templateIds: string[], templates: FormsignTemplate[]): string {
  const selectedTemplates = templates.filter(t => templateIds.includes(t.template_uuid));
  const names = selectedTemplates.map(t => t.nome);
  if (names.length <= 3) {
    return names.join(', ');
  }
  const firstThree = names.slice(0, 3).join(', ');
  const moreCount = names.length - 3;
  return `${firstThree} e mais ${moreCount}`;
}