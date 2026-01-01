// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCapturaRawLogsCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface MigrationOptions {
  dryRun: boolean;
  limit?: number;
  batchSize: number;
  maxRetries: number;
  startAfter?: string; // raw_log_id (string ObjectId) para retomar migração
}

interface MigrationStats {
  total: number;
  migrados: number;
  pulados: number;
  erros: number;
  tempoTotal: number;
}

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_RETRIES = 3;

function isObjectIdString(value: string): boolean {
  return ObjectId.isValid(value) && value.length === 24;
}

/**
 * Sanitiza valores para serem serializáveis em JSONB.
 * - BigInt => string (evita perda de precisão)
 * - Function/Symbol => undefined
 * - Date => mantém (supabase-js serializa)
 */
function sanitizarParaJSONB<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }

  if (typeof obj === 'function' || typeof obj === 'symbol') {
    return undefined as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizarParaJSONB(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    if (obj instanceof Date || Buffer.isBuffer(obj)) {
      return obj;
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const sv = sanitizarParaJSONB(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out as T;
  }

  return obj;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, baseDelay = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`⚠️  Tentativa ${i + 1}/${maxRetries} falhou. Aguardando ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Retry failed');
}

async function migrarBatch(
  docs: Array<Record<string, unknown>>,
  options: MigrationOptions,
  stats: MigrationStats
): Promise<void> {
  if (docs.length === 0) return;

  const supabase = createServiceClient();

  const payload = docs.map((doc) => {
    const _id = doc._id as ObjectId | undefined;
    const rawLogId = _id?.toString();

    if (!rawLogId) {
      stats.pulados++;
      return null;
    }

    const status = doc.status as string | undefined;
    if (status !== 'success' && status !== 'error') {
      stats.pulados++;
      console.warn(`⚠️  [Migração] Pulando raw_log_id=${rawLogId}: status inválido (${String(status)})`);
      return null;
    }

    const criadoEm = doc.criado_em as Date | string | undefined | null;
    const atualizadoEm = doc.atualizado_em as Date | string | undefined | null;

    return {
      raw_log_id: rawLogId,
      captura_log_id: (doc.captura_log_id as number) ?? -1,
      tipo_captura: doc.tipo_captura as string,
      advogado_id: (doc.advogado_id as number) ?? null,
      credencial_id: (doc.credencial_id as number) ?? null,
      credencial_ids: (doc.credencial_ids as number[]) ?? null,
      trt: (doc.trt as string) ?? null,
      grau: (doc.grau as string) ?? null,
      status,
      requisicao: sanitizarParaJSONB(doc.requisicao),
      payload_bruto: sanitizarParaJSONB(doc.payload_bruto),
      resultado_processado: sanitizarParaJSONB(doc.resultado_processado),
      logs: sanitizarParaJSONB(doc.logs),
      erro: (doc.erro as string) ?? null,
      // Importante: não enviar null para colunas NOT NULL (usa default now()).
      ...(criadoEm ? { criado_em: criadoEm } : {}),
      ...(atualizadoEm ? { atualizado_em: atualizadoEm } : {}),
    };
  }).filter(Boolean) as Array<Record<string, unknown>>;

  if (payload.length === 0) return;

  if (options.dryRun) {
    stats.migrados += payload.length;
    console.log(`🔍 [DRY-RUN] Batch preparado: ${payload.length} registros`);
    return;
  }

  await retryWithBackoff(async () => {
    const { error } = await supabase
      .from('captura_logs_brutos')
      .upsert(payload, { onConflict: 'raw_log_id' });

    if (error) {
      throw new Error(`Erro ao upsert batch no Postgres: ${error.message}`);
    }
  }, options.maxRetries);

  stats.migrados += payload.length;
}

async function migrarLogs(options: MigrationOptions): Promise<MigrationStats> {
  const startTime = Date.now();
  const stats: MigrationStats = {
    total: 0,
    migrados: 0,
    pulados: 0,
    erros: 0,
    tempoTotal: 0,
  };

  const collection = await getCapturaRawLogsCollection();

  const filter: Record<string, unknown> = {};
  if (options.startAfter) {
    if (!isObjectIdString(options.startAfter)) {
      throw new Error(`startAfter inválido (esperado ObjectId string): ${options.startAfter}`);
    }
    filter._id = { $gt: new ObjectId(options.startAfter) };
  }

  const totalMongo = await collection.countDocuments(filter);
  stats.total = options.limit ? Math.min(totalMongo, options.limit) : totalMongo;

  console.log('🚀 [Migração] Iniciando migração de logs brutos MongoDB → PostgreSQL');
  console.log(`📊 [Migração] Total (MongoDB) elegível: ${totalMongo}`);
  console.log(`📦 [Migração] Total a processar: ${stats.total}`);
  if (options.dryRun) console.log('🔍 [Migração] DRY-RUN ativado (nenhuma escrita no Postgres)');
  if (options.startAfter) console.log(`↪️  [Migração] Retomando após raw_log_id=${options.startAfter}`);

  let lastId: ObjectId | null = options.startAfter ? new ObjectId(options.startAfter) : null;

  while (true) {
    if (options.limit && stats.migrados + stats.pulados >= options.limit) break;

    const remaining = options.limit ? options.limit - (stats.migrados + stats.pulados) : options.batchSize;
    const limit = Math.min(options.batchSize, remaining);
    if (limit <= 0) break;

    const batchFilter: Record<string, unknown> = { ...filter };
    if (lastId) batchFilter._id = { $gt: lastId };

    const docs = await collection
      .find(batchFilter)
      .sort({ _id: 1 })
      .limit(limit)
      .toArray();

    if (docs.length === 0) break;

    try {
      await migrarBatch(docs as Array<Record<string, unknown>>, options, stats);
    } catch (e) {
      stats.erros += docs.length;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌ [Migração] Erro no batch (size=${docs.length}): ${msg}`);
    }

    lastId = (docs[docs.length - 1]._id as ObjectId) ?? lastId;

    const processed = stats.migrados + stats.pulados;
    const pct = stats.total > 0 ? ((processed / stats.total) * 100).toFixed(1) : '0.0';
    console.log(`📈 [Migração] Progresso: ${processed}/${stats.total} (${pct}%)`);
  }

  stats.tempoTotal = Math.round((Date.now() - startTime) / 1000);
  return stats;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
    batchSize: DEFAULT_BATCH_SIZE,
    maxRetries: DEFAULT_MAX_RETRIES,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--limit': {
        const n = parseInt(args[++i], 10);
        if (!Number.isFinite(n) || n <= 0) throw new Error('--limit inválido');
        options.limit = n;
        break;
      }
      case '--batch-size': {
        const n = parseInt(args[++i], 10);
        if (!Number.isFinite(n) || n <= 0) throw new Error('--batch-size inválido');
        options.batchSize = n;
        break;
      }
      case '--max-retries': {
        const n = parseInt(args[++i], 10);
        if (!Number.isFinite(n) || n <= 0) throw new Error('--max-retries inválido');
        options.maxRetries = n;
        break;
      }
      case '--start-after':
        options.startAfter = args[++i];
        break;
      case '--help':
        console.log(`
Migração de logs brutos (captura) MongoDB → PostgreSQL

Uso:
  npm run migrate:captura-raw-logs [opções]

Opções:
  --dry-run                 Simular migração sem escrever no Postgres
  --limit <n>               Processar apenas N documentos
  --batch-size <n>          Tamanho do batch (padrão: ${DEFAULT_BATCH_SIZE})
  --max-retries <n>         Máximo de tentativas (padrão: ${DEFAULT_MAX_RETRIES})
  --start-after <raw_log_id> Retomar após um raw_log_id (ObjectId string)
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const stats = await migrarLogs(options);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RELATÓRIO DE MIGRAÇÃO - LOGS BRUTOS (CAPTURA)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📦 Total:          ${stats.total}`);
    console.log(`✅ Migrados:       ${stats.migrados}`);
    console.log(`⏭️  Pulados:        ${stats.pulados}`);
    console.log(`❌ Erros:          ${stats.erros}`);
    console.log(`⏱️  Tempo Total:    ${stats.tempoTotal}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exitCode = stats.erros > 0 ? 1 : 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Erro fatal na migração: ${msg}\n`);
    process.exitCode = 1;
  } finally {
    await closeMongoConnection();
  }
}

main();


