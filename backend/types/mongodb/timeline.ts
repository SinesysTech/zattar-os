/**
 * Tipos para documentos MongoDB - Timeline
 */

import type { ObjectId } from 'mongodb';
import type { TimelineItemEnriquecido } from '@/lib/api/pje-trt/types';

/**
 * Documento da timeline armazenado no MongoDB
 */
export interface TimelineDocument {
  /** ID do MongoDB */
  _id?: ObjectId;

  /** ID do processo no PJE */
  processoId: string;

  /** Código do TRT (ex: 'TRT3') */
  trtCodigo: string;

  /** Grau da instância */
  grau: string;

  /** Data/hora da captura */
  capturadoEm: Date;

  /** Timeline completa com dados enriquecidos */
  timeline: TimelineItemEnriquecido[];

  /** Metadados adicionais */
  metadata?: {
    /** ID do advogado que capturou */
    advogadoId?: number;
    /** Total de documentos na timeline */
    totalDocumentos: number;
    /** Total de movimentos na timeline */
    totalMovimentos: number;
    /** Total de documentos baixados para Google Drive */
    totalDocumentosBaixados: number;
    /** Versão do schema (para migrações futuras) */
    schemaVersion: number;
  };
}

/**
 * Resultado da inserção/atualização de timeline no MongoDB
 */
export interface TimelinePersistenceResult {
  /** ID do documento MongoDB */
  mongoId: string;
  /** Se foi criado (true) ou atualizado (false) */
  criado: boolean;
  /** Total de itens na timeline */
  totalItens: number;
}
