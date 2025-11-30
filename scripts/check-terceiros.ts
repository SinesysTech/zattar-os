import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { getMongoDatabase, closeMongoConnection } from '@/backend/utils/mongodb/client';

async function main() {
  const db = await getMongoDatabase();
  const collection = db.collection('captura_logs_brutos');

  const docs = await collection
    .find({ tipo_captura: 'partes', status: 'success' })
    .sort({ criado_em: -1 })
    .limit(3)
    .toArray();

  for (const doc of docs) {
    const req = doc.requisicao as any;
    const payload = doc.payload_bruto as any;
    console.log('---');
    console.log('Processo:', req?.numero_processo);
    console.log('ATIVO:', payload?.ATIVO?.length || 0);
    console.log('PASSIVO:', payload?.PASSIVO?.length || 0);
    console.log('TERCEIROS:', payload?.TERCEIROS?.length || 0);
    if (payload?.TERCEIROS?.length > 0) {
      console.log('Nomes:', payload.TERCEIROS.map((t: any) => t.nome).join(', '));
    }
  }

  await closeMongoConnection();
}

main();
