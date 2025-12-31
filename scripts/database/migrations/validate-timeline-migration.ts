#!/usr/bin/env tsx
/**
 * Script de Validação da Migração de Timeline MongoDB → PostgreSQL
 *
 * Valida a integridade da migração comparando dados entre MongoDB e PostgreSQL.
 * Suporta diferentes modos de validação: quick, sample, full.
 *
 * Uso:
 *   npm run validate:timeline -- --mode sample --sample-size 100
 *   npm run validate:timeline:quick
 *   npm run validate:timeline:full
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Interfaces e Tipos
// ============================================================================

interface ValidationStats {
  totalRegistros: number;
  comTimelineMongoDB: number;
  comTimelinePostgres: number;
  pendentes: number;
  validados: number;
  inconsistencias: number;
  erros: number;
}

interface ValidationOptions {
  mode: 'quick' | 'full' | 'sample';
  sampleSize?: number;
  verbose?: boolean;
  json?: boolean;
}

interface InconsistenciaDetalhada {
  acervoId: number;
  numeroProcesso: string;
  tipo: 'metadata' | 'timeline_length' | 'missing_mongo' | 'missing_postgres';
  detalhes: string;
}

interface TimelineJSONB {
  timeline: Array<{
    data: string;
    descricao: string;
    documento: boolean;
    hash: string;
    instancia?: string;
  }>;
  metadata: {
    instancias: string[];
    totalDocumentos: number;
    totalMovimentos: number;
    duplicatasRemovidas: number;
    dataProcessamento: string;
  };
}

interface ValidationReport {
  timestamp: string;
  mode: string;
  stats: ValidationStats;
  inconsistencias: InconsistenciaDetalhada[];
  metadata: {
    versao: string;
    duracao: number;
  };
}

// ============================================================================
// Funções de Validação
// ============================================================================

async function contarRegistros(): Promise<ValidationStats> {
  const supabase = createServiceClient();

  // Total de registros com timeline_mongodb_id
  const { count: totalRegistros } = await supabase
    .from('acervo')
    .select('*', { count: 'exact', head: true })
    .not('timeline_mongodb_id', 'is', null);

  // Registros com timeline_jsonb
  const { count: comTimelinePostgres } = await supabase
    .from('acervo')
    .select('*', { count: 'exact', head: true })
    .not('timeline_jsonb', 'is', null);

  // Registros pendentes (com MongoDB ID mas sem JSONB)
  const { count: pendentes } = await supabase
    .from('acervo')
    .select('*', { count: 'exact', head: true })
    .not('timeline_mongodb_id', 'is', null)
    .is('timeline_jsonb', null);

  return {
    totalRegistros: totalRegistros || 0,
    comTimelineMongoDB: totalRegistros || 0,
    comTimelinePostgres: comTimelinePostgres || 0,
    pendentes: pendentes || 0,
    validados: 0,
    inconsistencias: 0,
    erros: 0,
  };
}

async function validarRegistro(
  acervoId: number,
  numeroProcesso: string,
  timelineMongoId: string,
  timelinePostgres: TimelineJSONB | null,
  verbose: boolean
): Promise<InconsistenciaDetalhada | null> {
  try {
    // Buscar timeline no MongoDB
    const collection = getTimelineCollection();
    const timelineMongo = await collection.findOne({ _id: new ObjectId(timelineMongoId) });

    if (!timelineMongo) {
      return {
        acervoId,
        numeroProcesso,
        tipo: 'missing_mongo',
        detalhes: `Timeline não encontrada no MongoDB (ID: ${timelineMongoId})`,
      };
    }

    if (!timelinePostgres) {
      return {
        acervoId,
        numeroProcesso,
        tipo: 'missing_postgres',
        detalhes: 'Timeline não migrada para PostgreSQL',
      };
    }

    // Comparar quantidade de itens
    const lengthMongo = timelineMongo.timeline?.length || 0;
    const lengthPostgres = timelinePostgres.timeline?.length || 0;

    if (lengthMongo !== lengthPostgres) {
      return {
        acervoId,
        numeroProcesso,
        tipo: 'timeline_length',
        detalhes: `Quantidade de itens diferente: MongoDB=${lengthMongo}, PostgreSQL=${lengthPostgres}`,
      };
    }

    // Comparar metadados
    const metaMongo = timelineMongo.metadata;
    const metaPostgres = timelinePostgres.metadata;

    if (metaMongo && metaPostgres) {
      if (metaMongo.totalDocumentos !== metaPostgres.totalDocumentos) {
        return {
          acervoId,
          numeroProcesso,
          tipo: 'metadata',
          detalhes: `totalDocumentos diferente: MongoDB=${metaMongo.totalDocumentos}, PostgreSQL=${metaPostgres.totalDocumentos}`,
        };
      }

      if (metaMongo.totalMovimentos !== metaPostgres.totalMovimentos) {
        return {
          acervoId,
          numeroProcesso,
          tipo: 'metadata',
          detalhes: `totalMovimentos diferente: MongoDB=${metaMongo.totalMovimentos}, PostgreSQL=${metaPostgres.totalMovimentos}`,
        };
      }
    }

    // Validar estrutura do JSONB
    if (!Array.isArray(timelinePostgres.timeline)) {
      return {
        acervoId,
        numeroProcesso,
        tipo: 'metadata',
        detalhes: 'timeline não é um array',
      };
    }

    if (verbose) {
      console.log(`✓ Registro ${acervoId} validado com sucesso`);
    }

    return null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      acervoId,
      numeroProcesso,
      tipo: 'metadata',
      detalhes: `Erro durante validação: ${errorMsg}`,
    };
  }
}

async function validarSample(
  sampleSize: number,
  verbose: boolean
): Promise<{ stats: ValidationStats; inconsistencias: InconsistenciaDetalhada[] }> {
  const supabase = createServiceClient();
  const inconsistencias: InconsistenciaDetalhada[] = [];

  console.log(`\n🔍 Validando sample de ${sampleSize} registros...\n`);

  // Buscar sample aleatório
  const { data: registros, error } = await supabase
    .from('acervo')
    .select('id, numero_processo, timeline_mongodb_id, timeline_jsonb')
    .not('timeline_mongodb_id', 'is', null)
    .order('random()')
    .limit(sampleSize);

  if (error) {
    throw new Error(`Erro ao buscar sample: ${error.message}`);
  }

  if (!registros || registros.length === 0) {
    throw new Error('Nenhum registro encontrado para validação');
  }

  const stats = await contarRegistros();
  stats.validados = registros.length;

  // Validar cada registro
  for (const registro of registros) {
    const inconsistencia = await validarRegistro(
      registro.id,
      registro.numero_processo,
      registro.timeline_mongodb_id,
      registro.timeline_jsonb,
      verbose
    );

    if (inconsistencia) {
      inconsistencias.push(inconsistencia);
      stats.inconsistencias++;
    }
  }

  return { stats, inconsistencias };
}

async function validarCompleto(
  verbose: boolean
): Promise<{ stats: ValidationStats; inconsistencias: InconsistenciaDetalhada[] }> {
  const supabase = createServiceClient();
  const inconsistencias: InconsistenciaDetalhada[] = [];

  console.log('\n🔍 Validando TODOS os registros migrados...\n');
  console.log('⚠️  Esta operação pode demorar vários minutos.\n');

  const stats = await contarRegistros();
  const batchSize = 100;
  let offset = 0;
  let totalValidados = 0;

  while (true) {
    // Buscar batch de registros
    const { data: registros, error } = await supabase
      .from('acervo')
      .select('id, numero_processo, timeline_mongodb_id, timeline_jsonb')
      .not('timeline_mongodb_id', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(`Erro ao buscar batch (offset ${offset}): ${error.message}`);
      stats.erros++;
      break;
    }

    if (!registros || registros.length === 0) {
      break;
    }

    // Validar cada registro do batch
    for (const registro of registros) {
      const inconsistencia = await validarRegistro(
        registro.id,
        registro.numero_processo,
        registro.timeline_mongodb_id,
        registro.timeline_jsonb,
        verbose
      );

      if (inconsistencia) {
        inconsistencias.push(inconsistencia);
        stats.inconsistencias++;
      }

      totalValidados++;
    }

    console.log(`Progresso: ${totalValidados}/${stats.totalRegistros} registros validados`);

    offset += batchSize;
  }

  stats.validados = totalValidados;

  return { stats, inconsistencias };
}

async function validarRapido(): Promise<{ stats: ValidationStats; inconsistencias: InconsistenciaDetalhada[] }> {
  console.log('\n⚡ Validação rápida (apenas contagem)...\n');

  const stats = await contarRegistros();

  return { stats, inconsistencias: [] };
}

// ============================================================================
// Geração de Relatórios
// ============================================================================

function gerarRelatorioConsole(stats: ValidationStats, inconsistencias: InconsistenciaDetalhada[]): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RELATÓRIO DE VALIDAÇÃO');
  console.log('='.repeat(70) + '\n');

  console.log('📈 Estatísticas:');
  console.log(`   Total de registros com timeline MongoDB:  ${stats.totalRegistros}`);
  console.log(`   Registros com timeline PostgreSQL:        ${stats.comTimelinePostgres}`);
  console.log(`   Registros pendentes (não migrados):       ${stats.pendentes}`);
  console.log(`   Registros validados:                      ${stats.validados}`);
  console.log(`   Inconsistências encontradas:              ${stats.inconsistencias}`);
  console.log(`   Erros durante validação:                  ${stats.erros}`);

  const taxaSucesso = stats.validados > 0
    ? ((stats.validados - stats.inconsistencias) / stats.validados * 100).toFixed(2)
    : '0.00';

  console.log(`\n✨ Taxa de sucesso: ${taxaSucesso}%\n`);

  if (inconsistencias.length > 0) {
    console.log('⚠️  Inconsistências encontradas (primeiras 20):');
    console.log('-'.repeat(70));

    inconsistencias.slice(0, 20).forEach((inc, index) => {
      console.log(`\n${index + 1}. Processo: ${inc.numeroProcesso} (ID: ${inc.acervoId})`);
      console.log(`   Tipo: ${inc.tipo}`);
      console.log(`   Detalhes: ${inc.detalhes}`);
    });

    if (inconsistencias.length > 20) {
      console.log(`\n... e mais ${inconsistencias.length - 20} inconsistências.`);
      console.log('Execute com --json para ver o relatório completo.');
    }

    console.log('\n' + '-'.repeat(70));
  }

  // Sugestões de ações corretivas
  if (stats.pendentes > 0) {
    console.log('\n💡 Ações recomendadas:');
    console.log(`   - Há ${stats.pendentes} registros pendentes de migração`);
    console.log('   - Execute: npm run migrate:timeline');
  }

  if (parseFloat(taxaSucesso) < 99) {
    console.log('\n⚠️  Taxa de sucesso abaixo de 99%:');
    console.log('   - Analise as inconsistências detalhadas');
    console.log('   - Execute: npm run validate:timeline:full --json');
    console.log('   - Considere re-executar a migração para registros com falha');
  }

  if (parseFloat(taxaSucesso) >= 99) {
    console.log('\n✅ Migração validada com sucesso!');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

async function gerarRelatorioJSON(
  stats: ValidationStats,
  inconsistencias: InconsistenciaDetalhada[],
  duracao: number
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `validation-report-${timestamp}.json`;
  const filepath = path.join(process.cwd(), filename);

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    mode: 'full',
    stats,
    inconsistencias,
    metadata: {
      versao: '1.0.0',
      duracao,
    },
  };

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n💾 Relatório JSON salvo em: ${filename}`);

  return filename;
}

// ============================================================================
// CLI e Argumentos
// ============================================================================

function parseArgs(): ValidationOptions {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {
    mode: 'sample',
    sampleSize: 50,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--mode':
        const mode = args[++i] as 'quick' | 'full' | 'sample';
        if (['quick', 'full', 'sample'].includes(mode)) {
          options.mode = mode;
        } else {
          console.error(`Modo inválido: ${mode}`);
          printHelp();
          process.exit(1);
        }
        break;
      case '--sample-size':
        options.sampleSize = parseInt(args[++i], 10);
        if (isNaN(options.sampleSize) || options.sampleSize <= 0) {
          console.error('Sample size deve ser um número positivo');
          process.exit(1);
        }
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--json':
        options.json = true;
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
Uso: validate-timeline-migration [opções]

Opções:
  --mode <quick|full|sample>   Modo de validação (padrão: sample)
                               quick:  Apenas contagem de registros
                               sample: Valida amostra aleatória
                               full:   Valida todos os registros

  --sample-size <n>            Tamanho do sample (padrão: 50)
                               Usado apenas no modo 'sample'

  --verbose                    Exibir logs detalhados durante validação

  --json                       Salvar relatório completo em JSON

  --help, -h                   Exibir esta ajuda

Exemplos:
  npm run validate:timeline
  npm run validate:timeline -- --mode quick
  npm run validate:timeline -- --mode sample --sample-size 100
  npm run validate:timeline -- --mode full --json --verbose
  `);
}

// ============================================================================
// Função Principal
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();
  const options = parseArgs();

  console.log('\n🚀 Iniciando validação da migração de timeline...');
  console.log(`Modo: ${options.mode}`);
  if (options.mode === 'sample') {
    console.log(`Sample size: ${options.sampleSize}`);
  }

  let stats: ValidationStats;
  let inconsistencias: InconsistenciaDetalhada[] = [];

  try {
    switch (options.mode) {
      case 'quick':
        ({ stats, inconsistencias } = await validarRapido());
        break;
      case 'sample':
        ({ stats, inconsistencias } = await validarSample(options.sampleSize!, options.verbose));
        break;
      case 'full':
        ({ stats, inconsistencias } = await validarCompleto(options.verbose));
        break;
    }

    const duracao = Date.now() - startTime;

    gerarRelatorioConsole(stats, inconsistencias);

    if (options.json) {
      await gerarRelatorioJSON(stats, inconsistencias, duracao);
    }

    console.log(`⏱️  Tempo de execução: ${(duracao / 1000).toFixed(2)}s\n`);

    // Determinar exit code
    if (stats.erros > 0) {
      console.error('❌ Validação concluída com erros');
      process.exit(2);
    } else if (stats.inconsistencias > 0) {
      console.warn('⚠️  Validação concluída com inconsistências');
      process.exit(1);
    } else {
      console.log('✅ Validação concluída com sucesso');
      process.exit(0);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Erro fatal durante validação: ${errorMsg}\n`);
    process.exit(2);
  } finally {
    await closeMongoConnection();
  }
}

// Executar
main();
