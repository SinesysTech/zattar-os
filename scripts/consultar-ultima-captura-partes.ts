/**
 * Script para consultar a última captura de partes no MongoDB
 */

import { getCapturaRawLogsCollection } from '@/backend/utils/mongodb/collections';
import { closeMongoConnection } from '@/backend/utils/mongodb/client';

async function consultarUltimaCaptura() {
  try {
    console.log('🔍 [MongoDB] Consultando última captura de partes...\n');

    const collection = await getCapturaRawLogsCollection();

    // Buscar a última captura de partes, ordenada por data de criação
    const ultimaCaptura = await collection
      .find({ tipo_captura: 'partes' })
      .sort({ criado_em: -1 })
      .limit(1)
      .toArray();

    if (ultimaCaptura.length === 0) {
      console.log('❌ Nenhuma captura de partes encontrada no MongoDB.');
      return;
    }

    const captura = ultimaCaptura[0];

    console.log('✅ Última captura de partes encontrada:\n');
    console.log('📋 Informações gerais:');
    console.log(`  - ID: ${captura._id}`);
    console.log(`  - Status: ${captura.status}`);
    console.log(`  - TRT: ${captura.trt || 'N/A'}`);
    console.log(`  - Grau: ${captura.grau || 'N/A'}`);
    console.log(`  - Criado em: ${captura.criado_em}`);
    console.log(`  - Advogado ID: ${captura.advogado_id || 'N/A'}`);
    console.log(`  - Credencial ID: ${captura.credencial_id || 'N/A'}`);

    if (captura.requisicao) {
      console.log('\n📝 Requisição:');
      console.log(`  - Número Processo: ${captura.requisicao.numero_processo || 'N/A'}`);
      console.log(`  - ID PJE: ${captura.requisicao.id_pje || 'N/A'}`);
      console.log(`  - Processo ID: ${captura.requisicao.processo_id || 'N/A'}`);
    }

    if (captura.resultado_processado) {
      console.log('\n📊 Resultado processado:');
      console.log(`  - Total de partes: ${captura.resultado_processado.total_partes || 0}`);
      console.log(`  - Clientes: ${captura.resultado_processado.clientes || 0}`);
      console.log(`  - Partes contrárias: ${captura.resultado_processado.partes_contrarias || 0}`);
      console.log(`  - Terceiros: ${captura.resultado_processado.terceiros || 0}`);
      console.log(`  - Representantes: ${captura.resultado_processado.representantes || 0}`);
      console.log(`  - Vínculos: ${captura.resultado_processado.vinculos || 0}`);
    }

    if (captura.logs && captura.logs.length > 0) {
      console.log('\n📄 Logs:');
      captura.logs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });
    }

    if (captura.erro) {
      console.log(`\n❌ Erro: ${captura.erro}`);
    }

    if (captura.payload_bruto) {
      console.log('\n📦 Payload bruto (JSON):');
      console.log(JSON.stringify(captura.payload_bruto, null, 2));
    } else {
      console.log('\n⚠️ Payload bruto não disponível.');
    }

  } catch (error) {
    console.error('❌ Erro ao consultar MongoDB:', error);
  } finally {
    await closeMongoConnection();
  }
}

consultarUltimaCaptura();
