// Script de teste completo: Captura Timeline + MongoDB + Google Drive

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { capturarTimeline } from '@/features/captura';
import { testMongoConnection, closeMongoConnection } from '@/backend/utils/mongodb/client';
import { createMongoIndexes } from '@/backend/utils/mongodb/collections';

/**
 * Teste completo da captura de timeline
 */
async function testarCapturaTimeline() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTE COMPLETO: Captura Timeline + MongoDB + Google Drive');
    console.log('='.repeat(80) + '\n');

    // 1. Testar conexão MongoDB
    console.log('📡 [1/4] Testando conexão MongoDB...\n');
    const mongoOk = await testMongoConnection();
    if (!mongoOk) {
      throw new Error('Falha na conexão com MongoDB');
    }
    console.log('✅ MongoDB conectado\n');

    // 3. Criar índices MongoDB
    console.log('📊 [2/4] Criando índices MongoDB...\n');
    await createMongoIndexes();
    console.log('✅ Índices criados\n');

    // 4. Capturar timeline (COM DOWNLOADS E UPLOAD GOOGLE DRIVE)
    console.log('📥 [3/4] Capturando timeline do processo...\n');
    
    const resultado = await capturarTimeline({
      trtCodigo: 'TRT3',
      processoId: '2887163',
      numeroProcesso: '0010702-80.2025.5.03.0111',
      grau: 'primeiro_grau',
      advogadoId: 1,
      baixarDocumentos: true,
      filtroDocumentos: {
        apenasNaoSigilosos: true,
        apenasAssinados: true,
      },
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADO DA CAPTURA:');
    console.log('='.repeat(80));
    console.log(`Total de itens na timeline: ${resultado.totalItens}`);
    console.log(`Total de documentos: ${resultado.totalDocumentos}`);
    console.log(`Total de movimentos: ${resultado.totalMovimentos}`);
    console.log(`Documentos baixados com sucesso: ${resultado.totalBaixadosSucesso}`);
    console.log(`Erros ao baixar: ${resultado.totalErros}`);
    
    if (resultado.mongoId) {
      console.log(`\n✅ Timeline salva no MongoDB: ${resultado.mongoId}`);
    }

    console.log('\n📄 DETALHES DOS DOCUMENTOS BAIXADOS:');
    console.log('='.repeat(80));
    
    resultado.documentosBaixados.forEach((doc, i) => {
      console.log(`\n${i + 1}. Documento: ${doc.detalhes.titulo}`);
      console.log(`   ID: ${doc.detalhes.id}`);
      if (doc.pdf) {
        console.log(`   ✅ PDF baixado: ${(doc.pdf.length / 1024).toFixed(2)} KB`);
      }
      if (doc.erro) {
        console.log(`   ❌ Erro: ${doc.erro}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(80) + '\n');

    // 4. Aguardar confirmação do usuário
    console.log('\n⏸️  Pressione ENTER para encerrar...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(null));
    });

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error(error);
  } finally {
    // Cleanup
    console.log('\n🧹 Limpando recursos...');
    
    await closeMongoConnection();
    
    console.log('✅ Recursos liberados\n');
  }
}

// Executar teste
testarCapturaTimeline();
