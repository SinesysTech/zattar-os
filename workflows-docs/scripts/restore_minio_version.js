import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
});

const bucketName = 'docs-12132024';

/**
 * Lista todas as versões de um objeto específico
 */
async function listObjectVersions(objectName) {
  try {
    console.log(`\nListando versões de: ${objectName}\n`);
    
    const stream = minioClient.listObjects(bucketName, objectName, true, { IncludeVersion: true });
    const versions = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        versions.push({
          name: obj.name,
          versionId: obj.versionId,
          isLatest: obj.isLatest,
          lastModified: obj.lastModified,
          size: obj.size
        });
      });
      
      stream.on('error', reject);
      
      stream.on('end', () => {
        // Ordenar por data (mais recente primeiro)
        versions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        versions.forEach((v, idx) => {
          const isLatestTag = v.isLatest ? ' [ATUAL]' : '';
          console.log(`${idx + 1}. VersionID: ${v.versionId}`);
          console.log(`   Data: ${v.lastModified.toLocaleString('pt-BR')}`);
          console.log(`   Tamanho: ${(v.size / 1024 / 1024).toFixed(2)} MB${isLatestTag}\n`);
        });
        
        resolve(versions);
      });
    });
  } catch (err) {
    console.error('Erro ao listar versões:', err);
    throw err;
  }
}

/**
 * Restaura uma versão específica como a versão atual (permanente)
 * Isso copia a versão antiga e a torna a nova versão "latest"
 */
async function restoreVersion(objectName, versionId) {
  try {
    console.log(`\nRestaurando versão ${versionId} de ${objectName}...`);
    
    // 1. Copiar a versão antiga para um objeto temporário
    const tempObject = `${objectName}.temp-restore-${Date.now()}`;
    
    await minioClient.copyObject(
      bucketName,
      tempObject,
      `/${bucketName}/${objectName}?versionId=${versionId}`
    );
    
    console.log('✓ Versão copiada para objeto temporário');
    
    // 2. Copiar o objeto temporário de volta para o objeto original
    // Isso cria uma NOVA versão que é idêntica à versão antiga
    await minioClient.copyObject(
      bucketName,
      objectName,
      `/${bucketName}/${tempObject}`
    );
    
    console.log('✓ Versão restaurada como nova versão atual');
    
    // 3. Remover o objeto temporário
    await minioClient.removeObject(bucketName, tempObject);
    
    console.log('✓ Objeto temporário removido');
    console.log(`\n✅ Versão ${versionId} restaurada com sucesso!`);
    console.log('A versão antiga agora é a versão atual (latest).');
    
  } catch (err) {
    console.error('Erro ao restaurar versão:', err);
    throw err;
  }
}

/**
 * Restaura TODOS os objetos do bucket para uma data específica
 */
async function restoreBucketToDate(targetDate) {
  try {
    console.log(`\n🔄 Restaurando bucket para ${targetDate.toLocaleString('pt-BR')}...\n`);
    
    // Listar todos os objetos
    const stream = minioClient.listObjectsV2(bucketName, '', true);
    const objects = [];
    
    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => objects.push(obj.name));
      stream.on('error', reject);
      stream.on('end', resolve);
    });
    
    console.log(`Total de objetos encontrados: ${objects.length}\n`);
    
    let restored = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const objectName of objects) {
      try {
        // Listar versões do objeto
        const versionStream = minioClient.listObjects(bucketName, objectName, true, { IncludeVersion: true });
        const versions = [];
        
        await new Promise((resolve, reject) => {
          versionStream.on('data', (v) => versions.push(v));
          versionStream.on('error', reject);
          versionStream.on('end', resolve);
        });
        
        // Ordenar versões por data (mais antiga primeiro)
        versions.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));
        
        // Encontrar a última versão ANTES da data alvo
        let targetVersion = null;
        for (const v of versions) {
          if (new Date(v.lastModified) <= targetDate) {
            targetVersion = v;
          } else {
            break;
          }
        }
        
        if (targetVersion && !targetVersion.isLatest) {
          console.log(`Restaurando: ${objectName}`);
          console.log(`  De: ${targetVersion.lastModified.toLocaleString('pt-BR')}`);
          
          await restoreVersion(objectName, targetVersion.versionId);
          restored++;
        } else {
          skipped++;
        }
        
      } catch (err) {
        console.error(`❌ Erro ao processar ${objectName}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ✅ Restaurados: ${restored}`);
    console.log(`   ⏭️  Ignorados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log('='.repeat(60));
    
  } catch (err) {
    console.error('Erro ao restaurar bucket:', err);
    throw err;
  }
}

/**
 * Modo interativo - escolha o que fazer
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📦 MinIO Version Restore Tool\n');
    console.log('Uso:');
    console.log('  1. Listar versões de um objeto:');
    console.log('     node restore_minio_version.js list <caminho/do/arquivo>');
    console.log('');
    console.log('  2. Restaurar versão específica:');
    console.log('     node restore_minio_version.js restore <caminho/do/arquivo> <versionId>');
    console.log('');
    console.log('  3. Restaurar TODO o bucket para uma data:');
    console.log('     node restore_minio_version.js restore-date "2024-12-13 10:30:00"');
    console.log('');
    return;
  }
  
  const command = args[0];
  
  if (command === 'list') {
    const objectName = args[1];
    if (!objectName) {
      console.error('❌ Especifique o caminho do arquivo');
      return;
    }
    await listObjectVersions(objectName);
    
  } else if (command === 'restore') {
    const objectName = args[1];
    const versionId = args[2];
    
    if (!objectName || !versionId) {
      console.error('❌ Especifique o caminho do arquivo e o versionId');
      return;
    }
    
    await restoreVersion(objectName, versionId);
    
  } else if (command === 'restore-date') {
    const dateStr = args[1];
    if (!dateStr) {
      console.error('❌ Especifique a data no formato "YYYY-MM-DD HH:mm:ss"');
      return;
    }
    
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      console.error('❌ Data inválida');
      return;
    }
    
    console.log(`\n⚠️  ATENÇÃO: Esta operação irá restaurar TODOS os objetos do bucket`);
    console.log(`para o estado em ${targetDate.toLocaleString('pt-BR')}`);
    console.log('\nPressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await restoreBucketToDate(targetDate);
    
  } else {
    console.error('❌ Comando inválido');
  }
}

main().catch(console.error);
