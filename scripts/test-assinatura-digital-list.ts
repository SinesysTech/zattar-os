/**
 * Script de teste para verificar a listagem de documentos de assinatura digital
 * 
 * Uso: tsx scripts/test-assinatura-digital-list.ts
 */

import { createServiceClient } from '../src/lib/supabase/service-client';

async function testListDocumentos() {
  console.log('🔍 Testando listagem de documentos de assinatura digital...\n');

  const supabase = createServiceClient();

  // 1. Verificar se a tabela existe (tentando contar)
  console.log('1️⃣ Verificando se a tabela existe...');
  const { error: tableCheckError } = await supabase
    .from('assinatura_digital_documentos')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (tableCheckError) {
    console.error('❌ Erro ao verificar tabela:', tableCheckError.message);
    console.error('Código:', tableCheckError.code);
    console.error('Detalhes:', tableCheckError.details);
    console.error('Hint:', tableCheckError.hint);
    return;
  }

  console.log('✅ Tabela existe e é acessível\n');

  // 2. Contar documentos
  console.log('2️⃣ Contando documentos...');
  const { count, error: countError } = await supabase
    .from('assinatura_digital_documentos')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erro ao contar documentos:', countError.message);
    return;
  }

  console.log(`✅ Total de documentos: ${count || 0}\n`);

  // 3. Listar documentos (query do serviço)
  console.log('3️⃣ Listando documentos (query do serviço)...');
  const { data, error } = await supabase
    .from('assinatura_digital_documentos')
    .select(
      `
      *,
      assinantes:assinatura_digital_documento_assinantes(id, status)
    `
    )
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro ao listar documentos:', error.message);
    console.error('Detalhes:', error);
    return;
  }

  console.log(`✅ Documentos retornados: ${data?.length || 0}`);
  
  if (data && data.length > 0) {
    console.log('\n📄 Primeiros documentos:');
    data.slice(0, 3).forEach((doc: any, index: number) => {
      console.log(`\n   ${index + 1}. ID: ${doc.id}`);
      console.log(`      UUID: ${doc.documento_uuid}`);
      console.log(`      Título: ${doc.titulo || '(sem título)'}`);
      console.log(`      Status: ${doc.status}`);
      console.log(`      Assinantes: ${doc.assinantes?.length || 0}`);
    });
  }

  console.log('\n✅ Teste concluído com sucesso!');
}

testListDocumentos().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
