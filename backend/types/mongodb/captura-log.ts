import type { ObjectId } from 'mongodb';
import type { TipoCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import type { LogEntry } from '@/backend/captura/services/persistence/capture-log.service';

export type StatusCapturaRaw = 'success' | 'error';

export interface CapturaRawLogDocument {
  _id?: ObjectId;
  captura_log_id?: number | null;
  tipo_captura: TipoCaptura;
  advogado_id?: number | null;
  credencial_id?: number | null;
  credencial_ids?: number[];
  trt?: CodigoTRT;
  grau?: GrauTRT;
  status: StatusCapturaRaw;
  requisicao?: Record<string, unknown>;
  payload_bruto?: unknown;
  resultado_processado?: unknown;
  logs?: LogEntry[];
  erro?: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

export type CapturaRawLogCreate = Omit<CapturaRawLogDocument, '_id'>;

