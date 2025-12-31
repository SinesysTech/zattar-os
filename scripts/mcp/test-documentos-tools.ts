/**
 * Script de teste para tools MCP de Documentos
 *
 * Testa as seguintes tools:
 * - listar_documentos
 * - buscar_documento_por_tags
 * - listar_templates
 * - usar_template
 * - listar_categorias_templates
 * - listar_templates_mais_usados
 *
 * Uso:
 *   npx tsx scripts/mcp/test-documentos-tools.ts
 */

import { executeMcpTool } from '@/lib/mcp';

async function testDocumentosTools() {
  console.log('\n🧪 Testando Tools MCP - Documentos\n');
  console.log('='.repeat(80));

  try {
    // 1. Listar documentos
    console.log('\n📄 1. Listar documentos (limite: 5)');
    console.log('-'.repeat(80));
    const docs = await executeMcpTool('listar_documentos', { limite: 5 });
    console.log('Resultado:', JSON.stringify(docs, null, 2));

    // 2. Listar documentos por pasta
    console.log('\n📁 2. Listar documentos por pasta (pasta_id: 1)');
    console.log('-'.repeat(80));
    const docsPorPasta = await executeMcpTool('listar_documentos', {
      limite: 5,
      pasta_id: 1
    });
    console.log('Resultado:', JSON.stringify(docsPorPasta, null, 2));

    // 3. Buscar documentos por tags
    console.log('\n🏷️  3. Buscar documentos por tags (exemplo: ["contrato", "trabalhista"])');
    console.log('-'.repeat(80));
    const docsPorTags = await executeMcpTool('buscar_documento_por_tags', {
      tags: ['contrato', 'trabalhista'],
      limite: 5,
    });
    console.log('Resultado:', JSON.stringify(docsPorTags, null, 2));

    // 4. Listar templates
    console.log('\n📋 4. Listar templates (limite: 10)');
    console.log('-'.repeat(80));
    const templates = await executeMcpTool('listar_templates', { limite: 10 });
    console.log('Resultado:', JSON.stringify(templates, null, 2));

    // 5. Listar templates por categoria
    console.log('\n📑 5. Listar templates por categoria (categoria: "peticao")');
    console.log('-'.repeat(80));
    const templatesPorCategoria = await executeMcpTool('listar_templates', {
      limite: 10,
      categoria: 'peticao',
    });
    console.log('Resultado:', JSON.stringify(templatesPorCategoria, null, 2));

    // 6. Listar categorias de templates
    console.log('\n🗂️  6. Listar categorias de templates');
    console.log('-'.repeat(80));
    const categorias = await executeMcpTool('listar_categorias_templates', {});
    console.log('Resultado:', JSON.stringify(categorias, null, 2));

    // 7. Listar templates mais usados
    console.log('\n⭐ 7. Listar templates mais usados (limite: 5)');
    console.log('-'.repeat(80));
    const maisUsados = await executeMcpTool('listar_templates_mais_usados', { limite: 5 });
    console.log('Resultado:', JSON.stringify(maisUsados, null, 2));

    // 8. Usar template (comentado para evitar criação acidental)
    console.log('\n✨ 8. Usar template (SKIP - evitar criação acidental)');
    console.log('-'.repeat(80));
    console.log('⚠️  Tool "usar_template" não testada automaticamente.');
    console.log('   Para testar manualmente:');
    console.log('   await executeMcpTool("usar_template", {');
    console.log('     template_id: 1,');
    console.log('     titulo: "Teste de Template",');
    console.log('     pasta_id: null');
    console.log('   });');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Testes concluídos com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    console.error('\nDetalhes:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Executar testes
testDocumentosTools().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
