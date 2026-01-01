import type { CodigoTRT, GrauTRT, TipoCaptura } from '../domain';
import type { LogEntry } from '../services/persistence/capture-log.service';

export type StatusCapturaRaw = 'success' | 'error';

/**
 * Log bruto de captura (persistido no Postgres).
 * Cada registro representa um processo capturado ou erro ocorrido, com payload bruto para auditoria/reprocessamento.
 */
export interface CapturaRawLog {
  /** Identificador estável do log bruto (string). */
  raw_log_id: string;

  /**
   * ID do log de captura no Postgres (tabela capturas_log).
   * Pode ser -1 quando o erro ocorreu antes de criar o log em capturas_log.
   */
  captura_log_id: number;

  tipo_captura: TipoCaptura | string;
  advogado_id: number;
  credencial_id: number;
  credencial_ids?: number[];
  trt: CodigoTRT;
  grau: GrauTRT;
  status: StatusCapturaRaw;
  requisicao?: Record<string, unknown>;
  payload_bruto?: unknown;
  resultado_processado?: unknown;
  logs?: LogEntry[];
  erro?: string | null;
  criado_em: string; // ISO
  atualizado_em: string; // ISO
}

export type CapturaRawLogCreate = Omit<CapturaRawLog, 'criado_em' | 'atualizado_em'> & {
  criado_em?: string;
  atualizado_em?: string;
};


