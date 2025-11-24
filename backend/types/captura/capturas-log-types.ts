/**
 * Tipos para histórico de capturas
 */

/**
 * Tipos de captura disponíveis
 */
export type TipoCaptura = 'acervo_geral' | 'arquivados' | 'audiencias' | 'pendentes' | 'partes';

/**
 * Status de uma captura
 */
export type StatusCaptura = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Registro de histórico de captura
 */
export interface CapturaLog {
  id: number;
  tipo_captura: TipoCaptura;
  advogado_id: number | null;
  credencial_ids: number[];
  status: StatusCaptura;
  resultado: Record<string, unknown> | null;
  erro: string | null;
  iniciado_em: string; // ISO timestamp
  concluido_em: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
}

/**
 * Dados para criar um novo registro de captura
 */
export interface CriarCapturaLogParams {
  tipo_captura: TipoCaptura;
  advogado_id: number;
  credencial_ids: number[];
  status?: StatusCaptura; // Default: 'pending'
}

/**
 * Dados para atualizar um registro de captura
 */
export interface AtualizarCapturaLogParams {
  status?: StatusCaptura;
  resultado?: Record<string, unknown> | null;
  erro?: string | null;
  concluido_em?: string | null; // ISO timestamp
}

/**
 * Parâmetros para listar histórico de capturas
 */
export interface ListarCapturasLogParams {
  pagina?: number;
  limite?: number;
  tipo_captura?: TipoCaptura;
  advogado_id?: number;
  status?: StatusCaptura;
  data_inicio?: string; // ISO date string (YYYY-MM-DD)
  data_fim?: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Resultado da listagem de histórico
 */
export interface ListarCapturasLogResult {
  capturas: CapturaLog[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
