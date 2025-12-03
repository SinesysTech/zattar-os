export { getAvailableVariables } from './variable-filter';
export type { VariableOption } from './variable-filter';
export { markdownToTiptapJSON, tiptapJSONToMarkdown } from './markdown-converter';
export { generateDummyBase64Image, generateMockDataForPreview } from './mock-data-generator';
export * from './rich-text-parser';
export * from './markdown-renderer';

// Template formatting utilities
export {
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  truncateText,
  getTemplateDisplayName,
} from './format-template';

// Formulario utilities
export {
  getFormularioDisplayName,
  formatBooleanBadge,
  getBooleanBadgeVariant,
  getAtivoBadgeTone,
  formatAtivoStatus,
  getTemplatePreviewText,
} from './formulario-utils';

// Segmento utilities (generateSlug is the canonical source)
export {
  generateSlug,
  validateSlugFormat,
  getSegmentoDisplayName,
  formatAtivoBadge,
  getAtivoBadgeVariant,
} from './segmento-utils';