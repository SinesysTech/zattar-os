/**
 * ASSINATURA DIGITAL - Utils barrel export
 */

// Formatadores
export {
  formatCPF,
  parseCPF,
  formatCNPJ,
  parseCNPJ,
  formatCpfCnpj,
  parseCpfCnpj,
  formatTelefone,
  parseTelefone,
  formatCelularWithCountryCode,
  formatCEP,
  parseCEP,
  formatData,
  formatDataHora,
  parseDataBR,
} from './formatters';

// Validadores
export {
  validateCPF,
  validateCNPJ,
  validateTelefone,
  validateCEP,
  validateEmail,
  validateCpfCnpj,
} from './validators';

// Device Fingerprint
export { collectDeviceFingerprint } from './device-fingerprint';

// Display Utils (badges, formatação de nomes, truncate, etc.)
export {
  // Template utils
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  getTemplateDisplayName,
  // Segmento utils
  getSegmentoDisplayName,
  // Formulario utils
  getFormularioDisplayName,
  getTemplatePreviewText,
  // Generic badge utils
  truncateText,
  formatAtivoBadge,
  formatAtivoStatus,
  getAtivoBadgeVariant,
  getAtivoBadgeTone,
  formatBooleanBadge,
  getBooleanBadgeVariant,
} from './display';

// Slug Helpers
export {
  SLUG_PATTERN,
  normalizeString,
  generateSlug,
  generateFormularioSlug,
  validateSlug,
} from './slug-helpers';
