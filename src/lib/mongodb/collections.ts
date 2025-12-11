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
 * Deve ser executado na inicialização do app ou via script de setup para otimizar queries.
 * Índices compostos incluem 'criado_em' pois queries temporais são comuns (ex: "últimos 7 dias").
 * Índice de texto em 'erro' aumenta o tamanho da collection (~10-20%), mas melhora buscas eficientes por termos de erro.
 */
export async function createMongoIndexes(): Promise<void> {
  const startTime = performance.now();
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

  // Novos índices para otimizar queries comuns em captura_logs_brutos
  console.log('[MongoDB] Criando índice idx_status_criado_em...');
  await capturaLogsCollection.createIndex(
    { status: 1, criado_em: -1 },
    { name: 'idx_status_criado_em' }
  );

  console.log('[MongoDB] Criando índice idx_advogado_id_criado_em...');
  await capturaLogsCollection.createIndex(
    { advogado_id: 1, criado_em: -1 },
    { name: 'idx_advogado_id_criado_em' }
  );

  console.log('[MongoDB] Criando índice idx_credencial_id_criado_em...');
  await capturaLogsCollection.createIndex(
    { credencial_id: 1, criado_em: -1 },
    { name: 'idx_credencial_id_criado_em' }
  );

  console.log('[MongoDB] Criando índice idx_trt_grau_status_criado_em...');
  await capturaLogsCollection.createIndex(
    { trt: 1, grau: 1, status: 1, criado_em: -1 },
    { name: 'idx_trt_grau_status_criado_em' }
  );

  console.log('[MongoDB] Criando índice idx_erro_text...');
  await capturaLogsCollection.createIndex(
    { erro: 'text' },
    { name: 'idx_erro_text' }
  );

  const totalTime = Math.round(performance.now() - startTime);
  console.log(`✅ [MongoDB] Índices criados com sucesso em ${totalTime}ms`);
}
