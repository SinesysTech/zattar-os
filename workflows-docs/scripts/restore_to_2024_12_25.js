import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
});

const bucketName = 'docs-12132024';
const targetDate = new Date('2025-12-25T23:59:59.999Z'); // Final do dia 25/12/2025

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         RESTAURAÇÃO DO BUCKET PARA 25/12/2025                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log(`📅 Data alvo: ${targetDate.toLocaleString('pt-BR')}`);
console.log(`🪣 Bucket: ${bucketName}\n`);

async function restoreVersion(objectName, versionId) {
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
    
    return true;
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`);
    // Tentar limpar o temporário se existir
    try {
      await minioClient.removeObject(bucketName, tempObject);
    } catch (cleanupErr) {
      // Ignorar erro de limpeza
    }
    return false;
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
  const stream = minioClient.listObjectsV2(bucketName, '', true);
  const objects = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => objects.push(obj.name));
    stream.on('error', reject);
    stream.on('end', () => resolve(objects));
  });
}

async function main() {
  console.log('⏳ Carregando lista de objetos do bucket...\n');
  
  const allObjects = await getAllObjects();
  console.log(`📦 Total de objetos encontrados: ${allObjects.length}\n`);
  
  console.log('⚠️  ATENÇÃO: Esta operação irá:');
  console.log('   1. Restaurar cada arquivo para a última versão antes de 25/12/2024');
  console.log('   2. Criar novas versões (não apaga histórico)');
  console.log('   3. Pode levar vários minutos dependendo do tamanho\n');
  
  console.log('🚀 Iniciando em 5 segundos... (Ctrl+C para cancelar)\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  let restored = 0;
  let skipped = 0;
  let errors = 0;
  let deletedFiles = 0;
  
  console.log('═'.repeat(70));
  
  for (let i = 0; i < allObjects.length; i++) {
    const objectName = allObjects[i];
    const progress = `[${i + 1}/${allObjects.length}]`;
    
    try {
      // Buscar versões
      const versions = await getObjectVersions(objectName);
      
      if (versions.length === 0) {
        console.log(`${progress} ⏭️  ${objectName} (sem versões)`);
        skipped++;
        continue;
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
        // Arquivo criado DEPOIS da data alvo
        console.log(`${progress} 🆕 ${objectName} (criado depois de 25/12/2025)`);
        skipped++;
        continue;
      }
      
      if (targetVersion.isLatest) {
        // Já é a versão atual
        console.log(`${progress} ✓  ${objectName} (já está correto)`);
        skipped++;
        continue;
      }
      
      // Restaurar versão
      console.log(`${progress} 🔄 ${objectName}`);
      console.log(`           Restaurando versão de ${new Date(targetVersion.lastModified).toLocaleString('pt-BR')}`);
      
      const success = await restoreVersion(objectName, targetVersion.versionId);
      
      if (success) {
        console.log(`           ✅ Restaurado com sucesso`);
        restored++;
      } else {
        errors++;
      }
      
    } catch (err) {
      console.log(`${progress} ❌ ${objectName}`);
      console.log(`           Erro: ${err.message}`);
      errors++;
    }
    
    // Pequena pausa a cada 50 arquivos para não sobrecarregar
    if ((i + 1) % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('═'.repeat(70));
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      RESUMO DA OPERAÇÃO                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`   ✅ Restaurados com sucesso: ${restored}`);
  console.log(`   ⏭️  Ignorados (já corretos):  ${skipped}`);
  console.log(`   ❌ Erros:                     ${errors}`);
  console.log(`   📊 Total processado:          ${allObjects.length}\n`);
  
  if (restored > 0) {
    console.log('✨ Restauração concluída! O bucket agora está no estado de 25/12/2025.');
  }
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err);
  process.exit(1);
});
