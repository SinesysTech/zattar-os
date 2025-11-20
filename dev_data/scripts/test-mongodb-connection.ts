// Script para testar conexão com MongoDB e criar índices

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local PRIMEIRO
const envPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envPath });

if (result.error) {
  console.error('❌ Erro ao carregar .env.local:', result.error);
  process.exit(1);
}

console.log('✅ .env.local carregado de:', envPath);
console.log('🔑 MONGODB_URL:', process.env.MONGODB_URL ? '✅ Definida' : '❌ Não definida');
console.log('📁 MONGODB_DATABASE:', process.env.MONGODB_DATABASE || '❌ Não definida');

import { testMongoConnection, closeMongoConnection } from '../../lib/mongodb/client';
import { createMongoIndexes } from '../../lib/mongodb/collections';

async function main() {
  console.log('\n🧪 Teste de Conexão MongoDB\n');

  try {
    // 1. Testar conexão
    console.log('📡 Testando conexão...\n');
    const connected = await testMongoConnection();

    if (!connected) {
      throw new Error('Falha ao conectar ao MongoDB');
    }

    console.log('\n✅ Conexão estabelecida com sucesso!\n');

    // 2. Criar índices
    console.log('📊 Criando índices...\n');
    await createMongoIndexes();

    console.log('\n✅ Índices criados com sucesso!\n');

    console.log('='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

main();
