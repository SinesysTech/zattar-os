// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Imports necessários
import { createServiceClient } from '@/lib/supabase/service-client';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import { closeMongoConnection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { TimelineDocument } from '@/features/captura/types/mongo-timeline';
import type { TimelineJSONB } from '@/features/acervo/domain';

// ============================================================================
// INTERFACES E CONSTANTES
// ============================================================================

interface MigrationStats {
  total: number;
  sucesso: number;
  erros: number;
  pulados: number;
  tempoTotal: number;
}

interface MigrationOptions {
  dryRun: boolean;
  limit?: number;
  batchSize: number;
  maxRetries: number;
}

interface RegistroParaMigrar {
  id: number;
  timeline_mongodb_id: string;
  numero_processo: string;
  trt: string;
  grau: string;
}

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

// ============================================================================
// FUNÇÕES DE TRANSFORMAÇÃO
// ============================================================================

function transformarTimelineParaJSONB(doc: TimelineDocument): TimelineJSONB {
  return {
    timeline: doc.timeline,
    metadata: {
      totalDocumentos: doc.metadata?.totalDocumentos ?? 0,
      totalMovimentos: doc.metadata?.totalMovimentos ?? 0,
      totalDocumentosBaixados: doc.metadata?.totalDocumentosBaixados ?? 0,
      capturadoEm: doc.capturadoEm.toISOString(),
      schemaVersion: doc.metadata?.schemaVersion ?? 1,
    },
  };
}

// ============================================================================
// FUNÇÕES DE RETRY
// ============================================================================

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`⚠️  Tentativa ${i + 1}/${maxRetries} falhou. Aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

// ============================================================================
// FUNÇÕES DE BUSCA
// ============================================================================

async function buscarRegistrosParaMigrar(
  offset: number,
  limit: number,
  maxRetries: number
): Promise<RegistroParaMigrar[]> {
  const supabase = createServiceClient();

  return await retryWithBackoff(async () => {
    const query = supabase
      .from('acervo')
      .select('id, timeline_mongodb_id, numero_processo, trt, grau')
      .not('timeline_mongodb_id', 'is', null)
      .is('timeline_jsonb', null)
      .order('id')
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar registros: ${error.message}`);
    }

    return (data || []) as RegistroParaMigrar[];
  }, maxRetries);
}

// ============================================================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================================================

async function migrarRegistro(
  registro: RegistroParaMigrar,
  options: MigrationOptions,
  stats: MigrationStats
): Promise<void> {
  try {
    // 1. Buscar timeline no MongoDB
    const timelineDoc = await retryWithBackoff(async () => {
      const collection = await getTimelineCollection();
      const doc = await collection.findOne({
        _id: new ObjectId(registro.timeline_mongodb_id),
      });
      return doc;
    }, options.maxRetries);

    // 2. Validar se timeline foi encontrada
    if (!timelineDoc) {
      console.log(`⚠️  [${registro.numero_processo}] Timeline não encontrada no MongoDB (ID: ${registro.timeline_mongodb_id})`);
      stats.pulados++;
      return;
    }

    // 3. Transformar TimelineDocument em TimelineJSONB
    const timelineJSONB = transformarTimelineParaJSONB(timelineDoc);

    // 4. Atualizar PostgreSQL (se não for dry-run)
    if (!options.dryRun) {
      const supabase = createServiceClient();

      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('acervo')
          .update({ timeline_jsonb: timelineJSONB })
          .eq('id', registro.id);

        if (error) {
          throw new Error(`Erro ao atualizar PostgreSQL: ${error.message}`);
        }
      }, options.maxRetries);
    }

    // 5. Incrementar stats e logar sucesso
    stats.sucesso++;
    console.log(`✅ [${registro.numero_processo}] Timeline migrada (${timelineJSONB.timeline.length} itens)${options.dryRun ? ' [DRY-RUN]' : ''}`);
  } catch (error) {
    stats.erros++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [${registro.numero_processo}] Erro ao migrar registro ${registro.id}: ${errorMessage}`);
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function migrarTimelines(options: MigrationOptions): Promise<MigrationStats> {
  const startTime = Date.now();
  const stats: MigrationStats = {
    total: 0,
    sucesso: 0,
    erros: 0,
    pulados: 0,
    tempoTotal: 0,
  };

  try {
    console.log('🚀 [Migração] Iniciando migração de timelines MongoDB → PostgreSQL');
    if (options.dryRun) {
      console.log('🔍 [Migração] Modo DRY-RUN ativado - Nenhuma modificação será feita');
    }

    // Buscar total de registros a migrar
    const supabase = createServiceClient();
    const { count, error: countError } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('acervo')
        .select('*', { count: 'exact', head: true })
        .not('timeline_mongodb_id', 'is', null)
        .is('timeline_jsonb', null);

      if (result.error) {
        throw new Error(`Erro ao contar registros: ${result.error.message}`);
      }

      return result;
    }, options.maxRetries);

    if (countError) {
      throw new Error(`Erro ao contar registros: ${countError.message}`);
    }

    const totalRegistros = options.limit ? Math.min(count || 0, options.limit) : (count || 0);
    stats.total = totalRegistros;

    console.log(`📊 [Migração] Total de registros a migrar: ${totalRegistros}`);

    if (totalRegistros === 0) {
      console.log('✨ [Migração] Nenhum registro encontrado para migrar');
      return stats;
    }

    // Processar em batches
    const totalBatches = Math.ceil(totalRegistros / options.batchSize);
    let processados = 0;

    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const offset = (batchNum - 1) * options.batchSize;
      const limit = Math.min(options.batchSize, totalRegistros - offset);

      console.log(`⏳ [Migração] Processando batch ${batchNum}/${totalBatches} (${offset + 1}-${offset + limit})`);

      // Buscar registros do batch
      const registros = await buscarRegistrosParaMigrar(offset, limit, options.maxRetries);

      // Processar cada registro do batch
      for (const registro of registros) {
        await migrarRegistro(registro, options, stats);
        processados++;

        // Exibir progresso a cada 10 registros
        if (processados % 10 === 0 || processados === totalRegistros) {
          const percentage = ((processados / totalRegistros) * 100).toFixed(1);
          console.log(`📈 [Migração] Progresso: ${processados}/${totalRegistros} (${percentage}%)`);
        }
      }
    }

    // Calcular tempo total
    stats.tempoTotal = Math.round((Date.now() - startTime) / 1000);

    return stats;
  } catch (error) {
    stats.tempoTotal = Math.round((Date.now() - startTime) / 1000);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Migração] Erro fatal: ${errorMessage}`);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

