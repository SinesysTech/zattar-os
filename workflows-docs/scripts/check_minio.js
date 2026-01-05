import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
});

const bucketName = 'docs-12132024';

async function checkBucket() {
  try {
    console.log('Verificando acesso ao bucket:', bucketName);
    
    const exists = await minioClient.bucketExists(bucketName);
    console.log('Bucket existe:', exists);
    
    if (exists) {
      console.log('\nListando objetos no bucket:');
      const stream = minioClient.listObjectsV2(bucketName, '', true);
      
      let count = 0;
      const objects = [];
      
      stream.on('data', (obj) => {
        count++;
        objects.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified
        });
        console.log(`${count}. ${obj.name} (${(obj.size / 1024 / 1024).toFixed(2)} MB)`);
      });
      
      stream.on('error', (err) => {
        console.error('Erro ao listar objetos:', err);
      });
      
      stream.on('end', () => {
        console.log(`\nTotal de objetos: ${count}`);
        console.log('Tamanho total:', (objects.reduce((acc, obj) => acc + obj.size, 0) / 1024 / 1024).toFixed(2), 'MB');
      });
    }
  } catch (err) {
    console.error('Erro ao acessar o bucket:', err);
  }
}

checkBucket();
