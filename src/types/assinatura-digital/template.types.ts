/**
 * Tipos de Template para Assinatura Digital (Frontend)
 *
 * Este arquivo define os tipos usados nos componentes de frontend
 * para manipulação de templates de assinatura digital.
 *
 * Para tipos de backend/API, veja: @/backend/types/template.types.ts
 * Para tipos de persistência simplificados, veja: @/backend/types/assinatura-digital/types.ts
 */

// Re-exporta tipos base do backend
export type {
  TipoCampo,
  TipoVariavel,
  PosicaoCampo,
  EstiloCampo,
  ConteudoComposto,
  TemplateCampo,
} from '@/backend/types/template.types';

/**
 * Status possíveis para um template
 */
export type StatusTemplate = 'ativo' | 'inativo' | 'rascunho';

/**
 * Tipos de metadados de segurança que podem ser capturados
 */
export type MetadadoSeguranca = 'ip' | 'user_agent' | 'geolocation' | 'timestamp';

/**
 * Interface Template para frontend
 * Versão com campos parseados (TemplateCampo[]) ao invés de JSON string
 */
export interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  status: StatusTemplate;
  versao: number;
  ativo: boolean;
  /** Campos parseados do template (array de TemplateCampo) */
  campos: import('@/backend/types/template.types').TemplateCampo[];
  /** Conteúdo Markdown para renderização responsiva (alternativa ao PDF) */
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Dados do cliente para geração de PDF/Markdown
 */
export interface ClienteDadosGeracao {
  id?: number;
  name?: string;
  nome?: string;
  nome_completo?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string | null;
  email?: string;
  celular?: string;
  telefone_1?: string;
  data_nascimento?: string | null;
  nacionalidade?: string;
  nacionalidade_txt?: string;
  estado_civil?: string;
  estado_civil_txt?: string;
  genero?: string;
  genero_txt?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  endereco_completo?: string;
  [key: string]: unknown;
}

/**
 * Dados de ação/processo para geração de PDF/Markdown
 * Suporta campos dinâmicos de diferentes tipos de ação (Apps, Trabalhista, etc.)
 */
export interface AcaoDadosGeracao {
  id?: number;
  tipo_acao?: string;
  plataforma_nome?: string;
  modalidade_nome?: string;
  data_inicio_plataforma?: string;
  data_bloqueado_plataforma?: string | null;
  nome_empresa_pessoa?: string;
  cpf_cnpj_empresa_pessoa?: string;
  cep_empresa_pessoa?: string;
  data_inicio?: string;
  data_rescisao?: string;
  [key: string]: unknown;
}

/**
 * Dados do sistema para geração de PDF/Markdown
 */
export interface SistemaDadosGeracao {
  data_geracao?: string;
  data_geracao_extenso?: string;
  ip_cliente?: string;
  user_agent?: string;
  protocolo?: string;
  numero_contrato?: string;
  timestamp?: string;
  latitude?: string;
  longitude?: string;
  [key: string]: unknown;
}

/**
 * Dados do escritório para geração de PDF/Markdown
 */
export interface EscritorioDadosGeracao {
  nome?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Contexto completo de dados para geração de PDF/Markdown
 * Usado por renderMarkdownWithVariables e generatePdfFromTemplate
 */
export interface DadosGeracao {
  cliente: ClienteDadosGeracao;
  acao: AcaoDadosGeracao;
  sistema: SistemaDadosGeracao;
  segmento?: import('@/backend/types/assinatura-digital/types').AssinaturaDigitalSegmento;
  escritorio?: EscritorioDadosGeracao;
  assinatura?: {
    assinatura_base64?: string;
    foto_base64?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  [key: string]: unknown;
}

/**
 * Resposta da API de preview de teste
 */
export interface ApiPreviewTestResponse {
  success: boolean;
  pdfBase64?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  is_preview?: boolean;
  error?: string;
  details?: {
    template_id: string;
    campos_count: number;
    mock_data_used: boolean;
  };
  avisos?: string[];
}
