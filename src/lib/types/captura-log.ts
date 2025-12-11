import type { ObjectId } from 'mongodb';
import type { TipoCaptura } from '@/features/captura/types/capturas-log-types';
import type { CodigoTRT, GrauTRT } from '@/features/captura/types/trt-types';
import type { LogEntry } from '@/features/captura/services/persistence/capture-log.service';

export type StatusCapturaRaw = 'success' | 'error';

/**
 * Documento MongoDB para logs brutos de captura.
 * Cada documento representa um processo capturado ou erro ocorrido.
 */
export interface CapturaRawLogDocument {
  _id?: ObjectId;
  /**
   * ID do log de captura no PostgreSQL.
   * Sempre deve referenciar um log válido, exceto em erros antes de criar o log PostgreSQL (usar -1).
   */
  captura_log_id: number;
  tipo_captura: TipoCaptura;
  /**
   * ID do advogado associado à captura.
   * Sempre presente (usar -1 se não aplicável).
   */
  advogado_id: number;
  /**
   * ID da credencial usada na captura.
   * Sempre presente (usar -1 se múltiplas credenciais foram usadas).
   */
  credencial_id: number;
  credencial_ids?: number[];
  /**
   * Tribunal Regional do Trabalho (obrigatório para capturas TRT).
   */
  trt: CodigoTRT;
  /**
   * Grau do tribunal (obrigatório para capturas TRT).
   */
  grau: GrauTRT;
  status: StatusCapturaRaw;
  requisicao?: Record<string, unknown>;
  /**
   * JSON bruto retornado pelo PJE.
   * É null quando erro ocorre antes de chamar PJE (ex: autenticação).
   */
  payload_bruto?: unknown;
  resultado_processado?: unknown;
  /**
   * Logs estruturados seguindo o schema de LogEntry (importado de capture-log.service.ts).
   */
  logs?: LogEntry[];
  erro?: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

export type CapturaRawLogCreate = Omit<CapturaRawLogDocument, '_id'>;

/**
 * Interface para queries comuns em CapturaRawLogDocument.
 */
export interface CapturaRawLogQuery {
  /**
   * Buscar todos os documentos de uma captura específica.
   * @param id ID do log de captura no PostgreSQL.
   */
  porCapturaLogId(id: number): Promise<CapturaRawLogDocument[]>;

  /**
   * Filtrar documentos por status.
   * @param status Status da captura ('success' ou 'error').
   */
  porStatus(status: StatusCapturaRaw): Promise<CapturaRawLogDocument[]>;

  /**
   * Filtrar documentos por período.
   * @param inicio Data de início.
   * @param fim Data de fim.
   */
  porPeriodo(inicio: Date, fim: Date): Promise<CapturaRawLogDocument[]>;
}