/**
 * Types e interfaces para o módulo de Conciliação Bancária
 * Sistema de Gestão Financeira (SGF)
 *
 * Conciliação Bancária permite importar extratos bancários (OFX/CSV)
 * e conciliar transações com lançamentos financeiros do sistema.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status da conciliação
 */
export type StatusConciliacao = 'pendente' | 'conciliado' | 'divergente' | 'ignorado';

/**
 * Tipo de conciliação (como foi conciliado)
 */
export type TipoConciliacao = 'automatica' | 'manual';

/**
 * Tipo de transação bancária
 */
export type TipoTransacaoBancaria = 'credito' | 'debito';

/**
 * Tipo de arquivo de extrato suportado
 */
export type TipoArquivoExtrato = 'ofx' | 'csv';

// ============================================================================
// Interfaces de Transação Parsed (saída dos parsers)
// ============================================================================

/**
 * Transação parseada de arquivo OFX/CSV
 * Estrutura intermediária antes de persistir no banco
 */
export interface TransacaoParsed {
  dataTransacao: string; // ISO date (YYYY-MM-DD)
  descricao: string;
  valor: number;
  tipoTransacao: TipoTransacaoBancaria;
  documento?: string; // FITID (OFX) ou referência (CSV)
  saldoExtrato?: number; // Saldo disponível no extrato
  dadosOriginais: Record<string, unknown>; // JSON completo do registro original
}

/**
 * Configuração para parsing de CSV
 */
export interface CSVConfig {
  dataCol?: string; // Nome da coluna de data
  descricaoCol?: string; // Nome da coluna de descrição
  valorCol?: string; // Nome da coluna de valor
  tipoCol?: string; // Nome da coluna de tipo (opcional)
  documentoCol?: string; // Nome da coluna de documento/referência
  saldoCol?: string; // Nome da coluna de saldo
  delimitador?: string; // Delimitador (auto-detectado se não fornecido)
  encoding?: BufferEncoding; // Encoding do arquivo (default: utf-8)
}

// ============================================================================
// Interfaces Principais
// ============================================================================

/**
 * Transação bancária importada de extrato
 */
export interface TransacaoBancariaImportada {
  id: number;
  contaBancariaId: number;
  dataTransacao: string;
  descricao: string;
  valor: number;
  tipoTransacao: TipoTransacaoBancaria;
  documento: string | null;
  saldoExtrato: number | null;
  dadosOriginais: Record<string, unknown>;
  hashTransacao: string; // Hash para detecção de duplicatas
  arquivoImportacao: string; // Nome do arquivo importado
  createdBy: number;
  createdAt: string;
}

/**
 * Conciliação bancária (vínculo entre transação e lançamento)
 */