async function validarMigracao(): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VALIDAÇÃO DA MIGRAÇÃO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const supabase = createServiceClient();

  // 1. Contar registros pendentes
  const { count: pendentes } = await supabase
    .from('acervo')
    .select('*', { count: 'exact', head: true })
    .not('timeline_mongodb_id', 'is', null)
    .is('timeline_jsonb', null);

  console.log(`📊 Registros pendentes de migração: ${pendentes || 0}`);

  if (pendentes && pendentes > 0) {
    // Listar IDs pendentes (primeiros 10)
    const { data: registrosPendentes } = await supabase
      .from('acervo')
      .select('id, numero_processo, timeline_mongodb_id')
      .not('timeline_mongodb_id', 'is', null)
      .is('timeline_jsonb', null)
      .limit(10);

    console.log('\n⚠️  Registros pendentes (primeiros 10):');
    registrosPendentes?.forEach(r => {
      console.log(`   - ID ${r.id}: ${r.numero_processo}`);
    });
    console.log('\n💡 Sugestão: Re-execute a migração para processar registros falhados');
  }

  // 2. Validar sample aleatório
  const { data: sample } = await supabase
    .from('acervo')
    .select('id, timeline_mongodb_id, timeline_jsonb, numero_processo')
    .not('timeline_mongodb_id', 'is', null)
    .not('timeline_jsonb', 'is', null)
    .limit(10);

  if (sample && sample.length > 0) {
    console.log(`\n✅ Validando sample de ${sample.length} registros migrados...`);

    const collection = await getTimelineCollection();
    let validados = 0;
    let invalidos = 0;

    for (const registro of sample) {
      try {
        const timelineDoc = await collection.findOne({
          _id: new ObjectId(registro.timeline_mongodb_id),
        });

        if (!timelineDoc) {
          console.log(`⚠️  [${registro.numero_processo}] Timeline não encontrada no MongoDB`);
          invalidos++;
          continue;
        }

        const timelineJSONB = registro.timeline_jsonb as TimelineJSONB;

        // Validar metadata
        const totalDocsMongo = timelineDoc.metadata?.totalDocumentos ?? 0;
        const totalDocsPostgres = timelineJSONB.metadata.totalDocumentos;

        const timelineLengthMongo = timelineDoc.timeline.length;
        const timelineLengthPostgres = timelineJSONB.timeline.length;

        if (totalDocsMongo !== totalDocsPostgres || timelineLengthMongo !== timelineLengthPostgres) {
          console.log(`⚠️  [${registro.numero_processo}] Inconsistência detectada:`);
          console.log(`   - Total documentos: Mongo=${totalDocsMongo}, Postgres=${totalDocsPostgres}`);
          console.log(`   - Timeline length: Mongo=${timelineLengthMongo}, Postgres=${timelineLengthPostgres}`);
          invalidos++;
        } else {
          validados++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ [${registro.numero_processo}] Erro na validação: ${errorMessage}`);
        invalidos++;
      }
    }

    console.log(`\n📊 Resultado da validação: ${validados}/${sample.length} registros válidos`);
    if (invalidos > 0) {
      console.log(`⚠️  ${invalidos} registros com inconsistências`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// FUNÇÃO DE RELATÓRIO FINAL
// ============================================================================

function exibirRelatorioFinal(stats: MigrationStats): void {
  const taxaSucesso = stats.total > 0 ? (stats.sucesso / stats.total * 100).toFixed(2) : '0.00';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RELATÓRIO DE MIGRAÇÃO - TIMELINE MONGODB → POSTGRESQL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Sucesso:        ${stats.sucesso}`);
  console.log(`❌ Erros:          ${stats.erros}`);
  console.log(`⏭️  Pulados:        ${stats.pulados}`);
  console.log(`📦 Total:          ${stats.total}`);
  console.log(`⏱️  Tempo Total:    ${stats.tempoTotal}s`);
  console.log(`📈 Taxa de Sucesso: ${taxaSucesso}%`);

  if (stats.erros > 0) {
    console.log('\n⚠️  Alguns registros falharam. Verifique os logs acima.');
  }

  if (stats.pulados > 0) {
    console.log('ℹ️  Alguns registros foram pulados (timeline não encontrada no MongoDB).');
  }

  console.log('\n💡 Próximos passos:');
  console.log('   1. Executar validação: npm run validate:timeline');
  console.log('   2. Verificar logs de erro (se houver)');
  console.log('   3. Re-executar migração para registros falhados (se necessário)');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================================================
// FUNÇÃO CLI
// ============================================================================

function validarParametroNumerico(
  valor: number,
  nome: string,
  padrao: number
): number {
  if (!Number.isFinite(valor) || !Number.isInteger(valor) || valor <= 0) {
    console.error(`❌ Erro: ${nome} deve ser um número inteiro positivo. Valor fornecido: ${valor}`);
    console.error(`ℹ️  Restaurando valor padrão: ${padrao}`);
    return padrao;
  }
  return valor;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
    batchSize: BATCH_SIZE,
    maxRetries: MAX_RETRIES,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--limit': {
        const limite = parseInt(args[++i], 10);
        const limiteValidado = validarParametroNumerico(limite, '--limit', 0);
        if (limiteValidado > 0) {
          options.limit = limiteValidado;
        } else {
          console.error('❌ Erro fatal: --limit com valor inválido. Abortando migração.');
          process.exit(1);
        }
        break;
      }
      case '--batch-size': {
        const batchSize = parseInt(args[++i], 10);
        options.batchSize = validarParametroNumerico(batchSize, '--batch-size', BATCH_SIZE);
        break;
      }
      case '--max-retries': {
        const maxRetries = parseInt(args[++i], 10);
        options.maxRetries = validarParametroNumerico(maxRetries, '--max-retries', MAX_RETRIES);
        break;
      }
      case '--help':
        console.log(`
Migração de Timelines MongoDB → PostgreSQL

Uso:
  npm run migrate:timeline [opções]

Opções:
  --dry-run          Simular migração sem modificar dados
  --limit <n>        Limitar migração a N registros (para testes)
  --batch-size <n>   Tamanho do batch (padrão: ${BATCH_SIZE})
  --max-retries <n>  Máximo de tentativas (padrão: ${MAX_RETRIES})
  --help             Exibir esta mensagem de ajuda

Exemplos:
  # Dry-run (sem modificar dados)
  npm run migrate:timeline -- --dry-run

  # Migração real
  npm run migrate:timeline

  # Migração com limite (para testes)
  npm run migrate:timeline -- --limit 100

  # Migração com batch customizado
  npm run migrate:timeline -- --batch-size 50
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const options = parseArgs();

    // Executar migração
    const stats = await migrarTimelines(options);

    // Exibir relatório final
    exibirRelatorioFinal(stats);

    // Validar migração (se não for dry-run e houver sucessos)
    if (!options.dryRun && stats.sucesso > 0) {
      await validarMigracao();
    }

    // Fechar conexões
    await closeMongoConnection();

    // Exit com código apropriado
    process.exit(stats.erros > 0 ? 1 : 0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Erro fatal na migração: ${errorMessage}\n`);
    await closeMongoConnection();
    process.exit(1);
  }
}

// Executar main
main();
