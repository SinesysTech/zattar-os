import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
});

const bucketName = 'docs-12132024';
const targetDate = new Date('2025-12-25T23:59:59.999Z');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         ANÁLISE DE DATAS DO BUCKET                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log(`📅 Data alvo: ${targetDate.toLocaleString('pt-BR')}`);
console.log(`📅 Hoje: ${new Date().toLocaleString('pt-BR')}\n`);

async function analyzeBucket() {
  try {
    console.log('⏳ Analisando primeiros 1000 objetos...\n');
    
    const stream = minioClient.listObjectsV2(bucketName, '', true);
    
    let count = 0;
    let beforeTarget = 0;
    let afterTarget = 0;
    let oldestDate = null;
    let newestDate = null;
    let sampleBefore = [];
    let sampleAfter = [];
    
    stream.on('data', (obj) => {
      count++;
      const objDate = new Date(obj.lastModified);
      
      if (!oldestDate || objDate < oldestDate) {
        oldestDate = objDate;
      }
      if (!newestDate || objDate > newestDate) {
        newestDate = objDate;
      }
      
      if (objDate <= targetDate) {
        beforeTarget++;
        if (sampleBefore.length < 5) {
          sampleBefore.push({
            name: obj.name,
            date: objDate
          });
        }
      } else {
        afterTarget++;
        if (sampleAfter.length < 5) {
          sampleAfter.push({
            name: obj.name,
            date: objDate
          });
        }
      }
      
      // Limitar a 1000 objetos para análise rápida
      if (count >= 1000) {
        stream.destroy();
      }
    });
    
    stream.on('error', (err) => {
      console.error('❌ Erro:', err);
    });
    
    stream.on('end', () => {
      console.log('═'.repeat(70));
      console.log(`📊 ANÁLISE DE ${count} OBJETOS:\n`);
      console.log(`📅 Arquivo mais antigo: ${oldestDate?.toLocaleString('pt-BR')}`);
      console.log(`📅 Arquivo mais recente: ${newestDate?.toLocaleString('pt-BR')}\n`);
      console.log(`✅ Antes de 25/12/2025: ${beforeTarget} (${((beforeTarget/count)*100).toFixed(1)}%)`);
      console.log(`🆕 Depois de 25/12/2025: ${afterTarget} (${((afterTarget/count)*100).toFixed(1)}%)\n`);
      
      if (sampleBefore.length > 0) {
        console.log('📄 EXEMPLOS DE ARQUIVOS ANTES DA DATA ALVO:');
        sampleBefore.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.name}`);
          console.log(`      Data: ${s.date.toLocaleString('pt-BR')}\n`);
        });
      }
      
      if (sampleAfter.length > 0) {
        console.log('📄 EXEMPLOS DE ARQUIVOS DEPOIS DA DATA ALVO:');
        sampleAfter.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.name}`);
          console.log(`      Data: ${s.date.toLocaleString('pt-BR')}\n`);
        });
      }
      
      console.log('═'.repeat(70));
      
      if (beforeTarget === 0) {
        console.log('\n⚠️  ATENÇÃO: Nenhum arquivo encontrado antes de 25/12/2025!');
        console.log('   Isso significa que NÃO HÁ O QUE RESTAURAR.');
        console.log('   Todos os arquivos foram criados DEPOIS da data alvo.\n');
      } else {
        console.log(`\n✅ Encontrados ${beforeTarget} arquivos que existiam em 25/12/2025`);
        console.log('   O script de restauração deve processar estes arquivos.\n');
      }
    });
    
  } catch (err) {
    console.error('❌ Erro fatal:', err);
  }
}

analyzeBucket();
