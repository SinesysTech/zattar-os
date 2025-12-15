/* eslint-disable no-restricted-imports */
/**
 * Script de teste para captura por OAB
 * Executa: npx tsx scripts/test-captura-oab.ts
 */

import { ComunicaCNJClient } from '../backend/comunica-cnj/client/comunica-cnj-client';
import { executarCaptura } from '../backend/comunica-cnj/services/comunica-cnj/capturar-comunicacoes.service';

const OAB_NUMERO = '128404';
const OAB_UF = 'MG';

async function testConsultaOAB() {
  console.log('====================================');
  console.log(`  TESTE CONSULTA OAB ${OAB_NUMERO}/${OAB_UF}`);
  console.log('====================================\n');

  const client = new ComunicaCNJClient({
    baseUrl: 'https://comunicaapi.pje.jus.br/',
    timeout: 30000,
    maxRetries: 3,
  });

  try {
    console.log('=== Consultando comunicações... ===\n');

    const result = await client.consultarComunicacoes({
      numeroOab: OAB_NUMERO,
      ufOab: OAB_UF,
      itensPorPagina: 100,
    });

    console.log(`✅ Total de comunicações encontradas: ${result.data.paginacao.total}`);
    console.log(`   Itens retornados: ${result.data.comunicacoes.length}`);
    console.log(`   Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}\n`);

    if (result.data.comunicacoes.length > 0) {
      console.log('=== Primeiras 5 comunicações: ===\n');
      result.data.comunicacoes.slice(0, 5).forEach((c, i) => {
        console.log(`${i + 1}. ${c.numeroProcessoComMascara || c.numeroProcesso}`);
        console.log(`   Tribunal: ${c.siglaTribunal}`);
        console.log(`   Tipo: ${c.tipoComunicacao}`);
        console.log(`   Data: ${c.dataDisponibilizacao}`);
        console.log(`   Órgão: ${c.nomeOrgao}`);
        console.log(`   Hash: ${c.hash}`);
        console.log('');
      });
    }

    return result.data;
  } catch (error) {
    console.error('❌ Erro ao consultar:', error);
    return null;
  }
}

async function testCapturaPersistencia() {
  console.log('\n====================================');
  console.log(`  TESTE CAPTURA E PERSISTÊNCIA`);
  console.log('====================================\n');

  try {
    console.log(`Executando captura para OAB ${OAB_NUMERO}/${OAB_UF}...\n`);

    const result = await executarCaptura({
      numero_oab: OAB_NUMERO,
      uf_oab: OAB_UF,
    });

    console.log('=== Resultado da Captura ===\n');
    console.log(`Success: ${result.success}`);
    console.log(`Total processadas: ${result.stats.total}`);
    console.log(`Novas: ${result.stats.novos}`);
    console.log(`Duplicadas: ${result.stats.duplicados}`);
    console.log(`Vinculadas a expedientes: ${result.stats.vinculados}`);
    console.log(`Expedientes criados: ${result.stats.expedientesCriados}`);
    console.log(`Erros: ${result.stats.erros}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\nErros:');
      result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    return result;
  } catch (error) {
    console.error('❌ Erro ao executar captura:', error);
    return null;
  }
}

async function main() {
  // Primeiro testa apenas consulta
  const consulta = await testConsultaOAB();

  if (!consulta || consulta.comunicacoes.length === 0) {
    console.log('\nNenhuma comunicação encontrada para esta OAB.');
    process.exit(0);
  }

  // Se encontrou comunicações, testa a persistência
  console.log('\n--- Prosseguindo com teste de persistência ---\n');
  await testCapturaPersistencia();

  console.log('\n====================================');
  console.log('  TESTE CONCLUÍDO');
  console.log('====================================');
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
