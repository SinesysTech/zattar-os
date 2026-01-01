#!/usr/bin/env tsx
/**
 * Script de Validação da Migração de Logs Brutos de Captura (MongoDB → PostgreSQL)
 *
 * Estratégia:
 * - Valida por amostragem (default) consultando o MongoDB e garantindo que o registro
 *   existe no Postgres com raw_log_id = _id (ObjectId string).
 * - Opcionalmente compara alguns campos-chave (status, tipo_captura, trt, grau, captura_log_id).
 *
 * Uso:
 *   npm run validate:captura-raw-logs
 *   npm run validate:captura-raw-logs -- --sample-size 500 --verbose
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
loadEnv({ path: resolve(process.cwd(), '.env.local') });

import { createServiceClient } from '@/lib/supabase/service-client';
import { getCapturaRawLogsCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ValidationOptions {
  sampleSize: number;
  verbose: boolean;
}

interface ValidationStats {
  sampleSize: number;
  encontrados: number;
  faltandoNoPostgres: number;
  divergencias: number;
  erros: number;
  duracaoSegundos: number;
}

function parseArgs(): ValidationOptions {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {
    sampleSize: 200,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--sample-size': {
        const n = parseInt(args[++i], 10);
        if (!Number.isFinite(n) || n <= 0) throw new Error('--sample-size inválido');
        options.sampleSize = n;
        break;
      }
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Validação da migração captura_logs_brutos (MongoDB → PostgreSQL)

Uso:
  npm run validate:captura-raw-logs -- [opções]

Opções:
  --sample-size <n>   Quantidade de documentos a validar (padrão: 200)
  --verbose           Log detalhado por item
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const start = Date.now();
  const opts = parseArgs();

  const stats: ValidationStats = {
    sampleSize: opts.sampleSize,
    encontrados: 0,
    faltandoNoPostgres: 0,
    divergencias: 0,
    erros: 0,
    duracaoSegundos: 0,
  };

  try {
    const collection = await getCapturaRawLogsCollection();
    const supabase = createServiceClient();

    const totalMongo = await collection.countDocuments({});
    console.log(`🔍 [Validação] MongoDB total: ${totalMongo}`);
    console.log(`🔎 [Validação] Validando sample: ${opts.sampleSize}`);

    // Buscar sample determinístico: primeiros N (ordem por _id asc).
    // (Evita "random()" e é suficiente para sanity-check.)
    const docs = await collection
      .find({})
      .sort({ _id: 1 })
      .limit(opts.sampleSize)
      .toArray();

    for (const doc of docs) {
      try {
        const rawLogId = (doc._id as ObjectId).toString();

        const { data, error } = await supabase
          .from('captura_logs_brutos')
          .select('raw_log_id,captura_log_id,tipo_captura,status,trt,grau')
          .eq('raw_log_id', rawLogId)
          .maybeSingle();

        if (error) {
          stats.erros++;
          if (opts.verbose) console.error(`❌ [Validação] raw_log_id=${rawLogId} erro PostgREST: ${error.message}`);
          continue;
        }

        if (!data) {
          stats.faltandoNoPostgres++;
          if (opts.verbose) console.warn(`⚠️  [Validação] raw_log_id=${rawLogId} não encontrado no Postgres`);
          continue;
        }

        stats.encontrados++;

        const diffs: string[] = [];
        if ((data as any).captura_log_id !== (doc.captura_log_id ?? -1)) diffs.push('captura_log_id');
        if ((data as any).tipo_captura !== doc.tipo_captura) diffs.push('tipo_captura');
        if ((data as any).status !== doc.status) diffs.push('status');
        if (((data as any).trt ?? null) !== (doc.trt ?? null)) diffs.push('trt');
        if (((data as any).grau ?? null) !== (doc.grau ?? null)) diffs.push('grau');

        if (diffs.length > 0) {
          stats.divergencias++;
          if (opts.verbose) {
            console.warn(`⚠️  [Validação] raw_log_id=${rawLogId} divergências: ${diffs.join(', ')}`);
          }
        } else if (opts.verbose) {
          console.log(`✓ [Validação] raw_log_id=${rawLogId} ok`);
        }
      } catch (e) {
        stats.erros++;
        if (opts.verbose) console.error('❌ [Validação] erro inesperado:', e);
      }
    }
  } finally {
    stats.duracaoSegundos = Math.round((Date.now() - start) / 1000);
    await closeMongoConnection();
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RELATÓRIO DE VALIDAÇÃO - LOGS BRUTOS (CAPTURA)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`🔎 Sample size:           ${stats.sampleSize}`);
  console.log(`✅ Encontrados no Postgres: ${stats.encontrados}`);
  console.log(`⚠️  Faltando no Postgres:   ${stats.faltandoNoPostgres}`);
  console.log(`⚠️  Divergências:            ${stats.divergencias}`);
  console.log(`❌ Erros:                   ${stats.erros}`);
  console.log(`⏱️  Duração:                 ${stats.duracaoSegundos}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exitCode = stats.faltandoNoPostgres > 0 || stats.erros > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error('❌ Erro fatal na validação:', e);
  process.exit(1);
});


