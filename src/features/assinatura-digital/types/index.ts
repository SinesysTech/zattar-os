/**
 * ASSINATURA DIGITAL - Types barrel export
 *
 * Re-exporta todos os tipos do módulo de assinatura digital.
 */

// Domain types (entities, schemas, enums)
export type {
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
} from "./domain";

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
} from "./domain";

// PDF preview/editor (zoom/canvas) - usados por `components/pdf/*` e `components/editor/*`
export type {
  PdfPreviewProps,
  PdfPageInfo,
  PdfLoadState,
  PdfZoomConfig,
} from "./pdf-preview.types";

export {
  DEFAULT_ZOOM_CONFIG,
  PDF_CANVAS_SIZE,
} from "./pdf-preview.types";

// API types (payloads, responses, records)
export type {
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
} from "./api";

// Store types
export type {
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
} from "./store";

// Template types for PDF generation
export type {
  TipoVariavel,
  PosicaoCampo,
  EstiloCampo,
  ConteudoComposto,
  TemplateCampo as TemplateCampoPdf,
} from "./template.types";

// Cliente adapter types and functions
export type {
  ClienteFormsignPayload,
} from "./cliente-adapter.types";

export {
  mapClienteFormToCliente,
  clienteSinesysToAssinaturaDigital,
} from "./cliente-adapter.types";

// Editor helper types and functions (from components/editor/editor-helpers.ts)
// Note: These are re-exported for convenience, but the original source is in components
export type {
  VariableOption,
  TiptapNode,
  TiptapDocument,
} from "../components/editor/editor-helpers";

export {
  getAvailableVariables,
  markdownToTiptapJSON,
  tiptapJSONToMarkdown,
  validateMarkdownForForm,
} from "../components/editor/editor-helpers";
