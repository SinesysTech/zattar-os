/**
 * Comunica CNJ Types
 * Tipos para integração com a API pública do Comunica CNJ
 */

import type { Tables } from '@/lib/types/database';

type Advogado = Tables<'Advogado'>['Row'];
type ComunicacaoCNJ = Tables<'ComunicacaoCNJ'>['Row'];
type ComunicacaoExecution = Tables<'ComunicacaoExecution'>['Row'];
type ComunicacaoSchedule = Tables<'ComunicacaoSchedule'>['Row'];

/**
 * Meio de comunicação
 */
export enum MeioComunicacao {
  EDITAL = 'E',
  DIARIO_ELETRONICO = 'D',
}

/**
 * Modo de agendamento
 */
export enum ComunicacaoScheduleMode {
  ADVOGADOS_CADASTRADOS = 'advogados_cadastrados',
  PARAMETROS_CUSTOMIZADOS = 'parametros_customizados',
  MANUAL = 'manual',
}

/**
 * Status de execução
 */
export enum ComunicacaoExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Labels amigáveis para meios de comunicação
 */
export const MEIO_LABELS: Record<MeioComunicacao, string> = {
  [MeioComunicacao.EDITAL]: 'Edital',
  [MeioComunicacao.DIARIO_ELETRONICO]: 'Diário Eletrônico',
};

/**
 * Labels para modos de agendamento
 */
export const SCHEDULE_MODE_LABELS: Record<ComunicacaoScheduleMode, string> = {
  [ComunicacaoScheduleMode.ADVOGADOS_CADASTRADOS]: 'Advogados Cadastrados',
  [ComunicacaoScheduleMode.PARAMETROS_CUSTOMIZADOS]: 'Parâmetros Customizados',
  [ComunicacaoScheduleMode.MANUAL]: 'Busca Manual',
};

/**
 * Labels para status de execução
 */
export const EXECUTION_STATUS_LABELS: Record<ComunicacaoExecutionStatus, string> = {
  [ComunicacaoExecutionStatus.PENDING]: 'Pendente',
  [ComunicacaoExecutionStatus.RUNNING]: 'Em Execução',
  [ComunicacaoExecutionStatus.COMPLETED]: 'Concluído',
  [ComunicacaoExecutionStatus.FAILED]: 'Falhou',
};

/**
 * Parâmetros de busca da API externa
 */
export interface ComunicacaoAPIParams {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number; // Busca por número de comunicação específico
  dataInicio?: string; // formato: yyyy-mm-dd
  dataFim?: string; // formato: yyyy-mm-dd
  meio?: MeioComunicacao;
  orgaoId?: number; // ID do órgão judicial (API Comunica CNJ)
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
 * Item de comunicação retornado pela API (estrutura completa)
 */
export interface ComunicacaoItem {
  // IDs e identificadores
  id: number; // ID da comunicação na API
  hash: string; // Hash único para certidão

  // Dados do processo
  numeroProcesso: string; // número sem máscara
  numeroProcessoComMascara: string; // número formatado (0000000-00.0000.0.00.0000)
  siglaTribunal: string;
  nomeClasse: string; // ex: "RECURSO ORDINÁRIO - RITO SUMARÍSSIMO"
  codigoClasse: string;

  // Dados da comunicação
  tipoComunicacao: string; // "Intimação", "Lista de distribuição", etc.
  tipoDocumento: string; // "Notificação", "Distribuição", etc.
  numeroComunicacao: number;
  texto: string;
  link: string; // Link para visualização no PJE

  // Dados do órgão
  nomeOrgao: string; // ex: "5ª VARA DO TRABALHO DE BELO HORIZONTE"
  idOrgao: number;

  // Datas
  dataDisponibilizacao: string; // yyyy-mm-dd
  dataDisponibilizacaoFormatada: string; // dd/mm/yyyy
  dataCancelamento?: string | null;

  // Meio de comunicação
  meio: MeioComunicacao;
  meioCompleto: string; // "Diário de Justiça Eletrônico Nacional"

  // Status
  ativo: boolean;
  status: string; // "P" (Publicado)
  motivoCancelamento?: string | null;

  // Arrays estruturados
  destinatarios: ComunicacaoDestinatario[]; // Partes do processo
  destinatarioAdvogados: ComunicacaoDestinatarioAdvogado[]; // Advogados

