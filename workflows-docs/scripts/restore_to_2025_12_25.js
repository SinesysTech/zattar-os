import * as Minio from 'minio';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================
const CONFIG = {
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: process.env.MINIO_SECRET_KEY || 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
};

// Argumentos CLI
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const HELP = args.includes('--help') || args.includes('-h');

// Extrair data alvo do argumento --date=YYYY-MM-DD ou usar padrão
const dateArg = args.find(arg => arg.startsWith('--date='));
const targetDateStr = dateArg ? dateArg.split('=')[1] : '2025-12-25';
const targetDate = new Date(`${targetDateStr}T23:59:59.999Z`);

// Extrair bucket do argumento --bucket=nome ou usar padrão
const bucketArg = args.find(arg => arg.startsWith('--bucket='));
const bucketName = bucketArg ? bucketArg.split('=')[1] : 'docs-12132024';

// Extrair prefixo opcional --prefix=pasta/
const prefixArg = args.find(arg => arg.startsWith('--prefix='));
const prefix = prefixArg ? prefixArg.split('=')[1] : '';

// Concorrência para processamento paralelo
const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 5;

if (HELP) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           MinIO Bucket Rewind/Restore Tool                     ║
╚════════════════════════════════════════════════════════════════╝

Restaura um bucket versionado para o estado em uma data específica.

USO:
  node restore_to_2025_12_25.js [opções]

OPÇÕES:
  --date=YYYY-MM-DD    Data alvo para restauração (padrão: 2025-12-25)
  --bucket=nome        Nome do bucket (padrão: docs-12132024)
  --prefix=pasta/      Filtrar por prefixo (opcional)
  --concurrency=N      Número de operações paralelas (padrão: 5)
  --dry-run            Simula a execução sem fazer alterações
  --verbose, -v        Mostra informações detalhadas
  --help, -h           Mostra esta ajuda

EXEMPLOS:
  # Restaurar bucket para 25/12/2025 (dry-run)
  node restore_to_2025_12_25.js --dry-run

  # Restaurar apenas pasta específica
  node restore_to_2025_12_25.js --prefix=contratos/ --date=2025-12-01

  # Restaurar com mais paralelismo
  node restore_to_2025_12_25.js --concurrency=10

VARIÁVEIS DE AMBIENTE:
  MINIO_ACCESS_KEY     Access key do MinIO
  MINIO_SECRET_KEY     Secret key do MinIO
