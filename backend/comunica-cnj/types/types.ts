/**
 * Comunica CNJ Types
 * Tipos para integração com a API pública do Comunica CNJ
 * https://comunicaapi.pje.jus.br/
 * 
 * ⚠️ TIPOS LEGADOS - DEPRECATED ⚠️
 * 
 * Estes tipos estão sendo substituídos por `src/core/comunica-cnj/domain.ts`.
 * 
 * **MIGRE PARA:**
 * - Tipos em `@/core/comunica-cnj/domain`
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Meio de comunicação no CNJ
 * E = Edital
 * D = Diário Eletrônico
 */
export type MeioComunicacao = 'E' | 'D';

/**
 * Labels amigáveis para meios de comunicação
 */
export const MEIO_LABELS: Record<MeioComunicacao, string> = {
  E: 'Edital',
  D: 'Diário Eletrônico',
};

/**
 * Grau do tribunal inferido do nome do órgão
 */
export type GrauTribunal = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

// =============================================================================
// API PARAMS & RESPONSE
// =============================================================================

/**
 * Parâmetros de busca da API do CNJ
 */
export interface ComunicacaoAPIParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number;
  dataInicio?: string; // formato: yyyy-mm-dd
  dataFim?: string; // formato: yyyy-mm-dd
  meio?: MeioComunicacao;
  orgaoId?: number;
  pagina?: number;
  itensPorPagina?: number; // 5 ou 100, padrão 100
}

/**
 * Destinatário (parte processual)
 */
export interface ComunicacaoDestinatario {
  nome: string;
  comunicacao_id: number;
  polo: 'A' | 'P'; // A = Ativo (Autor), P = Passivo (Réu)
}

/**
 * Advogado destinatário
 */
export interface ComunicacaoDestinatarioAdvogado {
  id: number;
  comunicacao_id: number;
  advogado_id: number;
  created_at: string;
  updated_at: string;
  advogado: {
    id: number;
    nome: string;
    numero_oab: string;
    uf_oab: string;
  };
}

/**
 * Item de comunicação raw da API CNJ (formato original da API)
 * Campos em snake_case/camelCase misturados como retornado pela API
 */
export interface ComunicacaoItemRaw {
  id: number;
  hash: string;
  numero_processo: string;
  numeroprocessocommascara?: string;
  siglaTribunal: string;
  nomeClasse?: string;
  codigoClasse?: string;
  tipoComunicacao?: string;
  tipoDocumento?: string;
  numeroComunicacao?: number;
  texto?: string;
  link?: string;
  nomeOrgao?: string;
  idOrgao?: number;
  data_disponibilizacao: string;
  datadisponibilizacao?: string;
  meio: MeioComunicacao;
  meiocompleto?: string;
  ativo: boolean;
  status?: string;
  motivo_cancelamento?: string | null;
  data_cancelamento?: string | null;
  destinatarios?: ComunicacaoDestinatario[];
  destinatarioadvogados?: ComunicacaoDestinatarioAdvogado[];
}

/**
 * Item de comunicação normalizado (formato interno)
 */
export interface ComunicacaoItem {
  id: number;
  hash: string;
  numeroProcesso: string;
  numeroProcessoComMascara: string;
  siglaTribunal: string;
  nomeClasse: string;
  codigoClasse: string;
  tipoComunicacao: string;
  tipoDocumento: string;
  numeroComunicacao: number;
  texto: string;
  link: string;
  nomeOrgao: string;
  idOrgao: number;
  dataDisponibilizacao: string;
  dataDisponibilizacaoFormatada: string;
  dataCancelamento?: string | null;
  meio: MeioComunicacao;
  meioCompleto: string;
  ativo: boolean;
  status: string;
  motivoCancelamento?: string | null;
  destinatarios: ComunicacaoDestinatario[];
  destinatarioAdvogados: ComunicacaoDestinatarioAdvogado[];
  partesAutoras?: string[];
  partesReus?: string[];
  advogados?: string[];
  advogadosOab?: string[];
}

/**
 * Resposta raw da API de consulta (formato original)
 */
export interface ComunicacaoAPIResponseRaw {
  status: string;
  message: string;
  count: number;
  items: ComunicacaoItemRaw[];
}

/**
 * Metadados de paginação da API (normalizado)
 */
export interface ComunicacaoPaginationMetadata {
  pagina: number;
  itensPorPagina: number;
  total: number;
  totalPaginas: number;
}

/**
 * Resposta da API de consulta (normalizado)
 */
export interface ComunicacaoAPIResponse {
  comunicacoes: ComunicacaoItem[];
  paginacao: ComunicacaoPaginationMetadata;
}

/**
 * Instituição dentro da resposta de tribunais
 */
