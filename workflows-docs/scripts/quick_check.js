import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'storage-api.sinesys.app',
  useSSL: true,
  accessKey: 'F1Y6wO2FsXLWEjQYSoE8',
  secretKey: 'f0U0KgW9cUcJWUb0pTfa6FxjLUzTnR7PwQ2Tae1l'
});

const bucketName = 'docs-12132024';
const targetDate = new Date('2025-12-25T23:59:59.999Z');

console.log('Verificando bucket...');
console.log('Data alvo:', targetDate.toISOString());
console.log('');

let count = 0;
let beforeCount = 0;

const stream = minioClient.listObjectsV2(bucketName, '', true);

stream.on('data', (obj) => {
  count++;
  const objDate = new Date(obj.lastModified);
  
  if (objDate <= targetDate) {
    beforeCount++;
    if (beforeCount <= 10) {
      console.log(`ANTES: ${obj.name} (${objDate.toISOString()})`);
    }
  }
  
  if (count % 1000 === 0) {
    console.log(`Processados: ${count}, Antes da data: ${beforeCount}`);
  }
  
  // Parar após 5000 objetos
  if (count >= 5000) {
    stream.destroy();
  }
});

stream.on('error', (err) => {
  console.error('Erro:', err.message);
});

stream.on('end', () => {
  console.log('');
  console.log('='.repeat(50));
  console.log(`Total analisado: ${count}`);
  console.log(`Antes de 25/12/2025: ${beforeCount}`);
  console.log(`Depois de 25/12/2025: ${count - beforeCount}`);
  console.log('='.repeat(50));
});