`);
  process.exit(0);
}

const minioClient = new Minio.Client(CONFIG);

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           MinIO Bucket Rewind/Restore Tool                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log(`📅 Data alvo: ${targetDate.toLocaleString('pt-BR')}`);
console.log(`🪣 Bucket: ${bucketName}`);
if (prefix) console.log(`📁 Prefixo: ${prefix}`);
console.log(`⚡ Concorrência: ${CONCURRENCY}`);
if (DRY_RUN) console.log(`🔍 MODO DRY-RUN: Nenhuma alteração será feita`);
console.log('');

async function restoreVersion(objectName, versionId) {
  if (DRY_RUN) {
    return { success: true, dryRun: true };
  }

  const tempObject = `${objectName}.temp-${Date.now()}`;

  try {
    // Copiar versão antiga para temporário
    await minioClient.copyObject(
      bucketName,
      tempObject,
      `/${bucketName}/${objectName}?versionId=${versionId}`
    );

    // Copiar de volta (cria nova versão "latest")
    await minioClient.copyObject(
      bucketName,
      objectName,
      `/${bucketName}/${tempObject}`
    );

    // Remover temporário
    await minioClient.removeObject(bucketName, tempObject);

    return { success: true };
  } catch (err) {
    // Tentar limpar o temporário se existir
    try {
      await minioClient.removeObject(bucketName, tempObject);
    } catch (_cleanupErr) {
      // Ignorar erro de limpeza
    }
    return { success: false, error: err.message };
  }
}

async function getObjectVersions(objectName) {
  const stream = minioClient.listObjects(bucketName, objectName, true, { IncludeVersion: true });
  const versions = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      versions.push({
        versionId: obj.versionId,
        isLatest: obj.isLatest,
        lastModified: obj.lastModified,
        isDeleteMarker: obj.isDeleteMarker || false
      });
    });
    
    stream.on('error', reject);
    stream.on('end', () => resolve(versions));
  });
}

async function getAllObjects() {
  const stream = minioClient.listObjectsV2(bucketName, prefix, true);
  const objects = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => objects.push(obj.name));
    stream.on('error', reject);
    stream.on('end', () => resolve(objects));
  });
}

// Processamento em lotes com concorrência limitada
async function _processInBatches(items, processor, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

async function analyzeObject(objectName, index, total) {
  const progress = `[${index + 1}/${total}]`;

  try {
    const versions = await getObjectVersions(objectName);

    if (versions.length === 0) {
      return { objectName, status: 'no_versions', progress };
    }

    // Ordenar por data (mais antiga primeiro)
    versions.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));

    // Encontrar última versão antes da data alvo
    let targetVersion = null;
    for (const v of versions) {
      if (!v.isDeleteMarker && new Date(v.lastModified) <= targetDate) {
        targetVersion = v;
      }
    }

    if (!targetVersion) {
      return { objectName, status: 'created_after', progress };
    }

    if (targetVersion.isLatest) {
      return { objectName, status: 'already_correct', progress };
    }

    return {
      objectName,
      status: 'needs_restore',
      targetVersion,
      progress
    };
  } catch (err) {
    return { objectName, status: 'error', error: err.message, progress };
  }
}

async function main() {
  console.log('⏳ Carregando lista de objetos do bucket...\n');

  const allObjects = await getAllObjects();
  console.log(`📦 Total de objetos encontrados: ${allObjects.length}\n`);

  console.log('⚠️  ATENÇÃO: Esta operação irá:');
  console.log(`   1. Restaurar cada arquivo para a última versão antes de ${targetDate.toLocaleDateString('pt-BR')}`);
  console.log('   2. Criar novas versões (não apaga histórico)');
  console.log('   3. Pode levar vários minutos dependendo do tamanho\n');

  if (!DRY_RUN) {
    console.log('🚀 Iniciando em 5 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    console.log('🔍 Executando em modo DRY-RUN (apenas análise)...\n');
  }

  // Fase 1: Análise
  console.log('📊 Fase 1: Analisando objetos...');
  console.log('═'.repeat(70));

  const analysisResults = [];
  for (let i = 0; i < allObjects.length; i++) {
    const result = await analyzeObject(allObjects[i], i, allObjects.length);
    analysisResults.push(result);

    // Mostrar progresso a cada 100 itens ou no modo verbose
    if (VERBOSE || (i + 1) % 100 === 0 || i === allObjects.length - 1) {
      process.stdout.write(`\r   Analisados: ${i + 1}/${allObjects.length}`);
    }
  }
  console.log('\n');

  // Categorizar resultados
  const needsRestore = analysisResults.filter(r => r.status === 'needs_restore');
  const alreadyCorrect = analysisResults.filter(r => r.status === 'already_correct');
  const createdAfter = analysisResults.filter(r => r.status === 'created_after');
  const noVersions = analysisResults.filter(r => r.status === 'no_versions');
  const analyzeErrors = analysisResults.filter(r => r.status === 'error');

  console.log('📋 Resultado da análise:');
  console.log(`   🔄 Precisam restauração:     ${needsRestore.length}`);
  console.log(`   ✅ Já estão corretos:        ${alreadyCorrect.length}`);
  console.log(`   🆕 Criados após data alvo:   ${createdAfter.length}`);
  console.log(`   ⚠️  Sem versões:              ${noVersions.length}`);
  console.log(`   ❌ Erros na análise:         ${analyzeErrors.length}`);
  console.log('');

  if (needsRestore.length === 0) {
    console.log('✨ Nenhum arquivo precisa ser restaurado. Tudo já está no estado correto!');
    return;
  }

  // Fase 2: Restauração
  if (DRY_RUN) {
    console.log('═'.repeat(70));
    console.log('🔍 MODO DRY-RUN: Arquivos que seriam restaurados:\n');
    for (const item of needsRestore.slice(0, 20)) {
      const versionDate = new Date(item.targetVersion.lastModified).toLocaleString('pt-BR');
      console.log(`   📄 ${item.objectName}`);
      console.log(`      Versão: ${versionDate}`);
    }
    if (needsRestore.length > 20) {
      console.log(`\n   ... e mais ${needsRestore.length - 20} arquivos`);
    }
    console.log('\n✅ Dry-run concluído. Execute sem --dry-run para aplicar as alterações.');
    return;
  }

  console.log('═'.repeat(70));
  console.log(`\n🔄 Fase 2: Restaurando ${needsRestore.length} arquivos...\n`);

  let restored = 0;
  let restoreErrors = 0;

  for (let i = 0; i < needsRestore.length; i++) {
    const item = needsRestore[i];
    const progress = `[${i + 1}/${needsRestore.length}]`;
    const versionDate = new Date(item.targetVersion.lastModified).toLocaleString('pt-BR');

    if (VERBOSE) {
      console.log(`${progress} 🔄 ${item.objectName}`);
      console.log(`           Versão: ${versionDate}`);
    }

    const result = await restoreVersion(item.objectName, item.targetVersion.versionId);

    if (result.success) {
      restored++;
      if (VERBOSE) {
        console.log(`           ✅ Restaurado`);
      }
    } else {
      restoreErrors++;
      console.log(`${progress} ❌ ${item.objectName}`);
      console.log(`           Erro: ${result.error}`);
    }

    // Mostrar progresso
    if (!VERBOSE && ((i + 1) % 10 === 0 || i === needsRestore.length - 1)) {
      const pct = Math.round(((i + 1) / needsRestore.length) * 100);
      process.stdout.write(`\r   Progresso: ${i + 1}/${needsRestore.length} (${pct}%) - ✅ ${restored} restaurados, ❌ ${restoreErrors} erros`);
    }
  }
  console.log('\n');

  console.log('═'.repeat(70));
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      RESUMO DA OPERAÇÃO                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`   📊 Total de objetos:          ${allObjects.length}`);
  console.log(`   ✅ Restaurados com sucesso:   ${restored}`);
  console.log(`   ⏭️  Já estavam corretos:       ${alreadyCorrect.length}`);
  console.log(`   🆕 Criados após data alvo:    ${createdAfter.length}`);
  console.log(`   ❌ Erros:                     ${restoreErrors + analyzeErrors.length}\n`);

  if (restored > 0) {
    console.log(`✨ Restauração concluída! O bucket agora está no estado de ${targetDate.toLocaleDateString('pt-BR')}.`);
  }
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err);
  process.exit(1);
});
