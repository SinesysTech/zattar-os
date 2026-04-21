/**
 * Processos — Tipos de estatísticas (sem "use server").
 *
 * Extraído de service-estatisticas.ts porque arquivos "use server" não podem
 * exportar interfaces (Next.js 16 falha em runtime).
 */

export interface ProcessoStats {
  /** Total de processos únicos (acervo_unificado) */
  total: number;
  /** Processos em curso (origem = acervo_geral) */
  emCurso: number;
  /** Processos arquivados (origem = arquivado) */
  arquivados: number;
  /** Processos sem responsável atribuído */
  semResponsavel: number;
  /** Processos com audiência futura agendada */
  comAudienciaProxima: number;
  /** Processos com eventos pendentes (expedientes, audiências ou obrigações ativas) */
  comEventos: number;
  /** IDs dos processos com eventos pendentes — usado para filtragem client-side */
  processoIdsComEventos: number[];
}
