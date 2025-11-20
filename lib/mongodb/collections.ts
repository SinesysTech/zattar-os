/**
 * Definições de coleções do MongoDB
 * 
 * Centraliza acesso às coleções e garante tipagem correta.
 */

import { Collection } from 'mongodb';
import { getMongoDatabase } from './client';
import type { TimelineDocument } from '@/backend/types/mongodb/timeline';

/**
 * Nomes das coleções MongoDB
 */
export const COLLECTIONS = {
  TIMELINE: 'timeline',
} as const;

/**
 * Obtém a coleção de timeline
 */
export async function getTimelineCollection(): Promise<Collection<TimelineDocument>> {
  const db = await getMongoDatabase();
  return db.collection<TimelineDocument>(COLLECTIONS.TIMELINE);
}

/**
 * Cria índices nas coleções
 * Deve ser executado na inicialização ou via script de setup
 */
export async function createMongoIndexes(): Promise<void> {
  console.log('📊 [MongoDB] Criando índices...');

  const timelineCollection = await getTimelineCollection();

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

  console.log('✅ [MongoDB] Índices criados com sucesso');
}
