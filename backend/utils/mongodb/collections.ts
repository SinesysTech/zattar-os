/**
 * Definições de coleções do MongoDB
 * 
 * Centraliza acesso às coleções e garante tipagem correta.
 */

import { Collection } from 'mongodb';
import { getMongoDatabase } from './client';
import type { TimelineDocument } from '@/backend/types/mongodb/timeline';
import type { CapturaRawLogDocument } from '@/backend/types/mongodb/captura-log';

/**
 * Nomes das coleções MongoDB
 */
export const COLLECTIONS = {
  TIMELINE: 'timeline',
  CAPTURA_RAW_LOGS: 'captura_logs_brutos',
} as const;

/**
 * Obtém a coleção de timeline
 */
export async function getTimelineCollection(): Promise<Collection<TimelineDocument>> {
  const db = await getMongoDatabase();
  return db.collection<TimelineDocument>(COLLECTIONS.TIMELINE);
}

/**
 * Obtém a coleção de logs brutos de captura
 */
export async function getCapturaRawLogsCollection(): Promise<Collection<CapturaRawLogDocument>> {
  const db = await getMongoDatabase();
  return db.collection<CapturaRawLogDocument>(COLLECTIONS.CAPTURA_RAW_LOGS);
}

/**
 * Cria índices nas coleções
 * Deve ser executado na inicialização ou via script de setup
 */
export async function createMongoIndexes(): Promise<void> {
  console.log('📊 [MongoDB] Criando índices...');

  const timelineCollection = await getTimelineCollection();
  const capturaLogsCollection = await getCapturaRawLogsCollection();

  // Índice único por processoId + trtCodigo + grau
  await timelineCollection.createIndex(
    { processoId: 1, trtCodigo: 1, grau: 1 },
    { 
      unique: true,
      name: 'idx_processo_trt_grau' 
    }
  );

  // Índice por data de captura (para queries temporais)
  await timelineCollection.createIndex(
    { capturadoEm: -1 },
    { name: 'idx_capturado_em' }
  );

  // Índice por TRT (para queries por tribunal)
  await timelineCollection.createIndex(
    { trtCodigo: 1 },
    { name: 'idx_trt_codigo' }
  );

  // Índices para logs brutos de captura
  await capturaLogsCollection.createIndex(
    { captura_log_id: 1 },
    { name: 'idx_captura_log_id' }
  );

  await capturaLogsCollection.createIndex(
    { tipo_captura: 1, criado_em: -1 },
    { name: 'idx_tipo_captura_criado_em' }
  );

  await capturaLogsCollection.createIndex(
    { criado_em: -1 },
    { name: 'idx_criado_em_desc' }
  );

  console.log('✅ [MongoDB] Índices criados com sucesso');
}
