// Script de teste completo: Captura Timeline + MongoDB + Google Drive

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { chromium, Browser, Page } from 'playwright';
import { capturarTimeline } from '@/backend/captura/services/timeline/timeline-capture.service';
import { testMongoConnection, closeMongoConnection } from '@/lib/mongodb/client';
import { createMongoIndexes } from '@/lib/mongodb/collections';

/**
 * Teste completo da captura de timeline
 */
async function testarCapturaTimeline() {
  let browser: Browser | undefined;
  let page: Page | undefined;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTE COMPLETO: Captura Timeline + MongoDB + Google Drive');
    console.log('='.repeat(80) + '\n');

    // 1. Testar conexão MongoDB
    console.log('📡 [1/5] Testando conexão MongoDB...\n');
    const mongoOk = await testMongoConnection();
    if (!mongoOk) {
      throw new Error('Falha na conexão com MongoDB');
    }
    console.log('✅ MongoDB conectado\n');

    // 2. Criar índices MongoDB
    console.log('📊 [2/5] Criando índices MongoDB...\n');
    await createMongoIndexes();
    console.log('✅ Índices criados\n');

    // 3. Inicializar Playwright
    console.log('🌐 [3/5] Inicializando browser...\n');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500,
    });
    page = await browser.newPage();
    console.log('✅ Browser inicializado\n');

    // 4. Capturar timeline (COM DOWNLOADS E UPLOAD GOOGLE DRIVE)
    console.log('📥 [4/5] Capturando timeline do processo...\n');
    
    const resultado = await capturarTimeline({
      page,
      trtCodigo: 'TRT3', // Ajuste conforme necessário
      processoId: '2887163', // Ajuste conforme necessário
      grau: 'primeiro_grau',
      advogadoId: 1, // Ajuste conforme necessário
      // Filtros para documentos (opcional)
      filtros: {
        apenasNaoSigilosos: true, // Apenas documentos não sigilosos
        // apenasAssinados: true, // Apenas documentos assinados
      },
      // IMPORTANTE: Ativar download de documentos
      baixarDocumentos: true,
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

    // 5. Aguardar confirmação do usuário
    console.log('\n⏸️  Pressione ENTER para encerrar e fechar o browser...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(null));
    });

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error(error);
  } finally {
    // Cleanup
    console.log('\n🧹 Limpando recursos...');
    
    if (page) {
      await page.close();
    }
    
    if (browser) {
      await browser.close();
    }
    
    await closeMongoConnection();
    
    console.log('✅ Recursos liberados\n');
  }
}

// Executar teste
testarCapturaTimeline();
