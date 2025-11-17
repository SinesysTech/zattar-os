// Script de teste para captura de Pendentes de Manifestação via API HTTP
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
const RESULTS_DIR = join(__dirname, 'results', 'api-pendentes-manifestacao');

/**
 * API Base URL
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

/**
 * Valores fixos (simulam requisição externa/front-end)
 */
const ADVOGADO_ID = 1; // ID do advogado na tabela advogados
const GRAU = 'segundo_grau'; // Segundo grau

/**
 * Lista de todos os TRTs disponíveis
 */
const TODOS_TRTS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Filtros de prazo para testar (ambos)
 */
const FILTROS_PRAZO: Array<'no_prazo' | 'sem_prazo'> = [
  'no_prazo',
  'sem_prazo',
];

/**
 * Função para fazer requisição HTTP para um TRT específico
 */
async function testarPendentesManifestacaoTRT(trtCodigo: CodigoTRT, filtroPrazo?: 'no_prazo' | 'sem_prazo') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log(`\n🚀 Testando API HTTP - Pendentes de Manifestação - ${trtCodigo}\n`);

    // Validar SERVICE_API_KEY
    if (!SERVICE_API_KEY) {
      throw new Error(
        'SERVICE_API_KEY não configurada. Defina a variável de ambiente SERVICE_API_KEY.'
      );
    }

    // Preparar body da requisição
    const body: Record<string, unknown> = {
      advogado_id: ADVOGADO_ID,
      trt_codigo: trtCodigo,
      grau: GRAU,
    };

    // Adicionar filtroPrazo se fornecido (padrão: sem_prazo)
    if (filtroPrazo) {
      body.filtroPrazo = filtroPrazo;
    }

    // Fazer requisição HTTP para a API
    const inicio = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/captura/trt/pendentes-manifestacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': SERVICE_API_KEY,
      },
      body: JSON.stringify(body),
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
    console.log(`📊 Total de processos pendentes: ${resultado.data?.total || 0}`);
    
    if (resultado.data?.filtroPrazo) {
      console.log(`🔍 Filtro aplicado: ${resultado.data.filtroPrazo}`);
    }
    
    if (resultado.data?.persistencia) {
      console.log(`  - Persistência: ${resultado.data.persistencia.total} processados, ${resultado.data.persistencia.atualizados} atualizados, ${resultado.data.persistencia.erros} erros`);
    }

    // Salvar resultado
    const filtroDir = filtroPrazo || 'sem_prazo';
    const trtDir = join(RESULTS_DIR, filtroDir, trtCodigo.toLowerCase());
    await mkdir(trtDir, { recursive: true });
    const resultadoPath = join(trtDir, `resultado-${timestamp}.json`);
    
    const resultadoCompleto = {
      timestamp,
      trtCodigo,
      grau: GRAU,
      advogadoId: ADVOGADO_ID,
      filtroPrazo: resultado.data?.filtroPrazo || filtroPrazo || 'sem_prazo',
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
 * Função principal - testa todos os TRTs com ambos os filtros de prazo
 */
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n🚀 Iniciando testes de API HTTP - Pendentes de Manifestação - Todos os TRTs (2º Grau) - Ambos os Filtros\n');
  console.log(`Total de TRTs: ${TODOS_TRTS.length}`);
  console.log(`Filtros de prazo: ${FILTROS_PRAZO.join(', ')}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`API URL: ${API_BASE_URL}\n`);

  const resultados: Array<{
    trt: CodigoTRT;
    filtroPrazo: 'no_prazo' | 'sem_prazo';
    sucesso: boolean;
    totalProcessos?: number;
    duracaoSegundos?: number;
    erro?: string;
  }> = [];

  let contadorTotal = 0;
  const totalTestes = TODOS_TRTS.length * FILTROS_PRAZO.length;

  // Iterar por todos os TRTs e para cada TRT, testar ambos os filtros
  for (let i = 0; i < TODOS_TRTS.length; i++) {
    const trtCodigo = TODOS_TRTS[i];

    for (let j = 0; j < FILTROS_PRAZO.length; j++) {
      const filtroPrazo = FILTROS_PRAZO[j];
      contadorTotal++;
      const progresso = `[${contadorTotal}/${totalTestes}]`;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`${progresso} Processando ${trtCodigo} - Filtro: ${filtroPrazo}`);
      console.log(`${'='.repeat(80)}`);

      const resultado = await testarPendentesManifestacaoTRT(trtCodigo, filtroPrazo);
      
      resultados.push({
        trt: trtCodigo,
        filtroPrazo,
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
  const resumoPath = join(RESULTS_DIR, `resumo-geral-segundo-grau-ambos-filtros.json`);
  const resumo = {
    timestamp,
    grau: GRAU,
    advogadoId: ADVOGADO_ID,
    trts: TODOS_TRTS,
    filtrosPrazo: FILTROS_PRAZO,
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
  console.log(`Total de testes realizados: ${totalTestes} (${TODOS_TRTS.length} TRTs × ${FILTROS_PRAZO.length} filtros)`);
  console.log(`✅ Sucessos: ${resumo.sucessos}`);
  console.log(`❌ Falhas: ${resumo.falhas}`);
  console.log(`📦 Total de processos capturados: ${resumo.totalProcessosCapturados}`);
  console.log(`⏱️  Duração total: ${(resumo.duracaoTotalSegundos / 60).toFixed(2)} minutos`);
  console.log(`\n💾 Resumo salvo em: ${resumoPath}`);

  if (resumo.falhas > 0) {
    console.log(`\n⚠️  Testes com falha:`);
    resultados
      .filter((r) => !r.sucesso)
      .forEach((r) => {
        console.log(`  - ${r.trt} (${r.filtroPrazo}): ${r.erro}`);
      });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Teste concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Teste falhou:', error);
      process.exit(1);
    });
}

export { testarPendentesManifestacaoTRT };

