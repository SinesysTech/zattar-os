/**
 * COMUNICA CNJ DOMAIN - Tipos e Validações
 * Tipos para integração com a API pública do Comunica CNJ
 * https://comunicaapi.pje.jus.br/
 */

import { z } from 'zod';

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
export const MEIO_COMUNICACAO_LABELS: Record<MeioComunicacao, string> = {
  E: 'Edital',
  D: 'Diário Eletrônico',
};

/**
 * Grau do tribunal inferido do nome do órgão
 */
export type GrauTribunal = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Labels amigáveis para graus de tribunal
 */
export const GRAU_TRIBUNAL_LABELS: Record<GrauTribunal, string> = {
  primeiro_grau: 'Primeiro Grau',
  segundo_grau: 'Segundo Grau',
  tribunal_superior: 'Tribunal Superior',
};

/**
 * Status de comunicação
 */
export type StatusComunicacao = 'P' | 'C' | 'X'; // P = Pendente, C = Cancelada, X = Outro

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
export interface TribunalInfo {
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
export interface ComunicacaoCNJ {
  id: number;
  idCnj: number;
  hash: string;
  numeroComunicacao: number | null;
  numeroProcesso: string;
  numeroProcessoMascara: string | null;
  siglaTribunal: string;
  orgaoId: number | null;
  nomeOrgao: string | null;
  tipoComunicacao: string | null;
  tipoDocumento: string | null;
  nomeClasse: string | null;
  codigoClasse: string | null;
  meio: MeioComunicacao;
  meioCompleto: string | null;
  texto: string | null;
  link: string | null;
  dataDisponibilizacao: string;
  ativo: boolean;
  status: string | null;
  motivoCancelamento: string | null;
  dataCancelamento: string | null;
  destinatarios: ComunicacaoDestinatario[] | null;
  destinatariosAdvogados: ComunicacaoDestinatarioAdvogado[] | null;
  expedienteId: number | null;
  advogadoId: number | null;
  metadados: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parâmetros para inserção de comunicação
 */
export interface InserirComunicacaoParams {
  idCnj: number;
  hash: string;
  numeroComunicacao?: number | null;
  numeroProcesso: string;
  numeroProcessoMascara?: string | null;
  siglaTribunal: string;
  orgaoId?: number | null;
  nomeOrgao?: string | null;
  tipoComunicacao?: string | null;
  tipoDocumento?: string | null;
  nomeClasse?: string | null;
  codigoClasse?: string | null;
  meio: MeioComunicacao;
  meioCompleto?: string | null;
  texto?: string | null;
  link?: string | null;
  dataDisponibilizacao: string;
  ativo?: boolean;
  status?: string | null;
  motivoCancelamento?: string | null;
  dataCancelamento?: string | null;
  destinatarios?: ComunicacaoDestinatario[] | null;
  destinatariosAdvogados?: ComunicacaoDestinatarioAdvogado[] | null;
  expedienteId?: number | null;
  advogadoId?: number | null;
  metadados?: Record<string, unknown> | null;
}

/**
 * Comunicação processual (formato da API normalizado)
 * Usado para processamento interno
 */
export interface ComunicacaoProcessual {
  id: number;
  hash: string;
  numeroProcesso: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  dataDisponibilizacao: string;
  meio: MeioComunicacao;
  ativo: boolean;
  texto: string;
  destinatarios: ComunicacaoDestinatario[];
}

// =============================================================================
// EXPEDIENTE CREATION
// =============================================================================

/**
 * Parâmetros para criação de expediente a partir de comunicação CNJ
 */
export interface CriarExpedienteFromCNJParams {
  numeroProcesso: string;
  trt: string;
  grau: GrauTribunal;
  dataCriacaoExpediente: string;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  codigoClasse?: string;
  advogadoId?: number | null;
}

/**
 * Resultado da extração de partes dos destinatários
 */
export interface PartesExtraidas {
  poloAtivo: string[];
  poloPassivo: string[];
}

// =============================================================================
// CAPTURA & SINCRONIZAÇÃO
// =============================================================================

/**
 * Parâmetros para execução de sincronização
 */
export interface SincronizarParams {
  advogadoId?: number;
  numeroOab?: string;
  ufOab?: string;
  siglaTribunal?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Estatísticas de sincronização
 */
export interface SincronizacaoStats {
  total: number;
  novos: number;
  duplicados: number;
  vinculados: number;
  expedientesCriados: number;
  erros: number;
}

/**
 * Resultado de sincronização
 */
export interface SincronizacaoResult {
  success: boolean;
  stats: SincronizacaoStats;
  errors?: string[];
}

/**
 * Resultado de consulta (sem persistência)
 */
export interface ConsultaResult {
  comunicacoes: ComunicacaoItem[];
  paginacao: ComunicacaoPaginationMetadata;
  rateLimit: RateLimitStatus;
}

// =============================================================================
// FILTROS E PARÂMETROS
// =============================================================================

/**
 * Parâmetros para listar comunicações (banco de dados)
 */
export interface ListarComunicacoesParams {
  numeroProcesso?: string;
  siglaTribunal?: string;
  dataInicio?: string;
  dataFim?: string;
  advogadoId?: number;
  expedienteId?: number;
  semExpediente?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Parâmetros para consultar comunicações (API)
 */
export interface ConsultarComunicacoesParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number;
  dataInicio?: string;
  dataFim?: string;
  meio?: MeioComunicacao;
  orgaoId?: number;
  pagina?: number;
  itensPorPagina?: number;
}

/**
 * Parâmetros para match de expediente
 */
export interface MatchParams {
  numeroProcesso: string;
  trt: string;
  grau: GrauTribunal;
  dataDisponibilizacao: string;
}

/**
 * Resultado de batch operation
 */
export interface BatchResult {
  inseridas: number;
  duplicadas: number;
  erros: number;
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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema de validação para consultar comunicações
 */
export const consultarComunicacoesSchema = z.object({
  siglaTribunal: z.string().optional(),
  texto: z.string().optional(),
  nomeParte: z.string().optional(),
  nomeAdvogado: z.string().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  numeroProcesso: z.string().optional(),
  numeroComunicacao: z.number().int().positive().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meio: z.enum(['E', 'D']).optional(),
  orgaoId: z.number().int().positive().optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.enum([5, 100]).default(100),
}).refine(
  (data) => {
    // Pelo menos um filtro deve ser preenchido OU itensPorPagina deve ser <= 5
    const hasFilter = !!(
      data.siglaTribunal ||
      data.texto ||
      data.nomeParte ||
      data.nomeAdvogado ||
      data.numeroOab ||
      data.numeroProcesso ||
      data.numeroComunicacao ||
      data.orgaoId ||
      data.dataInicio ||
      data.dataFim ||
      data.meio
    );
    return hasFilter || data.itensPorPagina <= 5;
  },
  {
    message: 'Pelo menos um filtro deve ser preenchido ou itensPorPagina deve ser <= 5',
  }
).refine(
  (data) => {
    // Se ambas as datas estão presentes, dataInicio deve ser anterior a dataFim
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataInicio) <= new Date(data.dataFim);
    }
    return true;
  },
  {
    message: 'dataInicio deve ser anterior a dataFim',
  }
);

/**
 * Schema de validação para sincronizar comunicações
 */
export const sincronizarComunicacoesSchema = z.object({
  advogadoId: z.number().int().positive().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  siglaTribunal: z.string().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => {
    // Deve ter OAB (numeroOab + ufOab) OU (siglaTribunal + dataInicio)
    const hasOab = !!(data.numeroOab && data.ufOab);
    const hasTribunalData = !!(data.siglaTribunal && data.dataInicio);
    return hasOab || hasTribunalData;
  },
  {
    message: 'Deve fornecer OAB (numeroOab + ufOab) ou tribunal com data (siglaTribunal + dataInicio)',
  }
);

/**
 * Schema de validação para vincular expediente
 */
export const vincularExpedienteSchema = z.object({
  comunicacaoId: z.number().int().positive(),
  expedienteId: z.number().int().positive(),
});

/**
 * Schema de validação para listar comunicações capturadas
 */
export const listarComunicacoesCapturadasSchema = z.object({
  numeroProcesso: z.string().optional(),
  siglaTribunal: z.string().optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  advogadoId: z.number().int().positive().optional(),
  expedienteId: z.number().int().positive().optional(),
  semExpediente: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
}).refine(
  (data) => {
    // Se ambas as datas estão presentes, dataInicio deve ser anterior a dataFim
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataInicio) <= new Date(data.dataFim);
    }
    return true;
  },
  {
    message: 'dataInicio deve ser anterior a dataFim',
  }
);