export interface ConciliacaoBancaria {
  id: number;
  transacaoImportadaId: number;
  lancamentoFinanceiroId: number | null;
  status: StatusConciliacao;
  tipoConciliacao: TipoConciliacao | null;
  scoreSimilaridade: number | null; // 0-100
  observacoes: string | null;
  dadosAdicionais: Record<string, unknown> | null; // Sugestões salvas, etc.
  conciliadoPor: number | null;
  dataConciliacao: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados resumidos de conta bancária
 */
export interface ContaBancariaResumo {
  id: number;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
}

/**
 * Dados resumidos de lançamento financeiro
 */
export interface LancamentoFinanceiroResumo {
  id: number;
  descricao: string;
  valor: number;
  dataLancamento: string;
  dataVencimento: string | null;
  tipo: 'receita' | 'despesa';
  status: string;
  contaBancariaId?: number | null;
  contaContabilNome?: string;
  centroCustoNome?: string;
}

/**
 * Transação importada com dados de conciliação
 */
export interface TransacaoComConciliacao extends TransacaoBancariaImportada {
  contaBancaria?: ContaBancariaResumo;
  conciliacao?: ConciliacaoBancaria;
  lancamentoVinculado?: LancamentoFinanceiroResumo;
}

/**
 * Sugestão de conciliação automática
 */
export interface SugestaoConciliacao {
  lancamentoId: number;
  lancamento: LancamentoFinanceiroResumo;
  score: number; // 0-100
  motivo: string; // Ex: "Valor e data exatos"
  diferencas: string[]; // Ex: ["Descrição parcialmente diferente", "Data difere em 2 dias"]
  detalhesScore: {
    valorScore: number;
    dataScore: number;
    descricaoScore: number;
  };
}

/**
 * Resultado de conciliação automática
 */
export interface ConciliacaoResult {
  transacaoId: number;
  conciliada: boolean;
  score: number | null;
  lancamentoId: number | null;
  tipoConciliacao: TipoConciliacao | null;
  motivo?: string;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para importar extrato bancário
 */
export interface ImportarExtratoDTO {
  contaBancariaId: number;
  tipoArquivo: TipoArquivoExtrato;
  arquivo: Buffer | ArrayBuffer | File | Blob;
  nomeArquivo: string;
  configCSV?: CSVConfig;
}

/**
 * DTO para conciliação manual
 */
export interface ConciliarManualDTO {
  transacaoImportadaId: number;
  lancamentoFinanceiroId?: number | null; // null = marcar como ignorado
  observacoes?: string;
}

/**
 * DTO para conciliação automática
 */
export interface ConciliarAutomaticaDTO {
  contaBancariaId?: number;
  dataInicio?: string;
  dataFim?: string;
  scoreMinimo?: number; // default: 70
}

/**
 * Parâmetros para listagem de transações importadas
 */
export interface ListarTransacoesImportadasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  contaBancariaId?: number;
  dataInicio?: string;
  dataFim?: string;
  statusConciliacao?: StatusConciliacao | StatusConciliacao[];
  tipoTransacao?: TipoTransacaoBancaria;
  ordenarPor?: 'data_transacao' | 'valor' | 'descricao' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Parâmetros para busca de lançamentos candidatos
 */
export interface BuscarLancamentosCandidatosParams {
  contaBancariaId?: number;
  dataInicio: string;
  dataFim: string;
  tipo: 'receita' | 'despesa';
  busca?: string;
  limite?: number;
}

/**
 * Parâmetros para busca manual de lançamentos
 */
export interface BuscarLancamentosManuaisParams {
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  contaBancariaId?: number;
  tipo?: 'receita' | 'despesa';
  limite?: number;
}

// ============================================================================
// Responses
// ============================================================================

/**
 * Resposta de importação de extrato
 */
export interface ImportarExtratoResponse {
  sucesso: boolean;
  transacoesImportadas: number;
  duplicatasIgnoradas: number;
  erros: Array<{
    linha?: number;
    mensagem: string;
    dados?: Record<string, unknown>;
  }>;
  detalhes?: {
    arquivoNome: string;
    tipoArquivo: TipoArquivoExtrato;
    contaBancariaId: number;
    dataImportacao: string;
  };
}

/**
 * Resposta de conciliação
 */
export interface ConciliacaoResponse {
  sucesso: boolean;
  conciliacao: ConciliacaoBancaria;
  transacao?: TransacaoComConciliacao;
  sugestoes?: SugestaoConciliacao[];
}

/**
 * Resumo de conciliações
 */
export interface ResumoConciliacoes {
  totalPendentes: number;
  totalConciliadas: number;
  totalDivergentes: number;
  totalIgnoradas: number;
  valorTotalPendentes: number;
  valorTotalConciliadas: number;
}

/**
 * Resposta de listagem de transações
 */
export interface ListarTransacoesResponse {
  items: TransacaoComConciliacao[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo: ResumoConciliacoes;
}

/**
 * Resposta de conciliação automática
 */
export interface ConciliarAutomaticaResponse {
  sucesso: boolean;
  resultados: ConciliacaoResult[];
  resumo: {
    totalProcessadas: number;
    conciliadasAutomaticamente: number;
    comSugestoes: number;
    semCorrespondencia: number;
  };
}

// ============================================================================
// Validadores e Type Guards
// ============================================================================

/**
 * Type guard para verificar se é uma TransacaoBancariaImportada válida
 */
export const isTransacaoBancariaImportada = (obj: unknown): obj is TransacaoBancariaImportada => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'contaBancariaId' in obj &&
    'dataTransacao' in obj &&
    'descricao' in obj &&
    'valor' in obj &&
    'tipoTransacao' in obj &&
    'hashTransacao' in obj
  );
};

/**
 * Validar dados de importação de extrato
 */
export const validarImportarExtratoDTO = (data: unknown): data is ImportarExtratoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as ImportarExtratoDTO;

  if (typeof dto.contaBancariaId !== 'number' || dto.contaBancariaId <= 0) {
    return false;
  }
  if (!isTipoArquivoValido(dto.tipoArquivo)) {
    return false;
  }
  if (!dto.arquivo || !dto.nomeArquivo) {
    return false;
  }

  return true;
};

/**
 * Validar dados de conciliação manual
 */
export const validarConciliarManualDTO = (data: unknown): data is ConciliarManualDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as ConciliarManualDTO;

  if (typeof dto.transacaoImportadaId !== 'number' || dto.transacaoImportadaId <= 0) {
    return false;
  }
  // lancamentoFinanceiroId pode ser null (ignorar) ou number > 0
  if (
    dto.lancamentoFinanceiroId !== undefined &&
    dto.lancamentoFinanceiroId !== null &&
    (typeof dto.lancamentoFinanceiroId !== 'number' || dto.lancamentoFinanceiroId <= 0)
  ) {
    return false;
  }

  return true;
};