export interface TribunalInstituicao {
  sigla: string;
  nome: string;
  dataUltimoEnvio?: string;
  active?: boolean;
}

/**
 * Estrutura de UF/Estado na resposta de tribunais
 */
export interface TribunalUFResponse {
  uf: string;
  nomeEstado: string;
  instituicoes: TribunalInstituicao[];
}

/**
 * Informações de tribunal normalizadas
 */
export interface TribunalCNJInfo {
  id: string;
  nome: string;
  sigla: string;
  jurisdicao: string;
  ultimaAtualizacao?: string;
}

/**
 * Resposta bruta da API do caderno
 */
export interface CadernoMetadataAPI {
  sigla_tribunal?: string;
  sigla?: string;
  tribunal?: string;
  meio: MeioComunicacao;
  data: string;
  total_comunicacoes?: number;
  totalComunicacoes?: number;
  url: string;
  expires_at?: string;
  expiresAt?: string;
}

/**
 * Metadados do caderno compactado (normalizado)
 */
export interface CadernoMetadata {
  tribunal: string;
  sigla: string;
  meio: MeioComunicacao;
  data: string;
  totalComunicacoes: number;
  url: string;
  expiresAt: string;
}

/**
 * Status de rate limit
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt?: Date;
}

// =============================================================================
// DATABASE ENTITY
// =============================================================================

/**
 * Entidade comunica_cnj no banco de dados
 */
export interface ComunicaCNJ {
  id: number;
  id_cnj: number;
  hash: string;
  numero_comunicacao: number | null;
  numero_processo: string;
  numero_processo_mascara: string | null;
  sigla_tribunal: string;
  orgao_id: number | null;
  nome_orgao: string | null;
  tipo_comunicacao: string | null;
  tipo_documento: string | null;
  nome_classe: string | null;
  codigo_classe: string | null;
  meio: MeioComunicacao;
  meio_completo: string | null;
  texto: string | null;
  link: string | null;
  data_disponibilizacao: string;
  ativo: boolean;
  status: string | null;
  motivo_cancelamento: string | null;
  data_cancelamento: string | null;
  destinatarios: ComunicacaoDestinatario[] | null;
  destinatarios_advogados: ComunicacaoDestinatarioAdvogado[] | null;
  expediente_id: number | null;
  advogado_id: number | null;
  metadados: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para inserção de comunicação
 */
export interface InserirComunicaCNJParams {
  id_cnj: number;
  hash: string;
  numero_comunicacao?: number | null;
  numero_processo: string;
  numero_processo_mascara?: string | null;
  sigla_tribunal: string;
  orgao_id?: number | null;
  nome_orgao?: string | null;
  tipo_comunicacao?: string | null;
  tipo_documento?: string | null;
  nome_classe?: string | null;
  codigo_classe?: string | null;
  meio: MeioComunicacao;
  meio_completo?: string | null;
  texto?: string | null;
  link?: string | null;
  data_disponibilizacao: string;
  ativo?: boolean;
  status?: string | null;
  motivo_cancelamento?: string | null;
  data_cancelamento?: string | null;
  destinatarios?: ComunicacaoDestinatario[] | null;
  destinatarios_advogados?: ComunicacaoDestinatarioAdvogado[] | null;
  expediente_id?: number | null;
  advogado_id?: number | null;
  metadados?: Record<string, unknown> | null;
}

// =============================================================================
// EXPEDIENTE CREATION
// =============================================================================

/**
 * Parâmetros para criação de expediente a partir de comunicação CNJ
 */
export interface CriarExpedienteFromCNJParams {
  numero_processo: string;
  trt: string;
  grau: GrauTribunal;
  data_criacao_expediente: string;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  codigo_classe?: string;
  advogado_id?: number | null;
}

/**
 * Resultado da extração de partes dos destinatários
 */
export interface PartesExtraidas {
  poloAtivo: string[];
  poloPassivo: string[];
}

// =============================================================================
// CAPTURA
// =============================================================================

/**
 * Parâmetros para execução de captura
 */
export interface ExecutarCapturaParams {
  advogado_id?: number;
  numero_oab?: string;
  uf_oab?: string;
  sigla_tribunal?: string;
  data_inicio?: string;
  data_fim?: string;
}

/**
 * Estatísticas de captura
 */
export interface CapturaStats {
  total: number;
  novos: number;
  duplicados: number;
  vinculados: number;
  expedientesCriados: number;
  erros: number;
}

/**
 * Resultado de captura
 */
export interface CapturaResult {
  success: boolean;
  stats: CapturaStats;
  errors?: string[];
}

// =============================================================================
// CLIENT CONFIG
// =============================================================================

/**
 * Configuração do cliente HTTP
 */
export interface ComunicaCNJClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}
