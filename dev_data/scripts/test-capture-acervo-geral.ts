// Script de desenvolvimento para testar captura de Acervo Geral do TRT
// Simula o fluxo do front-end usando dados mockados

import { acervoGeralCapture, type AcervoGeralResult } from '@/backend/captura/services/trt/acervo-geral.service';
import { MOCK_CONFIG } from '../storage/mock-config';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import type { CapturaTRTParams } from '@/backend/captura/services/trt/trt-capture.service';
import type { CodigoTRT, GrauTRT } from '@/backend/captura/services/trt/types';
import type { Processo } from '@/backend/captura/services/trt/pje-api.service';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Configuração do teste
 */
interface TestConfig {
  trtCodigo: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório de resultados
 */
const RESULTS_DIR = join(__dirname, 'results', 'acervo-geral');

/**
 * Lista de todos os TRTs disponíveis
 */
const TODOS_TRTS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
  'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16',
  'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Captura logs do console
 */
class LogCapture {
  private logs: string[] = [];
  private originalLog = console.log;
  private originalError = console.error;
  private originalWarn = console.warn;

  start() {
    this.logs = [];
    console.log = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      this.logs.push(`[LOG] ${message}`);
      this.originalLog(...args);
    };
    console.error = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      this.logs.push(`[ERROR] ${message}`);
      this.originalError(...args);
    };
    console.warn = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      this.logs.push(`[WARN] ${message}`);
      this.originalWarn(...args);
    };
  }

  stop() {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.warn = this.originalWarn;
  }

  getLogs(): string {
    return this.logs.join('\n');
  }
}

/**
 * Função principal de teste
 */
