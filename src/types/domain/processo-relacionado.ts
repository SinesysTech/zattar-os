/**
 * Processo relacionado (dados mínimos para exibição em listagens)
 */
export interface ProcessoRelacionado {
  /** ID do processo na tabela acervo */
  processo_id: number;
  /** Número do processo (ex: 0000123-45.2023.5.03.0001) */
  numero_processo: string;
  /** Tipo de participação no processo */
  tipo_parte?: string;
  /** Polo processual */
  polo?: string;
}

/**
 * Entidade genérica com processos relacionados
 */
export interface EntidadeComProcessos {
  processos_relacionados?: ProcessoRelacionado[];
}
