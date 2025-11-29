// Cliente API para endpoints de captura TRT
// Comunicação exclusiva via REST - sem importações do back-end

import type {
  CodigoTRT,
  GrauTRT,
  FiltroPrazoPendentes,
} from '@/backend/types/captura/trt-types';

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

/**
 * Cliente API para buscar credenciais disponíveis
 */
export async function listarCredenciais(): Promise<CredenciaisApiResponse> {
  try {
    const response = await fetch('/api/captura/credenciais', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar credenciais',
    };
  }
}

/**
 * Cliente API para captura de acervo geral
 */
function getApiErrorMessage(data: any, response: Response): string {
  if (data && typeof data.error === 'object' && data.error !== null) {
    return data.error.message ?? `Erro ${response.status}: ${response.statusText}`;
  }
  return (data && typeof data.error === 'string') ? data.error : `Erro ${response.status}: ${response.statusText}`;
}

export async function capturarAcervoGeral(
  params: BaseCapturaParams
): Promise<CapturaApiResponse<AcervoGeralResult>> {
  try {
    const response = await fetch('/api/captura/trt/acervo-geral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar acervo geral',
    };
  }
}

/**
 * Cliente API para captura de processos arquivados
 */
export async function capturarArquivados(
  params: BaseCapturaParams
): Promise<CapturaApiResponse<ArquivadosResult>> {
  try {
    const response = await fetch('/api/captura/trt/arquivados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar arquivados',
    };
  }
}

/**
 * Cliente API para captura de audiências
 */
export async function capturarAudiencias(
  params: AudienciasParams
): Promise<CapturaApiResponse<StartCaptureData>> {
  try {
    const response = await fetch('/api/captura/trt/audiencias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar audiências',
    };
  }
}

/**
 * Cliente API para captura de pendências de manifestação
 */
export async function capturarPendentes(
  params: PendentesParams
): Promise<CapturaApiResponse<PendentesResult>> {
  try {
    const response = await fetch('/api/captura/trt/pendentes-manifestacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar pendências',
    };
  }
}

/**
 * Cliente API para captura de partes
 */
export async function capturarPartes(
  params: CapturaPartesParams
): Promise<CapturaApiResponse<CapturaPartesResult>> {
  try {
    const response = await fetch('/api/captura/trt/partes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar partes',
    };
  }
}

/**
 * Cliente API para captura de timeline de processo
 */
export async function capturarTimeline(
  params: TimelineParams
): Promise<CapturaApiResponse<TimelineResult>> {
  try {
    const response = await fetch('/api/captura/trt/timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao capturar timeline',
    };
  }
}

/**
 * Lista de códigos TRT disponíveis
 */
export const TRT_CODIGOS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Lista de graus disponíveis
 */
export const GRAUS: { value: GrauTRT; label: string }[] = [
  { value: 'primeiro_grau', label: 'Primeiro Grau' },
  { value: 'segundo_grau', label: 'Segundo Grau' },
];

/**
 * Lista de filtros de prazo para pendências
 */
export const FILTROS_PRAZO: { value: FiltroPrazoPendentes; label: string }[] = [
  { value: 'sem_prazo', label: 'Sem Prazo' },
  { value: 'no_prazo', label: 'No Prazo' },
];

/**
 * Buscar registro de captura por ID
 */
export async function buscarCapturaLog(id: number): Promise<CapturaApiResponse> {
  try {
    const response = await fetch(`/api/captura/historico/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar captura',
    };
  }
}

/**
 * Deletar registro de captura por ID
 */
export async function deletarCapturaLog(id: number): Promise<CapturaApiResponse> {
  try {
    const response = await fetch(`/api/captura/historico/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar captura',
    };
  }
}

// ============================================================================
// Recovery APIs - Recuperacao de dados do MongoDB
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
 * Listar logs de recovery do MongoDB
 */
export async function listarRecoveryLogs(
  params: ListarRecoveryLogsParams = {}
): Promise<ListarRecoveryLogsResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (params.capturaLogId !== undefined) {
      searchParams.set('captura_log_id', params.capturaLogId.toString());
    }
    if (params.tipoCaptura) {
      searchParams.set('tipo_captura', params.tipoCaptura);
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.trt) {
      searchParams.set('trt', params.trt);
    }
    if (params.grau) {
      searchParams.set('grau', params.grau);
    }
    if (params.advogadoId !== undefined) {
      searchParams.set('advogado_id', params.advogadoId.toString());
    }
    if (params.dataInicio) {
      searchParams.set('data_inicio', params.dataInicio);
    }
    if (params.dataFim) {
      searchParams.set('data_fim', params.dataFim);
    }
    if (params.pagina !== undefined) {
      searchParams.set('pagina', params.pagina.toString());
    }
    if (params.limite !== undefined) {
      searchParams.set('limite', params.limite.toString());
    }
    if (params.incluirEstatisticas) {
      searchParams.set('incluir_estatisticas', 'true');
    }

    const response = await fetch(`/api/captura/recovery?${searchParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar logs de recovery',
    };
  }
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
 * Buscar analise de recovery por MongoDB ID
 */
export async function buscarRecoveryAnalise(
  mongoId: string,
  options: { analisarGaps?: boolean; incluirPayload?: boolean } = {}
): Promise<RecoveryAnaliseResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (options.analisarGaps !== false) {
      searchParams.set('analisar_gaps', 'true');
    }
    if (options.incluirPayload) {
      searchParams.set('incluir_payload', 'true');
    }

    const response = await fetch(`/api/captura/recovery/${mongoId}?${searchParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar analise de recovery',
    };
  }
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
}

/**
 * Resposta do re-processamento
 */
export interface ReprocessarResponse {
  success: boolean;
  data?: ReprocessarResult;
  error?: string;
}

/**
 * Re-processar elementos de recovery
 */
export async function reprocessarRecovery(
  params: ReprocessarParams
): Promise<ReprocessarResponse> {
  try {
    const response = await fetch('/api/captura/recovery/reprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: getApiErrorMessage(data, response),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao re-processar elementos',
    };
  }
}