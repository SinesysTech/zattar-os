/* eslint-disable no-restricted-imports */
/**
 * Script de teste para API Comunica CNJ
 * Executa: npx tsx scripts/test-comunica-cnj-api.ts
 */

import { ComunicaCNJClient } from '../backend/comunica-cnj/client/comunica-cnj-client';

async function testListarTribunais(client: ComunicaCNJClient) {
  console.log('\n=== Teste 1: Listar Tribunais ===');
  try {
    const tribunais = await client.listarTribunais();
    console.log(`✅ Tribunais encontrados: ${tribunais.length}`);
    if (tribunais.length > 0) {
      console.log('Primeiros 5 tribunais:');
      tribunais.slice(0, 5).forEach((t) => {
        console.log(`  - ${t.sigla}: ${t.nome}`);
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao listar tribunais:', error);
    return false;
  }
}

async function testConsultarComunicacoes(client: ComunicaCNJClient) {
  console.log('\n=== Teste 2: Consultar Comunicações (sem filtro, 5 itens) ===');
  try {
    const result = await client.consultarComunicacoes({
      itensPorPagina: 5,
    });
    console.log(`✅ Comunicações encontradas: ${result.data.paginacao.total}`);
    console.log(`   Página: ${result.data.paginacao.pagina}`);
    console.log(`   Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);

    if (result.data.comunicacoes.length > 0) {
      const primeira = result.data.comunicacoes[0];
      console.log('\nPrimeira comunicação:');
      console.log(`  - Tribunal: ${primeira.siglaTribunal}`);
      console.log(`  - Processo: ${primeira.numeroProcesso}`);
      console.log(`  - Tipo: ${primeira.tipoComunicacao}`);
      console.log(`  - Data: ${primeira.dataDisponibilizacao}`);
      console.log(`  - Hash: ${primeira.hash}`);
    }
    return result.data.comunicacoes[0]?.hash || null;
  } catch (error) {
    console.error('❌ Erro ao consultar comunicações:', error);
    return null;
  }
}

async function testConsultarPorTribunal(client: ComunicaCNJClient, siglaTribunal: string) {
  console.log(`\n=== Teste 3: Consultar por Tribunal (${siglaTribunal}) ===`);
  try {
    const result = await client.consultarComunicacoes({
      siglaTribunal,
      itensPorPagina: 5,
    });
    console.log(`✅ Comunicações do ${siglaTribunal}: ${result.data.paginacao.total}`);
    console.log(`   Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao consultar ${siglaTribunal}:`, error);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- função de teste disponível mas comentada no main
async function testConsultarPorOAB(client: ComunicaCNJClient, numeroOab: string, ufOab: string) {
  console.log(`\n=== Teste 4: Consultar por OAB (${numeroOab}/${ufOab}) ===`);
  try {
    const result = await client.consultarComunicacoes({
      numeroOab,
      ufOab,
      itensPorPagina: 5,
    });
    console.log(`✅ Comunicações para OAB ${numeroOab}/${ufOab}: ${result.data.paginacao.total}`);
    console.log(`   Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);

    if (result.data.comunicacoes.length > 0) {
      console.log('\nComunicações encontradas:');
      result.data.comunicacoes.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.numeroProcesso} - ${c.tipoComunicacao} (${c.dataDisponibilizacao})`);
      });
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao consultar OAB:`, error);
    return false;
  }
}

async function testRateLimitStatus(client: ComunicaCNJClient) {
  console.log('\n=== Teste 5: Status Rate Limit ===');
  const status = client.getRateLimitStatus();
  console.log(`Rate Limit Status:`);
  console.log(`  - Limite: ${status.limit}`);
  console.log(`  - Restantes: ${status.remaining}`);
  console.log(`  - Reset: ${status.resetAt?.toISOString() || 'N/A'}`);
  return true;
}

async function main() {
  console.log('====================================');
  console.log('  TESTE API COMUNICA CNJ');
  console.log('====================================');
  console.log(`Data: ${new Date().toISOString()}`);

  const client = new ComunicaCNJClient({
    baseUrl: 'https://comunicaapi.pje.jus.br/',
    timeout: 30000,
    maxRetries: 3,
  });

  const results: Record<string, boolean> = {};

  // Teste 1: Listar tribunais
  results['listarTribunais'] = await testListarTribunais(client);

  // Teste 2: Consultar comunicações sem filtro
  const hash = await testConsultarComunicacoes(client);
  results['consultarComunicacoes'] = hash !== null;

  // Teste 3: Consultar por tribunal (TRT2 - São Paulo)
  results['consultarPorTribunal'] = await testConsultarPorTribunal(client, 'TRT2');

  // Teste 4: Consultar por OAB (usar uma OAB de teste se disponível)
  // Comentado por padrão - descomentar e usar OAB real para testar
  // results['consultarPorOAB'] = await testConsultarPorOAB(client, '123456', 'SP');

  // Teste 5: Rate Limit Status
  results['rateLimitStatus'] = await testRateLimitStatus(client);

  // Resumo
  console.log('\n====================================');
  console.log('  RESUMO DOS TESTES');
  console.log('====================================');

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test}`);
    if (result) passed++;
    else failed++;
  }

  console.log(`\nTotal: ${passed} passou, ${failed} falhou`);
  console.log('====================================');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