/**
 * Validar dados de conciliação automática
 */
export const validarConciliarAutomaticaDTO = (data: unknown): data is ConciliarAutomaticaDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as ConciliarAutomaticaDTO;

  // Todos os campos são opcionais, mas se fornecidos devem ser válidos
  if (dto.contaBancariaId !== undefined && typeof dto.contaBancariaId !== 'number') {
    return false;
  }
  if (dto.scoreMinimo !== undefined && (typeof dto.scoreMinimo !== 'number' || dto.scoreMinimo < 0 || dto.scoreMinimo > 100)) {
    return false;
  }

  return true;
};

// ============================================================================
// Helpers de Validação
// ============================================================================

const STATUS_CONCILIACAO_VALIDOS: StatusConciliacao[] = ['pendente', 'conciliado', 'divergente', 'ignorado'];
const TIPOS_CONCILIACAO_VALIDOS: TipoConciliacao[] = ['automatica', 'manual'];
const TIPOS_TRANSACAO_VALIDOS: TipoTransacaoBancaria[] = ['credito', 'debito'];
const TIPOS_ARQUIVO_VALIDOS: TipoArquivoExtrato[] = ['ofx', 'csv'];

export const isStatusConciliacaoValido = (status: unknown): status is StatusConciliacao => {
  return typeof status === 'string' && STATUS_CONCILIACAO_VALIDOS.includes(status as StatusConciliacao);
};

export const isTipoConciliacaoValido = (tipo: unknown): tipo is TipoConciliacao => {
  return typeof tipo === 'string' && TIPOS_CONCILIACAO_VALIDOS.includes(tipo as TipoConciliacao);
};

export const isTipoTransacaoValido = (tipo: unknown): tipo is TipoTransacaoBancaria => {
  return typeof tipo === 'string' && TIPOS_TRANSACAO_VALIDOS.includes(tipo as TipoTransacaoBancaria);
};

export const isTipoArquivoValido = (tipo: unknown): tipo is TipoArquivoExtrato => {
  return typeof tipo === 'string' && TIPOS_ARQUIVO_VALIDOS.includes(tipo as TipoArquivoExtrato);
};

// ============================================================================
// Labels para UI
// ============================================================================

export const STATUS_CONCILIACAO_LABELS: Record<StatusConciliacao, string> = {
  pendente: 'Pendente',
  conciliado: 'Conciliado',
  divergente: 'Divergente',
  ignorado: 'Ignorado',
};

export const TIPO_CONCILIACAO_LABELS: Record<TipoConciliacao, string> = {
  automatica: 'Automática',
  manual: 'Manual',
};

export const TIPO_TRANSACAO_LABELS: Record<TipoTransacaoBancaria, string> = {
  credito: 'Crédito',
  debito: 'Débito',
};

export const TIPO_ARQUIVO_LABELS: Record<TipoArquivoExtrato, string> = {
  ofx: 'OFX (Open Financial Exchange)',
  csv: 'CSV (Comma Separated Values)',
};

/**
 * Cores para badges de status
 */
export const STATUS_CONCILIACAO_COLORS: Record<StatusConciliacao, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pendente: 'warning',
  conciliado: 'success',
  divergente: 'danger',
  ignorado: 'neutral',
};

/**
 * Cores para badges de tipo de transação
 */
export const TIPO_TRANSACAO_COLORS: Record<TipoTransacaoBancaria, 'success' | 'danger'> = {
  credito: 'success',
  debito: 'danger',
};

// ============================================================================
// Constantes de Configuração
// ============================================================================

/**
 * Score mínimo para conciliação automática (alta confiança)
 */
export const SCORE_CONCILIACAO_AUTOMATICA = 90;

/**
 * Score mínimo para exibir sugestões
 */
export const SCORE_MINIMO_SUGESTOES = 70;

/**
 * Janela de dias para busca de candidatos
 */
export const JANELA_DIAS_BUSCA_CANDIDATOS = 7;

/**
 * Máximo de sugestões a retornar
 */
export const MAX_SUGESTOES = 5;

/**
 * Tamanho máximo de arquivo de extrato (10MB)
 */
export const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024;

/**
 * Extensões de arquivo permitidas
 */
export const EXTENSOES_PERMITIDAS = ['.ofx', '.csv', '.txt'];

// ============================================================================
// Helpers de Score
// ============================================================================

/**
 * Classifica o score em categorias
 */
export const classificarScore = (score: number): 'alta' | 'media' | 'baixa' => {
  if (score >= 90) return 'alta';
  if (score >= 70) return 'media';
  return 'baixa';
};

/**
 * Cor do score para UI
 */
export const corScore = (score: number): 'success' | 'warning' | 'neutral' => {
  if (score >= 80) return 'success';
  if (score >= 70) return 'warning';
  return 'neutral';
};
