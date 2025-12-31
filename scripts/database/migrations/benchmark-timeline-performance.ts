#!/usr/bin/env tsx
/**
 * Script de Benchmark de Performance - Timeline Migration
 *
 * Compara performance de leitura de timeline entre PostgreSQL (JSONB) e MongoDB.
 * Mede tempo de execução de timeline unificada com múltiplas instâncias.
 *
 * Uso:
 *   npm run benchmark:timeline
 *   npm run benchmark:timeline -- --sample-size 200
 *   npm run benchmark:timeline -- --output benchmark-results.json
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { obterTimelineUnificada } from '@/features/acervo/timeline-unificada';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Interfaces e Tipos
// ============================================================================

interface BenchmarkStats {
  media: number;
  mediana: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  total: number;
}

interface BenchmarkResult {
  postgres: BenchmarkStats;
  mongodb: BenchmarkStats;
  timelineUnificada: BenchmarkStats & {
    avgInstancias: number;
    avgTotalItens: number;
  };
  comparacao: {
    postgresFasterPercent: number;
    mongodbFasterPercent: number;
  };
}

interface BenchmarkOptions {
  sampleSize: number;
  output?: string;
}

interface MedicaoIndividual {
  id: number;
  tempo: number;
  metadados?: {
    totalInstancias?: number;
    totalItens?: number;
  };
}

// ============================================================================
// Funções de Benchmark
// ============================================================================

function calcularEstatisticas(medicoes: number[]): BenchmarkStats {
  if (medicoes.length === 0) {
    return { media: 0, mediana: 0, p95: 0, p99: 0, min: 0, max: 0, total: medicoes.length };
  }

  const sorted = [...medicoes].sort((a, b) => a - b);
  const sum = medicoes.reduce((acc, val) => acc + val, 0);

  const media = sum / medicoes.length;
  const mediana = sorted[Math.floor(medicoes.length / 2)];
  const p95 = sorted[Math.floor(medicoes.length * 0.95)];
  const p99 = sorted[Math.floor(medicoes.length * 0.99)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {
    media,
    mediana,
    p95,
    p99,
    min,
    max,
    total: medicoes.length,
  };
}

async function benchmarkLeituraPostgres(processoIds: number[]): Promise<MedicaoIndividual[]> {
  const supabase = createServiceClient();
  const medicoes: MedicaoIndividual[] = [];

  console.log(`\n📊 Benchmarking leitura PostgreSQL (${processoIds.length} processos)...`);

  for (const processoId of processoIds) {
    const start = performance.now();

    const { data, error } = await supabase
      .from('acervo')
      .select('timeline_jsonb')
      .eq('id', processoId)
      .single();

    const end = performance.now();
    const tempo = end - start;

    if (!error && data) {
      medicoes.push({ id: processoId, tempo });
    } else {
      console.warn(`⚠️  Erro ao ler processo ${processoId}: ${error?.message}`);
    }
  }

  console.log(`   ✓ ${medicoes.length} medições concluídas`);

  return medicoes;
}

async function benchmarkLeituraMongoDB(mongoIds: string[]): Promise<MedicaoIndividual[]> {
  const collection = getTimelineCollection();
  const medicoes: MedicaoIndividual[] = [];

  console.log(`\n📊 Benchmarking leitura MongoDB (${mongoIds.length} documentos)...`);

  for (let i = 0; i < mongoIds.length; i++) {
    const mongoId = mongoIds[i];

    try {
      const start = performance.now();

      await collection.findOne({ _id: new ObjectId(mongoId) });

      const end = performance.now();
      const tempo = end - start;

      medicoes.push({ id: i, tempo });
    } catch (error) {
      console.warn(`⚠️  Erro ao ler documento MongoDB ${mongoId}: ${error}`);
    }
  }

  console.log(`   ✓ ${medicoes.length} medições concluídas`);

  return medicoes;
}

async function benchmarkTimelineUnificada(
  numerosProcesso: string[]
): Promise<MedicaoIndividual[]> {
  const medicoes: MedicaoIndividual[] = [];

  console.log(`\n📊 Benchmarking timeline unificada (${numerosProcesso.length} processos)...`);

  for (let i = 0; i < numerosProcesso.length; i++) {
    const numeroProcesso = numerosProcesso[i];

    try {
      const start = performance.now();

      const resultado = await obterTimelineUnificada(numeroProcesso);

      const end = performance.now();
      const tempo = end - start;

      medicoes.push({
        id: i,
        tempo,
        metadados: {
          totalInstancias: resultado.metadata.instancias.length,
          totalItens: resultado.timeline.length,
        },
      });
    } catch (error) {
      console.warn(`⚠️  Erro ao processar timeline unificada ${numeroProcesso}: ${error}`);
    }
  }

  console.log(`   ✓ ${medicoes.length} medições concluídas`);

  return medicoes;
}

// ============================================================================
// Busca de Sample de Dados
// ============================================================================

async function buscarSampleDados(sampleSize: number): Promise<{
  processoIds: number[];
  mongoIds: string[];
  numerosProcesso: string[];
}> {
  const supabase = createServiceClient();

  console.log(`\n🔍 Buscando sample de ${sampleSize} processos...`);

  // Buscar processos com timeline migrada
  const { data: processos, error } = await supabase
    .from('acervo')
    .select('id, numero_processo, timeline_mongodb_id')
    .not('timeline_mongodb_id', 'is', null)
    .not('timeline_jsonb', 'is', null)
    .order('random()')
    .limit(sampleSize);

  if (error || !processos || processos.length === 0) {
    throw new Error(`Erro ao buscar sample: ${error?.message || 'Nenhum processo encontrado'}`);
  }

  console.log(`   ✓ ${processos.length} processos encontrados`);

  return {
    processoIds: processos.map((p) => p.id),
    mongoIds: processos.map((p) => p.timeline_mongodb_id).filter((id): id is string => !!id),
    numerosProcesso: processos.map((p) => p.numero_processo),
  };
}

// ============================================================================
// Geração de Relatório
// ============================================================================

function gerarRelatorioConsole(result: BenchmarkResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DE BENCHMARK - TIMELINE MIGRATION');
  console.log('='.repeat(80) + '\n');

  // Tabela comparativa
  console.log('┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐');
  console.log('│ Métrica             │ PostgreSQL (JSONB)│ MongoDB          │ Diferença        │');
  console.log('├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤');

  const formatTempo = (ms: number) => `${ms.toFixed(2)}ms`.padStart(16);
  const formatDiff = (postgres: number, mongo: number) => {
    if (mongo === 0) return 'N/A'.padStart(16);
    const diff = ((postgres - mongo) / mongo * 100);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`.padStart(16);
  };

  console.log(`│ Média               │${formatTempo(result.postgres.media)}│${formatTempo(result.mongodb.media)}│${formatDiff(result.postgres.media, result.mongodb.media)}│`);
  console.log(`│ Mediana             │${formatTempo(result.postgres.mediana)}│${formatTempo(result.mongodb.mediana)}│${formatDiff(result.postgres.mediana, result.mongodb.mediana)}│`);
  console.log(`│ P95                 │${formatTempo(result.postgres.p95)}│${formatTempo(result.mongodb.p95)}│${formatDiff(result.postgres.p95, result.mongodb.p95)}│`);
  console.log(`│ P99                 │${formatTempo(result.postgres.p99)}│${formatTempo(result.mongodb.p99)}│${formatDiff(result.postgres.p99, result.mongodb.p99)}│`);
  console.log(`│ Min                 │${formatTempo(result.postgres.min)}│${formatTempo(result.mongodb.min)}│${formatDiff(result.postgres.min, result.mongodb.min)}│`);
  console.log(`│ Max                 │${formatTempo(result.postgres.max)}│${formatTempo(result.mongodb.max)}│${formatDiff(result.postgres.max, result.mongodb.max)}│`);
  console.log('└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘\n');

  // Timeline Unificada
  console.log('📈 Timeline Unificada (PostgreSQL):');
  console.log(`   Média de tempo:      ${result.timelineUnificada.media.toFixed(2)}ms`);
  console.log(`   Mediana:             ${result.timelineUnificada.mediana.toFixed(2)}ms`);
  console.log(`   P95:                 ${result.timelineUnificada.p95.toFixed(2)}ms`);
  console.log(`   P99:                 ${result.timelineUnificada.p99.toFixed(2)}ms`);
  console.log(`   Média de instâncias: ${result.timelineUnificada.avgInstancias.toFixed(1)}`);
  console.log(`   Média de itens:      ${result.timelineUnificada.avgTotalItens.toFixed(0)}`);

  // Análise
  console.log('\n🔍 Análise:');

  if (result.comparacao.postgresFasterPercent > 0) {
    console.log(`   ✅ PostgreSQL é ${result.comparacao.postgresFasterPercent.toFixed(1)}% mais rápido que MongoDB`);
  } else if (result.comparacao.mongodbFasterPercent > 0) {
    const diff = result.comparacao.mongodbFasterPercent;
    if (diff < 20) {
      console.log(`   ⚠️  MongoDB é ${diff.toFixed(1)}% mais rápido (diferença aceitável < 20%)`);
    } else {
      console.log(`   ❌ MongoDB é ${diff.toFixed(1)}% mais rápido (diferença significativa)`);
    }
  } else {
    console.log('   ⚖️  Performance similar entre PostgreSQL e MongoDB');
  }

  if (result.timelineUnificada.media < 2000) {
    console.log(`   ✅ Timeline unificada dentro do limite aceitável (< 2000ms)`);
  } else {
    console.log(`   ⚠️  Timeline unificada acima do limite recomendado (${result.timelineUnificada.media.toFixed(0)}ms > 2000ms)`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function gerarRelatorioJSON(
  result: BenchmarkResult,
  filename: string
): Promise<void> {
  const filepath = path.join(process.cwd(), filename);

  const report = {
    timestamp: new Date().toISOString(),
    versao: '1.0.0',
    resultados: result,
  };

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`💾 Relatório JSON salvo em: ${filename}`);
}

// ============================================================================
// CLI e Argumentos
// ============================================================================

function parseArgs(): BenchmarkOptions {
  const args = process.argv.slice(2);
  const options: BenchmarkOptions = {
    sampleSize: 100,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--sample-size':
        options.sampleSize = parseInt(args[++i], 10);
        if (isNaN(options.sampleSize) || options.sampleSize <= 0) {
          console.error('Sample size deve ser um número positivo');
          process.exit(1);
        }
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Argumento desconhecido: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Uso: benchmark-timeline-performance [opções]

Opções:
  --sample-size <n>     Tamanho do sample (padrão: 100)
                        Número de processos a serem testados

  --output <file>       Arquivo de saída JSON (padrão: apenas console)
                        Exemplo: --output benchmark-results.json

  --help, -h            Exibir esta ajuda

Exemplos:
  npm run benchmark:timeline
  npm run benchmark:timeline -- --sample-size 200
  npm run benchmark:timeline -- --output results.json
  npm run benchmark:timeline -- --sample-size 50 --output test.json
  `);
}

// ============================================================================
// Função Principal
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();
  const options = parseArgs();

  console.log('\n🚀 Iniciando benchmark de performance...');
  console.log(`Sample size: ${options.sampleSize}`);

  try {
    // Buscar sample de dados
    const { processoIds, mongoIds, numerosProcesso } = await buscarSampleDados(options.sampleSize);

    // Executar benchmarks
    const medicoesPostgres = await benchmarkLeituraPostgres(processoIds);
    const medicoesMongo = await benchmarkLeituraMongoDB(mongoIds);

    // Selecionar subset para timeline unificada (mais lenta, usar menos processos)
    const subsetSize = Math.min(30, numerosProcesso.length);
    const numerosProcessoSubset = numerosProcesso.slice(0, subsetSize);
    const medicoesUnificada = await benchmarkTimelineUnificada(numerosProcessoSubset);

    // Calcular estatísticas
    const statsPostgres = calcularEstatisticas(medicoesPostgres.map((m) => m.tempo));
    const statsMongo = calcularEstatisticas(medicoesMongo.map((m) => m.tempo));
    const statsUnificada = calcularEstatisticas(medicoesUnificada.map((m) => m.tempo));

    // Calcular metadados de timeline unificada
    const avgInstancias =
      medicoesUnificada.reduce((sum, m) => sum + (m.metadados?.totalInstancias || 0), 0) /
      medicoesUnificada.length;
    const avgTotalItens =
      medicoesUnificada.reduce((sum, m) => sum + (m.metadados?.totalItens || 0), 0) /
      medicoesUnificada.length;

    // Calcular comparação
    const postgresFasterPercent =
      statsMongo.media > 0
        ? ((statsMongo.media - statsPostgres.media) / statsMongo.media) * 100
        : 0;
    const mongodbFasterPercent =
      statsPostgres.media > 0
        ? ((statsPostgres.media - statsMongo.media) / statsPostgres.media) * 100
        : 0;

    const result: BenchmarkResult = {
      postgres: statsPostgres,
      mongodb: statsMongo,
      timelineUnificada: {
        ...statsUnificada,
        avgInstancias,
        avgTotalItens,
      },
      comparacao: {
        postgresFasterPercent: Math.max(0, postgresFasterPercent),
        mongodbFasterPercent: Math.max(0, mongodbFasterPercent),
      },
    };

    // Gerar relatórios
    gerarRelatorioConsole(result);

    if (options.output) {
      await gerarRelatorioJSON(result, options.output);
    }

    const duracao = Date.now() - startTime;
    console.log(`⏱️  Tempo total de execução: ${(duracao / 1000).toFixed(2)}s\n`);

    console.log('✅ Benchmark concluído com sucesso');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Erro durante benchmark: ${errorMsg}\n`);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

// Executar
main();
