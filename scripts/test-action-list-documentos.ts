/**
 * Script de teste para verificar a action actionListDocumentos
 * 
 * Uso: npx tsx scripts/test-action-list-documentos.ts
 */

import * as documentosService from '../src/app/app/assinatura-digital/feature/services/documentos.service';

async function testActionListDocumentos() {
  console.log('🔍 Testando action actionListDocumentos...\n');

  try {
    console.log('1️⃣ Chamando documentosService.listDocumentos...');
    const resultado = await documentosService.listDocumentos({
      limit: 20,
    });

    console.log('✅ Serviço retornou com sucesso');
    console.log(`   Documentos: ${resultado.documentos.length}`);
    
    if (resultado.documentos.length > 0) {
      console.log('\n📄 Estrutura do primeiro documento:');
      const doc = resultado.documentos[0];
      console.log('   Campos presentes:', Object.keys(doc).join(', '));
      console.log('\n   Valores:');
      console.log(`   - id: ${doc.id}`);
      console.log(`   - documento_uuid: ${doc.documento_uuid}`);
      console.log(`   - titulo: ${doc.titulo || '(null)'}`);
      console.log(`   - status: ${doc.status}`);
      console.log(`   - _assinantes_count: ${doc._assinantes_count}`);
      console.log(`   - _assinantes_concluidos: ${doc._assinantes_concluidos}`);
      console.log(`   - selfie_habilitada: ${doc.selfie_habilitada}`);
      console.log(`   - pdf_original_url: ${doc.pdf_original_url ? 'presente' : 'ausente'}`);
      console.log(`   - pdf_final_url: ${doc.pdf_final_url ? 'presente' : 'null'}`);
      console.log(`   - created_at: ${doc.created_at}`);
      console.log(`   - updated_at: ${doc.updated_at}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao chamar serviço:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testActionListDocumentos();