async function testarAcervoGeral(config: TestConfig) {
  const logCapture = new LogCapture();
  logCapture.start();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log('\n🚀 Iniciando teste de captura - Acervo Geral\n');
    console.log('Configuração:');
    console.log(`  - TRT: ${config.trtCodigo}`);
    console.log(`  - Grau: ${config.grau}`);
    console.log(`  - Timestamp: ${timestamp}\n`);

    // 1. Buscar credencial mockada por TRT e grau
    const mockCredential = MOCK_CONFIG.getCredential(
      config.trtCodigo,
      config.grau
    );
    if (!mockCredential) {
      throw new Error(
        `Credencial não encontrada para ${config.trtCodigo} - ${config.grau}`
      );
    }

    console.log('✅ Credencial encontrada:', {
      advogado: MOCK_CONFIG.advogado.nome_completo,
      cpf: MOCK_CONFIG.advogado.cpf,
      oab: `${MOCK_CONFIG.advogado.oab}/${MOCK_CONFIG.advogado.uf_oab}`,
    });

    // 2. Buscar configuração do tribunal
    const tribunalConfig = getTribunalConfig(config.trtCodigo, config.grau);
    if (!tribunalConfig) {
      throw new Error(`Configuração do tribunal ${config.trtCodigo} - ${config.grau} não encontrada`);
    }

    console.log('✅ Configuração do tribunal encontrada:', {
      nome: tribunalConfig.nome,
      loginUrl: tribunalConfig.loginUrl,
      baseUrl: tribunalConfig.baseUrl,
    });

    // 3. Preparar configuração 2FAuth (usa mock para desenvolvimento)
    const twofauthConfig = MOCK_CONFIG.twoFAuth;

    // 4. Preparar parâmetros
    const params: CapturaTRTParams = {
      credential: {
        cpf: MOCK_CONFIG.advogado.cpf,
        senha: mockCredential.senha,
      },
      config: tribunalConfig,
      twofauthConfig,
    };

    console.log('\n⏳ Iniciando autenticação e captura de Acervo Geral...\n');

    // 5. Executar captura
    const inicio = Date.now();
    const resultado: AcervoGeralResult = await acervoGeralCapture(params);
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // 6. Mostrar resultados
    console.log('\n✅ Captura concluída com sucesso!\n');
    console.log(`⏱️  Duração: ${duracao} segundos\n`);
    console.log('📊 Resultados:');
    console.log(`  - Total de processos: ${resultado.total}`);
    
    // Mostrar informações de persistência se disponível
    if (resultado.persistencia) {
      console.log(`  - Persistência no banco:`);
      console.log(`    • Total processado: ${resultado.persistencia.total}`);
      console.log(`    • Atualizados: ${resultado.persistencia.atualizados}`);
      console.log(`    • Erros: ${resultado.persistencia.erros}`);
    }
    
    if (resultado.processos.length > 0) {
      console.log(`  - Primeiros 5 processos:`);
      resultado.processos.slice(0, 5).forEach((proc: Processo, idx: number) => {
        console.log(`    ${idx + 1}. ${proc.numeroProcesso} - ${proc.classeJudicial}`);
        console.log(`       Autora: ${proc.nomeParteAutora}`);
        console.log(`       Ré: ${proc.nomeParteRe}`);
        console.log(`       Órgão: ${proc.descricaoOrgaoJulgador}`);
        console.log('');
      });
    }

    // 7. Salvar resultados e logs (por TRT)
    const trtDir = join(RESULTS_DIR, config.trtCodigo.toLowerCase());
    await mkdir(trtDir, { recursive: true });
    
    const resultadoPath = join(trtDir, `resultado-${timestamp}.json`);
    const logsPath = join(trtDir, `logs-${timestamp}.txt`);

    // Adicionar metadados ao resultado
    const resultadoCompleto = {
      timestamp,
      config: {
        trtCodigo: config.trtCodigo,
        grau: config.grau,
      },
      duracaoSegundos: parseFloat(duracao),
      totalProcessos: resultado.total,
      persistencia: resultado.persistencia,
      dados: resultado,
    };

    await writeFile(resultadoPath, JSON.stringify(resultadoCompleto, null, 2), 'utf-8');
    
    logCapture.stop();
    const persistenciaInfo = resultado.persistencia
      ? `Persistência: ${resultado.persistencia.total} processados, ${resultado.persistencia.atualizados} atualizados, ${resultado.persistencia.erros} erros\n`
      : 'Persistência: Não disponível\n';
    
    const logsCompletos = `=== LOGS DE EXECUÇÃO ===\n` +
      `Timestamp: ${timestamp}\n` +
      `TRT: ${config.trtCodigo}\n` +
      `Grau: ${config.grau}\n` +
      `Duração: ${duracao} segundos\n` +
      `Total de processos: ${resultado.total}\n` +
      persistenciaInfo +
      `\n=== LOGS DO CONSOLE ===\n` +
      logCapture.getLogs();

    await writeFile(logsPath, logsCompletos, 'utf-8');

    console.log('\n💾 Arquivos salvos:');
    console.log(`  - Resultado: ${resultadoPath}`);
    console.log(`  - Logs: ${logsPath}`);

    return resultado;
  } catch (error) {
    logCapture.stop();
    
    // Salvar logs mesmo em caso de erro
    const trtDir = join(RESULTS_DIR, config.trtCodigo.toLowerCase());
    await mkdir(trtDir, { recursive: true });
    const logsPath = join(trtDir, `logs-${timestamp}.txt`);
    const logsCompletos = `=== LOGS DE EXECUÇÃO (ERRO) ===\n` +
      `Timestamp: ${timestamp}\n` +
      `TRT: ${config.trtCodigo}\n` +
      `Grau: ${config.grau}\n\n` +
      `=== ERRO ===\n` +
      `${error instanceof Error ? error.message : String(error)}\n\n` +
      `=== LOGS DO CONSOLE ===\n` +
      logCapture.getLogs();

    await writeFile(logsPath, logsCompletos, 'utf-8');

    console.error('\n❌ Erro durante captura:');
    if (error instanceof Error) {
      console.error(`  Mensagem: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error('  Erro desconhecido:', error);
    }
    throw error;
  }
}

/**
 * Executar teste para todos os TRTs (primeiro grau)
 */
async function main() {
  const grau: GrauTRT = 'primeiro_grau';
  const resultados: Array<{
    trt: CodigoTRT;
    sucesso: boolean;
    totalProcessos?: number;
    duracaoSegundos?: number;
    erro?: string;
    persistencia?: {
      total: number;
      atualizados: number;
      erros: number;
    };
  }> = [];

  console.log(`\n🚀 Iniciando captura de Acervo Geral para todos os TRTs (${grau})\n`);
  console.log(`Total de TRTs: ${TODOS_TRTS.length}\n`);

  for (let i = 0; i < TODOS_TRTS.length; i++) {
    const trtCodigo = TODOS_TRTS[i];
    const progresso = `[${i + 1}/${TODOS_TRTS.length}]`;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`${progresso} Processando ${trtCodigo}...`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      const inicio = Date.now();
      const resultado = await testarAcervoGeral({
        trtCodigo,
        grau,
      });
      const duracaoSegundos = (Date.now() - inicio) / 1000;

      resultados.push({
        trt: trtCodigo,
        sucesso: true,
        totalProcessos: resultado.total,
        duracaoSegundos,
        persistencia: resultado.persistencia,
      });

      console.log(`\n✅ ${trtCodigo} concluído com sucesso!`);
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      resultados.push({
        trt: trtCodigo,
        sucesso: false,
        erro: erroMsg,
      });

      console.error(`\n❌ ${trtCodigo} falhou: ${erroMsg}`);
    }

    // Delay entre TRTs para evitar sobrecarga
    if (i < TODOS_TRTS.length - 1) {
      console.log('\n⏳ Aguardando 5 segundos antes do próximo TRT...\n');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Salvar resumo geral
  const resumoPath = join(RESULTS_DIR, 'resumo-geral.json');
  const resumo = {
    timestamp: new Date().toISOString(),
    grau,
    totalTRTs: TODOS_TRTS.length,
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
  console.log(`Total de TRTs processados: ${TODOS_TRTS.length}`);
  console.log(`✅ Sucessos: ${resumo.sucessos}`);
  console.log(`❌ Falhas: ${resumo.falhas}`);
  console.log(`📦 Total de processos capturados: ${resumo.totalProcessosCapturados}`);
  console.log(`⏱️  Duração total: ${(resumo.duracaoTotalSegundos / 60).toFixed(2)} minutos`);
  console.log(`\n💾 Resumo salvo em: ${resumoPath}`);

  if (resumo.falhas > 0) {
    console.log(`\n⚠️  TRTs com falha:`);
    resultados
      .filter((r) => !r.sucesso)
      .forEach((r) => {
        console.log(`  - ${r.trt}: ${r.erro}`);
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

export { testarAcervoGeral, type TestConfig };
