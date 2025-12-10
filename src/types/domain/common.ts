// Tipos e enums de domínio compartilhados em toda a aplicação.

/**
 * Representa a estrutura de paginação para listagens.
 */
export interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

/**
 * Tipo de pessoa (Pessoa Física ou Pessoa Jurídica).
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Situação do registro no sistema PJE (Processo Judicial Eletrônico).
 * A: Ativo
 * I: Inativo
 * E: Excluído
 * H: Histórico
 */
export type SituacaoPJE = 'A' | 'I' | 'E' | 'H';

/**
 * Grau de jurisdição de um processo.
 * - `primeiro_grau`: Primeira instância (juízo de origem)
 * - `segundo_grau`: Segunda instância (tribunal regional)
 * - `tribunal_superior`: Instância superior (TST, STF, etc.)
 */
export type GrauProcesso = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Status de um processo judicial.
 */
export enum StatusProcesso {
  ATIVO = 'ATIVO',
  SUSPENSO = 'SUSPENSO',
  ARQUIVADO = 'ARQUIVADO',
  EXTINTO = 'EXTINTO',
  BAIXADO = 'BAIXADO',
  PENDENTE = 'PENDENTE',
  EM_RECURSO = 'EM_RECURSO',
  OUTRO = 'OUTRO',
}

