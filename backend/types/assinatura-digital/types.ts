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
 *
 * Acoplamento com domain types:
 * - ClienteBase, ClientePessoaFisica de @/types/domain/partes
 * - ParteContraria para dados de partes contrárias
 * - acao_id LEGACY -> processo_id (alinhamento com sinesys/processos)
 */

import type {
  ClienteBase,
  ClientePessoaFisica,
  ParteContraria,
} from '@/types/domain/partes';

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

/**
 * Payload finalização: Acoplado a domain types globais.
 * - cliente_dados: Cliente completo (nome, CPF, endereço) de domain/partes
 * - parte_contraria_dados: Partes contrárias para contratos
 * - acao_id LEGACY → processo_id (alinhado sinesys/processos)
 * Hashes calculados backend.
 */
export interface FinalizePayload {
  // IDs legados (migrar para processo_id em fases futuras)
  cliente_id: number;
  /** @deprecated Use processo_id. Mantido para retrocompatibilidade. */
  acao_id: number;
  /** Novo: ID processo global (preferir sobre acao_id) */
  processo_id?: number;

  template_id: string;
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;

  // Dados completos acoplados a domain types (nome, endereço, CPF, partes contrárias)
  /** Cliente completo para geração de PDF (inclui nome, CPF, endereço) */
  cliente_dados?: ClienteBase & { endereco?: string };
  /** Partes contrárias para contratos (nome, CPF/CNPJ) */
  parte_contraria_dados?: ParteContraria[];

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

  // Conformidade legal MP 2.200-2
  /** Aceite obrigatório dos termos (deve ser true) */
  termos_aceite: boolean;
  /**
   * Versão dos termos aceitos (ex: "v1.0-MP2200-2").
   * IMPORTANTE: Este campo usa nomenclatura `termos_aceite_versao` em todas as camadas:
   * - Payload API (FinalizePayload)
   * - Coluna PostgreSQL (assinatura_digital_assinaturas.termos_aceite_versao)
   * - Record TypeScript (AssinaturaDigitalRecord)
   * - ManifestData.termos.versao (mapeado internamente)
   */
  termos_aceite_versao: string;
  /** Fingerprint do dispositivo para auditoria */
  dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
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

// #region Conformidade Legal MP 2.200-2

/**
 * Dados de fingerprint do dispositivo para auditoria.
 * Coletados no frontend para identificação única do dispositivo.
 */
export interface DeviceFingerprintData {
  /** Resolução de tela (ex: "1920x1080") */
  screen_resolution?: string;
  /** Profundidade de cor (ex: 24) */
  color_depth?: number;
  /** Timezone offset em minutos */
  timezone_offset?: number;
  /** Nome do timezone (ex: "America/Sao_Paulo") */
  timezone_name?: string;
  /** Idioma do navegador */
  language?: string;
  /** Plataforma (ex: "Win32", "MacIntel") */
  platform?: string;
  /** Número de núcleos de CPU */
  hardware_concurrency?: number;
  /** Memória do dispositivo em GB */
  device_memory?: number;
  /** Suporte a touch */
  touch_support?: boolean;
  /** Nível de bateria (0-1) */
  battery_level?: number;
  /** Se está carregando */
  battery_charging?: boolean;
  /** Canvas fingerprint hash */
  canvas_hash?: string;
  /** WebGL fingerprint hash */
  webgl_hash?: string;
  /** Plugins instalados */
  plugins?: string[];
  /** Fontes detectadas */
  fonts?: string[];
  /** User agent completo */
  user_agent?: string;
  /** Dados adicionais */
  [key: string]: unknown;
}

/**
 * Registro completo de assinatura digital no banco de dados.
 * Inclui todos os campos de conformidade legal MP 2.200-2/2001.
 */
export interface AssinaturaDigitalRecord {
  id: number;
  cliente_id: number;
  /** @deprecated Use processo_id quando disponível */
  acao_id: number;
  /** ID processo global (preferir sobre acao_id) */
  processo_id?: number;
  template_uuid: string;
  segmento_id: number;
  formulario_id: number;
  sessao_uuid: string;
  assinatura_url: string;
  foto_url: string | null;
  pdf_url: string;
  protocolo: string;
  ip_address: string | null;
  user_agent: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocation_accuracy: number | null;
  geolocation_timestamp: string | null;
  data_assinatura: string;
  status: string;
  enviado_sistema_externo: boolean;
  data_envio_externo: string | null;

  // Campos conformidade legal MP 2.200-2
  /** Hash SHA-256 do PDF pré-assinatura */
  hash_original_sha256: string;
  /** Hash SHA-256 do PDF final com manifesto */
  hash_final_sha256: string | null;
  /** Versão dos termos aceitos */
  termos_aceite_versao: string;
  /** Timestamp do aceite dos termos */
  termos_aceite_data: string;
  /** Fingerprint do dispositivo */
  dispositivo_fingerprint_raw: DeviceFingerprintData | null;

  created_at: string;
  updated_at: string;

  // Dados expandidos via join (opcional)
  /** Cliente completo populável via join */
  cliente_dados?: ClienteBase;
  /** Partes contrárias populável via join */
  parte_contraria_dados?: ParteContraria[];
}

// #endregion

// Re-export domain types para conveniência
export type { ClienteBase, ClientePessoaFisica, ParteContraria } from '@/types/domain/partes';