/**
 * Assinatura Digital Types (Backend)
 *
 * IMPORTANTE: Estes tipos são simplificados para payloads de API.
 * Para tipos completos e tipados, veja: @/types/assinatura-digital/
 *
 * Diferenças principais:
 * - AssinaturaDigitalTemplate.campos: string (JSON) vs Template.campos: TemplateCampo[]
 * - AssinaturaDigitalFormulario.form_schema: unknown vs FormularioEntity.form_schema: DynamicFormSchema
 * - AssinaturaDigitalSegmento é compatível com Segmento (mesma estrutura)
 */

export interface AssinaturaDigitalTemplate {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  status: string;
  versao: number;
  ativo: boolean;
  campos: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalTemplateList {
  templates: AssinaturaDigitalTemplate[];
  total: number;
}

export type StatusTemplate = 'ativo' | 'inativo' | 'rascunho';

export interface ListTemplatesParams {
  search?: string;
  ativo?: boolean;
  status?: StatusTemplate;
}

export interface UpsertTemplateInput {
  nome: string;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  template_uuid?: string;
  descricao?: string | null;
  status?: string;
  versao?: number;
  ativo?: boolean;
  campos?: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
}

export interface AssinaturaDigitalSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  /**
   * Number of formularios associated with this segmento.
   * Populated by the list service when needed.
   */
  formularios_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ListSegmentosParams {
  ativo?: boolean;
  search?: string;
}

export interface AssinaturaDigitalSegmentoList {
  segmentos: AssinaturaDigitalSegmento[];
  total: number;
}

export interface UpsertSegmentoInput {
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface AssinaturaDigitalFormulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  segmento_id: number;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  segmento?: AssinaturaDigitalSegmento;
}

export interface ListFormulariosParams {
  segmento_id?: number | number[];
  ativo?: boolean;
  search?: string;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}

export interface AssinaturaDigitalFormularioList {
  formularios: AssinaturaDigitalFormulario[];
  total: number;
}

export interface UpsertFormularioInput {
  nome: string;
  slug: string;
  segmento_id: number;
  descricao?: string | null;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo?: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
}

export interface AssinaturaDigitalDashboardStats {
  templatesAtivos: number;
  assinaturasHoje: number;
  totalAssinaturasHoje: number;
  pdfsGeradosHoje: number;
  taxaSucesso: number;
  ultimaAtualizacao: string;
}

/**
 * Assinatura Digital Signature Types (Backend)
 *
 * IMPORTANTE: Estes tipos são para payloads de API de assinatura.
 * Para tipos completos de Template e DadosGeracao, veja: @/types/assinatura-digital/template.types
 *
 * Relação com frontend:
 * - PreviewPayload e FinalizePayload são específicos de API
 * - DadosGeracao (frontend) é mais completo e inclui todos os dados para geração de PDF
 * - Template (frontend) define a estrutura completa do template
 */

export interface PreviewPayload {
  cliente_id: number;
  acao_id: number;
  template_id: string;
  foto_base64?: string | null;
  request_id?: string | null;
}

export interface FinalizePayload {
  cliente_id: number;
  acao_id: number;
  template_id: string;
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;
  assinatura_base64: string;
  foto_base64?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geolocation_accuracy?: number | null;
  geolocation_timestamp?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  sessao_id?: string | null;
  request_id?: string | null;
}

export interface FinalizeResult {
  assinatura_id: number;
  protocolo: string;
  pdf_url: string;
}

export interface PreviewResult {
  pdf_url: string;
}

export interface ListSessoesParams {
  segmento_id?: number;
  formulario_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SessaoAssinaturaRecord {
  id: number;
  acao_id: number | null;
  sessao_uuid: string;
  status: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: Record<string, unknown> | null;
  geolocation?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
}

export interface ListSessoesResult {
  sessoes: SessaoAssinaturaRecord[];
  total: number;
  page: number;
  pageSize: number;
}