// Script de teste para captura de Acervo Geral via API HTTP
// Simula requisições externas/front-end fazendo POST para todos os TRTs

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config(); // Carregar .env também se existir

import type { CodigoTRT } from '@/backend/captura/services/trt/types';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório de resultados
 */
const RESULTS_DIR = join(__dirname, 'results', 'api-acervo-geral');

/**
 * API Base URL
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

/**
 * Valores fixos (simulam requisição externa/front-end)
 */
const ADVOGADO_ID = 1; // ID do advogado na tabela advogados

/**
 * Lista de todos os TRTs disponíveis
 */
const TODOS_TRTS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Graus para testar (primeiro grau primeiro, depois segundo grau)
 */
const GRAUS: Array<'primeiro_grau' | 'segundo_grau'> = [
  'primeiro_grau',
  'segundo_grau',
];

/**
 * Função para fazer requisição HTTP para um TRT específico
 */
async function testarAcervoGeralTRT(trtCodigo: CodigoTRT, grau: 'primeiro_grau' | 'segundo_grau') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log(`\n🚀 Testando API HTTP - Acervo Geral - ${trtCodigo}\n`);

    // Validar SERVICE_API_KEY
    if (!SERVICE_API_KEY) {
      throw new Error(
        'SERVICE_API_KEY não configurada. Defina a variável de ambiente SERVICE_API_KEY.'
      );
    }

    // Fazer requisição HTTP para a API
    const inicio = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/captura/trt/acervo-geral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': SERVICE_API_KEY,
      },
      body: JSON.stringify({
        advogado_id: ADVOGADO_ID,
        trt_codigo: trtCodigo,
        grau,
      }),
    });

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // Validar resposta
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `API Error ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const resultado = await response.json();

    // Mostrar resultados
    console.log(`✅ ${trtCodigo} - API respondeu com sucesso!`);
    console.log(`⏱️  Duração: ${duracao} segundos`);
    console.log(`📊 Total de processos: ${resultado.data?.total || 0}`);
    
    if (resultado.data?.persistencia) {
      console.log(`  - Persistência: ${resultado.data.persistencia.total} processados, ${resultado.data.persistencia.atualizados} atualizados, ${resultado.data.persistencia.erros} erros`);
    }

    // Salvar resultado
    const trtDir = join(RESULTS_DIR, trtCodigo.toLowerCase());
    await mkdir(trtDir, { recursive: true });
    const resultadoPath = join(trtDir, `resultado-${timestamp}.json`);
    
    const resultadoCompleto = {
      timestamp,
      trtCodigo,
      grau,
      advogadoId: ADVOGADO_ID,
      duracaoSegundos: parseFloat(duracao),
      resultado,
    };

    await writeFile(
      resultadoPath,
      JSON.stringify(resultadoCompleto, null, 2),
      'utf-8'
    );

    return { sucesso: true, trtCodigo, resultado, duracaoSegundos: parseFloat(duracao) };
  } catch (error) {
    console.error(`\n❌ ${trtCodigo} - Erro ao testar API:`);
    if (error instanceof Error) {
      console.error(`  Mensagem: ${error.message}`);
    } else {
      console.error('  Erro desconhecido:', error);
    }
    return { sucesso: false, trtCodigo, erro: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Função principal - testa todos os TRTs
 */
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n🚀 Iniciando testes de API HTTP - Acervo Geral - Todos os TRTs\n');
  console.log(`Total de TRTs: ${TODOS_TRTS.length}`);
  console.log(`Graus: ${GRAUS.join(' → ')}`);
  console.log(`Total de testes: ${TODOS_TRTS.length * GRAUS.length} (${TODOS_TRTS.length} TRTs × ${GRAUS.length} graus)`);
  console.log(`API URL: ${API_BASE_URL}\n`);

  const resultados: Array<{
    trt: CodigoTRT;
    grau: 'primeiro_grau' | 'segundo_grau';
    sucesso: boolean;
    totalProcessos?: number;
    duracaoSegundos?: number;
    erro?: string;
  }> = [];

  let contadorTotal = 0;
  const totalTestes = TODOS_TRTS.length * GRAUS.length;

  // Primeiro: todos os TRTs no primeiro grau
  // Depois: todos os TRTs no segundo grau
  for (let g = 0; g < GRAUS.length; g++) {
    const grau = GRAUS[g];
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 FASE ${g + 1}/${GRAUS.length}: ${grau === 'primeiro_grau' ? '1º GRAU' : '2º GRAU'}`);
    console.log(`${'='.repeat(80)}\n`);

    for (let i = 0; i < TODOS_TRTS.length; i++) {
      const trtCodigo = TODOS_TRTS[i];
      contadorTotal++;
      const progresso = `[${contadorTotal}/${totalTestes}]`;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`${progresso} Processando ${trtCodigo} - ${grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}`);
      console.log(`${'='.repeat(80)}`);

      const resultado = await testarAcervoGeralTRT(trtCodigo, grau);
      
      resultados.push({
        trt: trtCodigo,
        grau,
        sucesso: resultado.sucesso,
        totalProcessos: resultado.sucesso ? resultado.resultado?.data?.total : undefined,
        duracaoSegundos: resultado.duracaoSegundos,
        erro: resultado.erro,
      });

      // Delay entre testes para evitar sobrecarga
      if (contadorTotal < totalTestes) {
        console.log('\n⏳ Aguardando 2 segundos antes do próximo teste...\n');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Salvar resumo geral
  await mkdir(RESULTS_DIR, { recursive: true });
  const resumoPath = join(RESULTS_DIR, 'resumo-geral-ambos-graus.json');
  const resumo = {
    timestamp,
    graus: GRAUS,
    totalTRTs: TODOS_TRTS.length,
    totalTestes: totalTestes,
    sucessos: resultados.filter((r) => r.sucesso).length,
    falhas: resultados.filter((r) => !r.sucesso).length,
    totalProcessosCapturados: resultados
      .filter((r) => r.sucesso)
      .reduce((sum, r) => sum + (r.totalProcessos || 0), 0),
    duracaoTotalSegundos: resultados
      .filter((r) => r.sucesso)
      .reduce((sum, r) => sum + (r.duracaoSegundos || 0), 0),
    resultados,
  };

  await writeFile(resumoPath, JSON.stringify(resumo, null, 2), 'utf-8');

  // Mostrar resumo final
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 RESUMO FINAL');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total de testes realizados: ${totalTestes} (${TODOS_TRTS.length} TRTs × ${GRAUS.length} graus)`);
  console.log(`✅ Sucessos: ${resumo.sucessos}`);
  console.log(`❌ Falhas: ${resumo.falhas}`);
  console.log(`📦 Total de processos capturados: ${resumo.totalProcessosCapturados}`);
  console.log(`⏱️  Duração total: ${(resumo.duracaoTotalSegundos / 60).toFixed(2)} minutos`);
  console.log(`\n💾 Resumo salvo em: ${resumoPath}`);

  // Mostrar resumo por grau
  console.log(`\n📊 Resumo por Grau:`);
  for (const grau of GRAUS) {
    const resultadosGrau = resultados.filter((r) => r.grau === grau);
    const sucessosGrau = resultadosGrau.filter((r) => r.sucesso).length;
    const falhasGrau = resultadosGrau.filter((r) => !r.sucesso).length;
    console.log(`  ${grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}: ${sucessosGrau} sucessos, ${falhasGrau} falhas`);
  }

  if (resumo.falhas > 0) {
    console.log(`\n⚠️  Testes com falha:`);
    resultados
      .filter((r) => !r.sucesso)
      .forEach((r) => {
        console.log(`  - ${r.trt} (${r.grau === 'primeiro_grau' ? '1º' : '2º'} grau): ${r.erro}`);
      });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(async () => {
      console.log('\n✅ Teste concluído com sucesso!');
      // Aguardar um pouco para garantir que todos os recursos assíncronos sejam limpos
      // Isso previne o erro "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"
      await new Promise((resolve) => setTimeout(resolve, 500));
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Teste falhou:', error);
      // Aguardar antes de sair mesmo em caso de erro
      await new Promise((resolve) => setTimeout(resolve, 500));
      process.exit(1);
    });
}

export { testarAcervoGeralTRT };