  // Campos derivados/calculados (para facilitar exibição)
  partesAutoras?: string[]; // Nomes das partes autoras
  partesReus?: string[]; // Nomes das partes rés
  advogados?: string[]; // Nomes dos advogados
  advogadosOab?: string[]; // OABs formatadas (ex: "128404/MG")
}

/**
 * Metadados de paginação da API
 */
export interface ComunicacaoPaginationMetadata {
  pagina: number;
  itensPorPagina: number;
  total: number;
  totalPaginas: number;
}

/**
 * Resposta da API de consulta
 */
export interface ComunicacaoAPIResponse {
  comunicacoes: ComunicacaoItem[];
  paginacao: ComunicacaoPaginationMetadata;
}

/**
 * Informações de tribunal retornadas pela API
 */
export interface TribunalCNJInfo {
  id: string;
  nome: string;
  sigla: string;
  jurisdicao: string;
  ultimaAtualizacao?: string; // ISO datetime string
}

/**
 * Resposta bruta da API do caderno
 */
export interface CadernoMetadataAPI {
  sigla_tribunal?: string;
  sigla?: string;
  tribunal?: string;
  meio: MeioComunicacao;
  data: string; // yyyy-mm-dd
  total_comunicacoes?: number;
  totalComunicacoes?: number;
  url: string; // URL temporária (válida por 5 minutos)
  expires_at?: string; // ISO datetime string
  expiresAt?: string; // ISO datetime string
}

/**
 * Metadados do caderno compactado (shape normalizado)
 */
export interface CadernoMetadata {
  tribunal: string;
  sigla: string;
  meio: MeioComunicacao;
  data: string; // yyyy-mm-dd
  totalComunicacoes: number;
  url: string; // URL temporária (válida por 5 minutos)
  expiresAt: string; // ISO datetime string (calculado: agora + 5 minutos se não fornecido)
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt?: Date;
}

/**
 * ComunicacaoCNJ com relações incluídas
 */
export interface ComunicacaoCNJWithRelations extends ComunicacaoCNJ {
  advogado?: Advogado | null;
}

/**
 * ComunicacaoSchedule com relações incluídas
 */
export interface ComunicacaoScheduleWithRelations extends ComunicacaoSchedule {
  executions?: ComunicacaoExecution[];
}

/**
 * ComunicacaoExecution com relações incluídas
 */
export interface ComunicacaoExecutionWithRelations extends ComunicacaoExecution {
  schedule: ComunicacaoSchedule;
}

/**
 * Entrada para criação de agendamento
 */
export interface CreateComunicacaoScheduleInput {
  name: string;
  description?: string;
  modo: ComunicacaoScheduleMode;
  cronExpression: string;
  timezone?: string;
  active?: boolean;
  webhookEndpointId?: string;
  // Se modo = advogados_cadastrados
  advogadoIds?: string[];
  // Se modo = parametros_customizados
  configuracao?: {
    siglaTribunal?: string[];
    texto?: string;
    nomeParte?: string;
    nomeAdvogado?: string;
    numeroOab?: string;
    ufOab?: string;
    numeroProcesso?: string;
    dataInicio?: string;
    dataFim?: string;
    meio?: MeioComunicacao;
    itensPorPagina?: number;
  };
}

/**
 * Entrada para atualização de agendamento
 */
export interface UpdateComunicacaoScheduleInput {
  name?: string;
  description?: string;
  modo?: ComunicacaoScheduleMode;
  cronExpression?: string;
  timezone?: string;
  active?: boolean;
  webhookEndpointId?: string;
  advogadoIds?: string[];
  configuracao?: {
    siglaTribunal?: string[];
    texto?: string;
    nomeParte?: string;
    nomeAdvogado?: string;
    numeroOab?: string;
    ufOab?: string;
    numeroProcesso?: string;
    dataInicio?: string;
    dataFim?: string;
    meio?: MeioComunicacao;
    itensPorPagina?: number;
  };
}

/**
 * Filtros para busca manual
 */
export interface ComunicacaoSearchFilters {
  siglaTribunal?: string;
  texto?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  numeroOab?: string;
  ufOab?: string;
  numeroProcesso?: string;
  numeroComunicacao?: number; // Busca por número de comunicação específico
  orgaoId?: number; // ID do órgão judicial (API Comunica CNJ)
  dataInicio?: string;
  dataFim?: string;
  meio?: MeioComunicacao;
  pagina?: number;
  itensPorPagina?: number;
}

/**
 * Resultado paginado de comunicações da API externa (busca manual)
 */
export interface PaginatedComunicacoesAPI {
  comunicacoes: ComunicacaoItem[];
  paginacao: {
    pagina: number;
    itensPorPagina: number;
    total: number;
    totalPaginas: number;
  };
}

/**
 * Resultado paginado de comunicações do banco de dados
 */
export interface PaginatedComunicacoes {
  comunicacoes: ComunicacaoCNJWithRelations[];
  paginacao: {
    pagina: number;
    itensPorPagina: number;
    total: number;
    totalPaginas: number;
  };
}

/**
 * Filtros para listagem de agendamentos
 */
export interface ListComunicacaoSchedulesFilters {
  active?: boolean;
  modo?: ComunicacaoScheduleMode;
  page?: number;
  pageSize?: number;
}

/**
 * Resultado paginado de agendamentos
 */
export interface PaginatedComunicacaoSchedules {
  schedules: ComunicacaoScheduleWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filtros para listagem de execuções
 */
export interface ListComunicacaoExecutionsFilters {
  scheduleId?: string;
  status?: ComunicacaoExecutionStatus[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Resultado paginado de execuções
 */
export interface PaginatedComunicacaoExecutions {
  executions: ComunicacaoExecutionWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
