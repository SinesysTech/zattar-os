
import type {
  CodigoTRT,
  GrauTRT,
  FiltroPrazoPendentes,
} from './trt-types';

export type { CodigoTRT, GrauTRT, FiltroPrazoPendentes };

// Tipo de captura
export type TipoCaptura = 'acervo_geral' | 'arquivados' | 'audiencias' | 'pendentes' | 'partes' | 'combinada';
export type StatusCaptura = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface CapturaLog {
  id: number;
  tipo_captura: TipoCaptura;
  advogado_id: number | null;
  credencial_ids: number[];
  status: StatusCaptura;
  iniciado_em: string;
  concluido_em: string | null;
  erro: string | null;
  dados_adicionais: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ListarCapturasLogParams {
  pagina?: number;
  limite?: number;
  tipo_captura?: string;
  advogado_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface ListarCapturasLogResult {
  capturas: CapturaLog[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Resposta padrão da API de captura
 */
export interface CapturaApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  capture_id?: number;
}

/**
 * Credencial disponível para captura
 */
export interface CredencialDisponivel {
  id: number;
  advogado_id: number;
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oab: string;
  advogado_uf_oab: string;
  tribunal: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resposta da API de credenciais
 */
export interface CredenciaisApiResponse {
  success: boolean;
  data?: {
    credenciais: CredencialDisponivel[];
    tribunais_disponiveis: CodigoTRT[];
    graus_disponiveis: GrauTRT[];
  };
  error?: string;
}

/**
 * Resultado de captura de acervo geral
 */
export interface AcervoGeralResult {
  processos?: unknown[];
  total?: number;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de processos arquivados
 */
export interface ArquivadosResult {
  processos?: unknown[];
  total?: number;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de audiências
 */
export interface AudienciasResult {
  audiencias?: unknown[];
  total?: number;
  dataInicio?: string;
  dataFim?: string;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
    orgaosJulgadoresCriados?: number;
  };
}

export interface StartCaptureData {
  credenciais_processadas: number;
  message: string;
}

/**
 * Resultado de captura de pendências de manifestação
 */
export interface PendentesResult {
  processos?: unknown[];
  total?: number;
  filtroPrazo?: FiltroPrazoPendentes;
  persistencia?: {
    total: number;
    atualizados: number;
    erros: number;
  };
}

/**
 * Resultado de captura de partes
 */
export interface CapturaPartesResult {
  total_processos: number;
  total_partes: number;
  clientes: number;
  partes_contrarias: number;
  terceiros: number;
  representantes: number;
  vinculos: number;
  erros: Array<{ processo_id: number; numero_processo: string; erro: string }>;
  duracao_ms: number;
}

/**
 * Parâmetros base para captura (novo formato)
 */
export interface BaseCapturaParams {
  advogado_id: number;
  credencial_ids: number[];
}

/**
 * Parâmetros para captura de partes
 */
export interface CapturaPartesParams extends BaseCapturaParams {
  processo_ids?: number[];
  trts?: CodigoTRT[];
  graus?: GrauTRT[];
  numero_processo?: string;
  numeros_processo?: string[];
}

/**
 * Parâmetros para captura de audiências
 */
export interface AudienciasParams extends BaseCapturaParams {
  dataInicio?: string;
  dataFim?: string;
  status?: 'M' | 'C' | 'F'; // M=Designada, C=Cancelada, F=Realizada
}

/**
 * Parâmetros para captura de pendências
 */
export interface PendentesParams extends BaseCapturaParams {
  filtroPrazo?: FiltroPrazoPendentes;
  filtrosPrazo?: FiltroPrazoPendentes[];
}

/**
 * Filtro para documentos da timeline
 */
export interface FiltroDocumentosTimeline {
  apenasAssinados?: boolean;
  apenasNaoSigilosos?: boolean;
  tipos?: string[];
  dataInicial?: string;
  dataFinal?: string;
}

/**
 * Parâmetros para captura de timeline
 */
export interface TimelineParams {
  processoId: string;
  trtCodigo: CodigoTRT;
  grau: GrauTRT;
  advogadoId: number;
  baixarDocumentos?: boolean;
  filtroDocumentos?: FiltroDocumentosTimeline;
}

/**
 * Resultado de captura de timeline
 */
export interface TimelineResult {
  timeline?: unknown[];
  totalItens?: number;
  totalDocumentos?: number;
  totalMovimentos?: number;
  documentosBaixados?: Array<{
    detalhes: unknown;
    pdfTamanho?: number;
    erro?: string;
  }>;
  totalBaixadosSucesso?: number;
  totalErros?: number;
  mongoId?: string;
}

// ============================================================================
// Recovery Types - Recuperacao de dados do MongoDB
// ============================================================================

/**
 * Parametros para listar logs de recovery
 */
export interface ListarRecoveryLogsParams {
  capturaLogId?: number;
  tipoCaptura?: string;
  status?: 'success' | 'error';
  trt?: CodigoTRT;
  grau?: GrauTRT;
  advogadoId?: number;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  limite?: number;
  incluirEstatisticas?: boolean;
}

/**
 * Log de recovery (sumario)
 */
export interface RecoveryLogSumario {
  mongoId: string;
  capturaLogId: number;
  tipoCaptura: string;
  status: 'success' | 'error';
  trt: string;
  grau: string;
  advogadoId: number;
  criadoEm: string;
  numeroProcesso?: string;
  processoIdPje?: number;
  erro?: string | null;
}

/**
 * Resposta da listagem de logs de recovery
 */
export interface ListarRecoveryLogsResponse {
  success: boolean;
  data?: {
    logs: RecoveryLogSumario[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    };
  estatisticas?: {
    contadores: { success: number; error: number; total: number };
    porTrt: Array<{ trt: string; total: number; success: number; error: number }>;
    gaps: {
      totalLogs: number;
      logsComGaps: number;
      resumoGaps: { enderecos: number; partes: number; representantes: number };
    };
  };
  error?: string;
}

/**
 * Elemento recuperavel (gap identificado)
 */
export interface ElementoRecuperavel {
  tipo: 'endereco' | 'parte' | 'representante' | 'cadastro_pje';
  identificador: string;
  nome: string;
  dadosBrutos: Record<string, unknown>;
  statusPersistencia: 'pendente' | 'existente' | 'faltando' | 'erro';
  erro?: string;
  contexto?: {
    entidadeId?: number;
    entidadeTipo?: string;
    enderecoId?: number;
  };
}

/**
 * Analise de gaps de uma captura
 */
export interface RecoveryAnalise {
  processo: {
    id: number | null;
    idPje: number;
    numeroProcesso: string;
    trt: string;
    grau: string;
  };
  totais: {
    partes: number;
    partesPersistidas: number;
    enderecosEsperados: number;
    enderecosPersistidos: number;
    representantes: number;
    representantesPersistidos: number;
  };
  gaps: {
    enderecosFaltantes: ElementoRecuperavel[];
    partesFaltantes: ElementoRecuperavel[];
    representantesFaltantes: ElementoRecuperavel[];
  };
  payloadDisponivel: boolean;
  erroOriginal?: string | null;
}

/**
 * Resposta da analise de recovery
 */
export interface RecoveryAnaliseResponse {
  success: boolean;
  data?: {
    log: {
      mongoId: string;
      capturaLogId: number;
      tipoCaptura: string;
      status: string;
      trt: string;
      grau: string;
      advogadoId: number;
      criadoEm: string;
      erro?: string | null;
      requisicao?: Record<string, unknown>;
      resultadoProcessado?: Record<string, unknown>;
    };
    payloadDisponivel: boolean;
    analise?: RecoveryAnalise;
    payloadBruto?: unknown;
  };
  error?: string;
}

/**
 * Parametros para re-processamento
 */
export interface ReprocessarParams {
  mongoIds?: string[];
  capturaLogId?: number;
  tiposElementos?: Array<'endereco' | 'parte' | 'representante' | 'cadastro_pje'>;
  filtros?: {
    apenasGaps?: boolean;
    forcarAtualizacao?: boolean;
  };
}

/**
 * Resultado de elemento re-processado
 */
export interface ResultadoElemento {
  tipo: string;
  identificador: string;
  nome: string;
  sucesso: boolean;
  acao: 'criado' | 'atualizado' | 'ignorado' | 'erro';
  erro?: string;
  registroId?: number;
}

/**
 * Resultado de documento re-processado
 */
export interface ResultadoDocumento {
  mongoId: string;
  numeroProcesso: string;
  sucesso: boolean;
  totalProcessados: number;
  totalSucessos: number;
  totalErros: number;
  elementos: ResultadoElemento[];
  duracaoMs: number;
}

/**
 * Resultado completo do re-processamento
 */
export interface ReprocessarResult {
  sucesso: boolean;
  totalDocumentos: number;
  totalElementos: number;
  totalSucessos: number;
  totalErros: number;
  documentos: ResultadoDocumento[];
  duracaoMs: number;
  erro?: string;
}

/**
 * Resposta do re-processamento
 */
export interface ReprocessarResponse {
  success: boolean;
  data?: ReprocessarResult;
  error?: string;
}
