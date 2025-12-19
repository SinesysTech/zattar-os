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
  // Upload/Form types
  UploadPdfResult,
  TemplateFormData,
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
  // Editor helpers
  VariableOption,
  TiptapNode,
  TiptapDocument,
} from "./types";

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
  // Upload/Form schemas
  uploadPdfSchema,
  templateFormSchema,
  // Editor helpers
  getAvailableVariables,
  markdownToTiptapJSON,
  tiptapJSONToMarkdown,
  validateMarkdownForForm,
} from "./types";

export type { PdfPreviewProps, PdfLoadState, PdfZoomConfig } from "./types";
export { DEFAULT_ZOOM_CONFIG, PDF_CANVAS_SIZE } from "./types";

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
} from "./constants";

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
  // Cliente adapters
  mapClienteFormToCliente,
  clienteSinesysToAssinaturaDigital,
} from "./utils";

export type { ClienteFormsignPayload } from "./utils";

// =============================================================================
// STORE
// =============================================================================
export { useFormularioStore } from "./store";

// =============================================================================
// SERVICE & REPOSITORY
// =============================================================================
export {
  AssinaturaDigitalService,
  createAssinaturaDigitalService,
} from "./service";
export { AssinaturaDigitalRepository } from "./repository";

// =============================================================================
// SLUG HELPERS
// =============================================================================
export { generateSlug, generateFormularioSlug } from "./utils/slug-helpers";

// =============================================================================
// COMPONENTS
// =============================================================================
export * from "./components/inputs";

// Schema Builder
export { FormSchemaBuilder, FieldPalette, FieldPropertiesPanel, SchemaCanvas } from "./components/schema-builder";

// Editor
export { default as FieldMappingEditor } from "./components/editor/FieldMappingEditor";
export { MarkdownRichTextEditor } from "./components/editor/MarkdownRichTextEditor";
export { default as CreateTemplateForm } from "./components/editor/CreateTemplateForm";
export { PdfUploadField } from "./components/editor/pdf-upload-field";
export type { PdfUploadFieldProps, PdfUploadValue } from "./components/editor/pdf-upload-field";

// Templates
export { TemplateCreateDialog, TemplateFormFields } from "./components/templates";
export type { TemplateCreateDialogProps, TemplateFormFieldsProps } from "./components/templates";

// Cliente
export { ClienteAutocomplete } from "./components/cliente-autocomplete";

// Select Components
export { SegmentoSelect } from "./components/segmento-select";
export type { SegmentoSelectProps } from "./components/segmento-select";
export { TemplateSelect } from "./components/template-select";
export type { TemplateSelectProps } from "./components/template-select";
export { FormularioSelect } from "./components/formulario-select";
export type { FormularioSelectProps } from "./components/formulario-select";
export { ClienteSelect } from "./components/cliente-select";
export type { ClienteSelectProps } from "./components/cliente-select";

// Form Components
export { AssinaturaFluxoForm } from "./components/assinatura-fluxo-form";
export type { AssinaturaFluxoFormProps } from "./components/assinatura-fluxo-form";
export { AssinaturaDigitalTabsContent } from "./components/assinatura-digital-tabs-content";

// Form
export { FormularioPage } from "./components/form";

// Utils
export { generateMockDataForPreview } from "./utils/mock-data-generator";

// =============================================================================
// SERVER ACTIONS
// =============================================================================
export {
  listarSegmentosAction,
  criarSegmentoAction,
  atualizarSegmentoAction,
  listarTemplatesAction,
  criarTemplateAction,
  processarTemplateAction,
  gerarPdfDeMarkdownAction,
  listarFormulariosAction,
  searchClienteByCPF,
  searchParteContraria,
} from "./actions";

// =============================================================================
// SERVICES (Server-only)
// =============================================================================
export { getSegmentoBySlug, getSegmentoBySlugAdmin } from "./services/segmentos.service";
export { getFormularioBySlugAndSegmentoId, getFormulario } from "./services/formularios.service";
export { getTemplate } from "./services/templates.service";
export { generatePdfFromTemplate } from "./services/template-pdf.service";
export { storePdf, storeSignatureImage, storePhotoImage } from "./services/storage.service";
export type { StoredFile } from "./services/storage.service";

// =============================================================================
// BACKEND/API TYPES (from types/types.ts)
// =============================================================================
export type {
  AssinaturaDigitalTemplate,
  AssinaturaDigitalTemplateList,
  AssinaturaDigitalFormulario,
  AssinaturaDigitalFormularioList,
  UpsertFormularioInput,
  AssinaturaDigitalSegmento,
  AssinaturaDigitalSegmentoList,
} from "./types/types";
