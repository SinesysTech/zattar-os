/**
 * ASSINATURA DIGITAL - Feature Module
 *
 * Módulo completo de assinatura digital eletrônica com conformidade legal MP 2.200-2/2001.
 *
 * @example
 * // Importar tipos
 * import type { Segmento, Template, Formulario } from '@/features/assinatura-digital';
 *
 * // Importar schemas de validação
 * import { createSegmentoSchema, createTemplateSchema } from '@/features/assinatura-digital';
 *
 * // Importar constantes
 * import { TERMOS_VERSAO_ATUAL, API_ROUTES } from '@/features/assinatura-digital';
 *
 * // Importar utils
 * import { formatCPF, validateCPF, collectDeviceFingerprint } from '@/features/assinatura-digital';
 *
 * // Importar store
 * import { useFormularioStore } from '@/features/assinatura-digital';
 *
 * // Importar service
 * import { createAssinaturaDigitalService } from '@/features/assinatura-digital';
 */

// =============================================================================
// TYPES
// =============================================================================
export type {
  // Domain types
  EscopoSegmento,
  TipoTemplate,
  StatusTemplate,
  MetadadoSeguranca,
  CreateSegmentoInput,
  UpdateSegmentoInput,
  Segmento,
  CreateTemplateInput,
  UpdateTemplateInput,
  Template,
  TemplateCampo,
  CreateFormularioInput,
  UpdateFormularioInput,
  Formulario,
  ValidationRule,
  FormFieldOption,
  ConditionalRule,
  FormFieldSchema,
  FormSectionSchema,
  CrossFieldValidation,
  DynamicFormSchema,
  FormFieldValue,
  DynamicFormData,
  CreateAssinaturaDigitalInput,
  UpdateAssinaturaDigitalInput,
  AssinaturaDigital,
  // API types
  DeviceFingerprintData,
  PreviewPayload,
  PreviewResult,
  FinalizePayload,
  FinalizeResult,
  SessaoAssinaturaRecord,
  ListSessoesParams,
  ListSessoesResult,
  AssinaturaDigitalRecord,
  AuditResult,
  ListTemplatesParams,
  TemplateListResponse,
  ListSegmentosParams,
  SegmentoListResponse,
  ListFormulariosParams,
  FormularioListResponse,
  DashboardStats,
  VisualizacaoPdfData,
  VisualizacaoMarkdownData,
  // Store types
  ClienteAssinaturaDigital,
  DadosCPF,
  DadosPessoaisStore,
  DadosAcaoStore,
  DadosAssinaturaStore,
  PdfGerado,
  StepConfig,
  FormularioFlowConfig,
  FormularioState,
  FormularioActions,
  FormularioStore,
} from './types';

export {
  FormFieldType,
  createSegmentoSchema,
  updateSegmentoSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createFormularioSchema,
  updateFormularioSchema,
  createAssinaturaDigitalSchema,
  updateAssinaturaDigitalSchema,
  fieldRequiresOptions,
  isFormattedBRField,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================
export {
  ESTADOS_CIVIS,
  GENEROS,
  ESTADOS_BRASILEIROS,
  NACIONALIDADES,
  TERMOS_VERSAO_ATUAL,
  TERMOS_TEXTO_DECLARACAO,
  DEFAULT_TOTAL_STEPS,
  API_ROUTES,
} from './constants';

// =============================================================================
// UTILS
// =============================================================================
export {
  // Formatters
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
  // Validators
  validateCPF,
  validateCNPJ,
  validateTelefone,
  validateCEP,
  validateEmail,
  validateCpfCnpj,
  // Device fingerprint
  collectDeviceFingerprint,
  // Display utils (badges, formatting, truncate)
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  getTemplateDisplayName,
  getSegmentoDisplayName,
  getFormularioDisplayName,
  getTemplatePreviewText,
  truncateText,
  formatAtivoBadge,
  formatAtivoStatus,
  getAtivoBadgeVariant,
  getAtivoBadgeTone,
  formatBooleanBadge,
  getBooleanBadgeVariant,
} from './utils';

// =============================================================================
// STORE
// =============================================================================
export { useFormularioStore } from './store';

// =============================================================================
// SERVICE & REPOSITORY
// =============================================================================
export { AssinaturaDigitalService, createAssinaturaDigitalService } from './service';
export { AssinaturaDigitalRepository } from './repository';
