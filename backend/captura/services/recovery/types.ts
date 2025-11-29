/**
 * Tipos para o serviço de recuperação de capturas do MongoDB
 *
 * PROPÓSITO:
 * Define tipos para recuperação de logs de captura e re-persistência
 * de elementos que falharam (endereços, partes, representantes).
 */

import type { TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import type { StatusCapturaRaw } from '@/backend/types/mongodb/captura-log';

// ============================================================================
// Tipos de Elementos Recuperáveis
// ============================================================================

/**
 * Tipos de entidades que podem ser re-persistidas a partir do payload bruto
 */
export type TipoEntidadeRecuperavel =
  | 'endereco'
  | 'parte'
  | 'representante'
  | 'cadastro_pje';

/**
 * Status de persistência de um elemento
 */
export type StatusPersistencia = 'pendente' | 'existente' | 'faltando' | 'erro';

/**
 * Elemento individual que pode ser recuperado do payload bruto
 */
export interface ElementoRecuperavel {
  /** Tipo da entidade */
  tipo: TipoEntidadeRecuperavel;

  /** Identificador único (CPF/CNPJ para partes, id_pje para endereços) */
  identificador: string;

  /** Nome descritivo (nome da parte ou "Endereço de {nome}") */
  nome: string;

  /** Dados brutos extraídos do payload_bruto do MongoDB */
  dadosBrutos: Record<string, unknown>;

  /** Status atual de persistência no PostgreSQL */
  statusPersistencia: StatusPersistencia;

  /** Mensagem de erro se statusPersistencia === 'erro' */
  erro?: string;

  /** Informações adicionais de contexto */
  contexto?: {
    /** ID da entidade no PostgreSQL (se existente) */
    entidadeId?: number;
    /** Tipo da entidade (cliente, parte_contraria, terceiro) */
    entidadeTipo?: string;
    /** ID do endereço no PostgreSQL (se existente) */
    enderecoId?: number;
  };
}

// ============================================================================
// Análise de Captura
// ============================================================================

/**
 * Informações do processo relacionado à captura
 */
export interface ProcessoRecovery {
  /** ID do processo na tabela acervo (pode ser null se não persistido) */
  id: number | null;
  /** ID do processo no PJE */
  idPje: number;
  /** Número CNJ do processo */
  numeroProcesso: string;
  /** Tribunal Regional do Trabalho */
  trt: CodigoTRT;
  /** Grau do tribunal */
  grau: GrauTRT;
}

/**
 * Totais de elementos encontrados vs persistidos
 */
export interface TotaisAnalise {
  /** Total de partes no payload bruto */
  partes: number;
  /** Total de partes persistidas no PostgreSQL */
  partesPersistidas: number;
  /** Total de endereços esperados (partes com endereço no payload) */
  enderecosEsperados: number;
  /** Total de endereços persistidos no PostgreSQL */
  enderecosPersistidos: number;
  /** Total de representantes no payload bruto */
  representantes: number;
  /** Total de representantes persistidos no PostgreSQL */
  representantesPersistidos: number;
}

/**
 * Gaps identificados (elementos faltantes no PostgreSQL)
 */
export interface GapsAnalise {
  /** Endereços presentes no payload mas não no PostgreSQL */
  enderecosFaltantes: ElementoRecuperavel[];
  /** Partes presentes no payload mas não no PostgreSQL */
  partesFaltantes: ElementoRecuperavel[];
  /** Representantes presentes no payload mas não no PostgreSQL */
  representantesFaltantes: ElementoRecuperavel[];
}

/**
 * Resultado completo da análise de uma captura
 */
export interface AnaliseCaptura {
  /** ID do documento no MongoDB */
  mongoId: string;
  /** ID do log de captura no PostgreSQL */
  capturaLogId: number;
  /** Tipo de captura */
  tipoCaptura: TipoCaptura;
  /** Data/hora da captura */
  dataCaptura: Date;
  /** Status da captura no MongoDB */
  status: StatusCapturaRaw;
  /** Informações do processo */
  processo: ProcessoRecovery;
  /** Totais de elementos */
  totais: TotaisAnalise;
  /** Gaps identificados */
  gaps: GapsAnalise;
  /** Se o payload bruto está disponível para re-processamento */
  payloadDisponivel: boolean;
  /** Mensagem de erro da captura original (se houver) */
  erroOriginal?: string | null;
}

// ============================================================================
// Parâmetros de Listagem
// ============================================================================

/**
 * Parâmetros para listar logs de captura do MongoDB
 */
export interface ListarLogsRecoveryParams {
  /** Número da página (1-based) */
  pagina?: number;
  /** Quantidade por página (max: 100) */
  limite?: number;
  /** Filtrar por ID do log no PostgreSQL */
  capturaLogId?: number;
  /** Filtrar por tipo de captura */
  tipoCaptura?: TipoCaptura;
  /** Filtrar por status no MongoDB */
  status?: StatusCapturaRaw;
  /** Filtrar por TRT */
  trt?: CodigoTRT;
  /** Filtrar por grau */
  grau?: GrauTRT;
  /** Filtrar por advogado */
  advogadoId?: number;
  /** Filtrar por data inicial (ISO string) */
  dataInicio?: string;
  /** Filtrar por data final (ISO string) */
  dataFim?: string;
  /** Filtrar apenas logs com gaps identificados */
  apenasComGaps?: boolean;
}

/**
 * Resultado da listagem de logs
 */
export interface ListarLogsRecoveryResult {
  /** Lista de logs do MongoDB (sem payload_bruto para performance) */
  logs: LogRecoverySumario[];
  /** Total de registros encontrados */
  total: number;
  /** Página atual */
  pagina: number;
  /** Limite por página */
  limite: number;
  /** Total de páginas */
  totalPaginas: number;
}

/**
 * Sumário de um log para listagem (sem payload_bruto)
 */
export interface LogRecoverySumario {
  /** ID do documento no MongoDB */
  mongoId: string;
  /** ID do log no PostgreSQL */
  capturaLogId: number;
  /** Tipo de captura */
  tipoCaptura: TipoCaptura;
  /** Status no MongoDB */
  status: StatusCapturaRaw;
  /** TRT */
  trt: CodigoTRT;
  /** Grau */
  grau: GrauTRT;
  /** ID do advogado */
  advogadoId: number;
  /** Data de criação */
  criadoEm: Date;
  /** Número do processo (se disponível) */
  numeroProcesso?: string;
  /** ID do processo no PJE (se disponível) */
  processoIdPje?: number;
  /** Erro da captura (se houver) */
  erro?: string | null;
  /** Indicador de gaps (se disponível) */
  possuiGaps?: boolean;
}

// ============================================================================
// Re-Processamento
// ============================================================================

/**
 * Parâmetros para re-processar elementos
 */
export interface ReprocessarParams {
  /** IDs dos documentos MongoDB a processar */
  mongoIds: string[];
  /** Tipos de elementos a re-processar (default: todos) */
  tiposElementos?: TipoEntidadeRecuperavel[];
  /** Filtros adicionais */
  filtros?: {
    /** Processar apenas elementos faltantes */
    apenasGaps?: boolean;
    /** Forçar atualização mesmo se existir */
    forcarAtualizacao?: boolean;
  };
}

/**
 * Resultado de re-processamento de um elemento individual
 */
export interface ResultadoElemento {
  /** Tipo do elemento */
  tipo: TipoEntidadeRecuperavel;
  /** Identificador do elemento */
  identificador: string;
  /** Nome descritivo */
  nome: string;
  /** Se foi processado com sucesso */
  sucesso: boolean;
  /** Ação realizada */
  acao: 'criado' | 'atualizado' | 'ignorado' | 'erro';
  /** Mensagem de erro (se acao === 'erro') */
  erro?: string;
  /** ID do registro criado/atualizado (se sucesso) */
  registroId?: number;
}

/**
 * Resultado de re-processamento de um documento MongoDB
 */
export interface ResultadoDocumento {
  /** ID do documento MongoDB */
  mongoId: string;
  /** Número do processo */
  numeroProcesso: string;
  /** Se todos os elementos foram processados com sucesso */
  sucesso: boolean;
  /** Total de elementos processados */
  totalProcessados: number;
  /** Total de sucessos */
  totalSucessos: number;
  /** Total de erros */
  totalErros: number;
  /** Resultados por elemento */
  elementos: ResultadoElemento[];
  /** Duração em ms */
  duracaoMs: number;
}

/**
 * Resultado completo de re-processamento
 */
export interface ReprocessarResult {
  /** Se a operação geral foi bem-sucedida */
  sucesso: boolean;
  /** Total de documentos processados */
  totalDocumentos: number;
  /** Total de elementos processados */
  totalElementos: number;
  /** Total de sucessos */
  totalSucessos: number;
  /** Total de erros */
  totalErros: number;
  /** Resultados por documento */
  documentos: ResultadoDocumento[];
  /** Duração total em ms */
  duracaoMs: number;
}

// ============================================================================
// Análise Agregada
// ============================================================================

/**
 * Parâmetros para análise agregada de gaps
 */
export interface AnaliseAgregadaParams {
  /** Filtrar por ID do log no PostgreSQL */
  capturaLogId?: number;
  /** Filtrar por tipo de captura */
  tipoCaptura?: TipoCaptura;
  /** Filtrar por data inicial */
  dataInicio?: string;
  /** Filtrar por data final */
  dataFim?: string;
  /** Filtrar por TRT */
  trt?: CodigoTRT;
  /** Filtrar por grau */
  grau?: GrauTRT;
}

/**
 * Resultado da análise agregada
 */
export interface AnaliseAgregadaResult {
  /** Total de logs analisados */
  totalLogs: number;
  /** Total de logs com gaps */
  logsComGaps: number;
  /** Resumo de gaps por tipo */
  resumoGaps: {
    enderecos: number;
    partes: number;
    representantes: number;
  };
  /** Top processos com mais gaps */
  topProcessosComGaps: Array<{
    numeroProcesso: string;
    trt: string;
    totalGaps: number;
  }>;
  /** Distribuição por TRT */
  distribuicaoPorTrt: Array<{
    trt: string;
    totalLogs: number;
    totalGaps: number;
  }>;
}

// ============================================================================
// Tipos Auxiliares (estrutura do payload PJE)
// ============================================================================

/**
 * Estrutura de endereço do PJE (payload bruto)
 */
export interface EnderecoPJEPayload {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  nroCep?: string;
  idMunicipio?: number;
  municipio?: string;
  municipioIbge?: string;
  estado?: {
    id?: number;
    sigla?: string;
    descricao?: string;
  };
  pais?: {
    id?: number;
    codigo?: string;
    descricao?: string;
  };
  classificacoesEndereco?: Array<{ codigo?: string; descricao?: string }>;
  correspondencia?: boolean;
  situacao?: string;
  idUsuarioCadastrador?: number;
  dtAlteracao?: string;
}

/**
 * Estrutura de parte do PJE (payload bruto simplificado)
 */
export interface PartePJEPayload {
  idParte?: number;
  idPessoa?: number;
  nome?: string;
  tipoDocumento?: 'CPF' | 'CNPJ';
  numeroDocumento?: string;
  polo?: string;
  tipoParte?: {
    id?: number;
    descricao?: string;
  };
  dadosCompletos?: {
    endereco?: EnderecoPJEPayload;
    [key: string]: unknown;
  };
  representantes?: RepresentantePJEPayload[];
}

/**
 * Estrutura de representante do PJE (payload bruto simplificado)
 */
export interface RepresentantePJEPayload {
  idRepresentante?: number;
  idPessoa?: number;
  nome?: string;
  tipoDocumento?: 'CPF' | 'CNPJ';
  numeroDocumento?: string;
  dadosCompletos?: {
    endereco?: EnderecoPJEPayload;
    [key: string]: unknown;
  };
}

