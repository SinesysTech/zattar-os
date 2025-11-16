// Script de desenvolvimento para testar captura de Processos Arquivados do TRT
// Simula o fluxo do front-end usando dados mockados

import { arquivadosCapture, type ArquivadosResult } from '@/backend/captura/services/trt/arquivados.service';
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
const RESULTS_DIR = join(__dirname, 'results', 'arquivados');

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
async function testarArquivados(config: TestConfig) {
  const logCapture = new LogCapture();
  logCapture.start();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log('\n🚀 Iniciando teste de captura - Processos Arquivados\n');
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

    console.log('\n⏳ Iniciando autenticação e captura de Processos Arquivados...\n');

    // 5. Executar captura
    const inicio = Date.now();
    const resultado: ArquivadosResult = await arquivadosCapture(params);
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // 6. Mostrar resultados
    console.log('\n✅ Captura concluída com sucesso!\n');
    console.log(`⏱️  Duração: ${duracao} segundos\n`);
    console.log('📊 Resultados:');
    console.log(`  - Total de processos arquivados: ${resultado.total}`);
    
    if (resultado.processos.length > 0) {
      console.log(`  - Primeiros 5 processos:`);
      resultado.processos.slice(0, 5).forEach((proc: Processo, idx: number) => {
        console.log(`    ${idx + 1}. ${proc.numeroProcesso} - ${proc.classeJudicial}`);
        console.log(`       Autora: ${proc.nomeParteAutora}`);
        console.log(`       Ré: ${proc.nomeParteRe}`);
        console.log(`       Data Arquivamento: ${proc.dataArquivamento || 'N/A'}`);
        console.log('');
      });
    }

    // 6. Salvar resultados e logs
    await mkdir(RESULTS_DIR, { recursive: true });
    
    const resultadoPath = join(RESULTS_DIR, 'resultado.json');
    const logsPath = join(RESULTS_DIR, 'logs.txt');

    // Adicionar metadados ao resultado
    const resultadoCompleto = {
      timestamp,
      config: {
        trtCodigo: config.trtCodigo,
        grau: config.grau,
      },
      duracaoSegundos: parseFloat(duracao),
      totalProcessos: resultado.total,
      dados: resultado,
    };

    await writeFile(resultadoPath, JSON.stringify(resultadoCompleto, null, 2), 'utf-8');
    
    logCapture.stop();
    const logsCompletos = `=== LOGS DE EXECUÇÃO ===\n` +
      `Timestamp: ${timestamp}\n` +
      `TRT: ${config.trtCodigo}\n` +
      `Grau: ${config.grau}\n` +
      `Duração: ${duracao} segundos\n` +
      `Total de processos: ${resultado.total}\n\n` +
      `=== LOGS DO CONSOLE ===\n` +
      logCapture.getLogs();

    await writeFile(logsPath, logsCompletos, 'utf-8');

    console.log('\n💾 Arquivos salvos:');
    console.log(`  - Resultado: ${resultadoPath}`);
    console.log(`  - Logs: ${logsPath}`);

    return resultado;
  } catch (error) {
    logCapture.stop();
    
    // Salvar logs mesmo em caso de erro
    await mkdir(RESULTS_DIR, { recursive: true });
    const logsPath = join(RESULTS_DIR, 'logs.txt');
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
 * Executar teste
 */
async function main() {
  const testConfig: TestConfig = {
    trtCodigo: 'TRT1',
    grau: 'primeiro_grau',
  };

  await testarArquivados(testConfig);
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

export { testarArquivados, type TestConfig };
