// Script de desenvolvimento para testar captura de Audiências do TRT
// Simula o fluxo do front-end usando dados mockados

import { audienciasCapture, type AudienciasResult } from '@/backend/captura/services/trt/audiencias.service';
import { MOCK_CONFIG } from '../storage/mock-config';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import type { CapturaAudienciasParams } from '@/backend/captura/services/trt/trt-capture.service';
import type { CodigoTRT, GrauTRT } from '@/backend/captura/services/trt/types';
import type { Audiencia } from '@/backend/captura/services/trt/pje-api.service';
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
const RESULTS_DIR = join(__dirname, 'results', 'audiencias');

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
async function testarAudiencias(config: TestConfig) {
  const logCapture = new LogCapture();
  logCapture.start();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log('\n🚀 Iniciando teste de captura - Audiências\n');
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

    // 4. Preparar parâmetros (sem datas = usa padrão: hoje até +365 dias)
    const params: CapturaAudienciasParams = {
      credential: {
        cpf: MOCK_CONFIG.advogado.cpf,
        senha: mockCredential.senha,
      },
      config: tribunalConfig,
      twofauthConfig,
      // Não fornecer dataInicio e dataFim = usa comportamento padrão (hoje até +365 dias)
    };

    console.log('\n⏳ Iniciando autenticação e captura de Audiências...\n');
    console.log('📅 Período de busca: Padrão (hoje até +365 dias)');
    console.log('📋 Código de situação: M (Marcadas/Designadas)\n');

    // 5. Executar captura
    const inicio = Date.now();
    const resultado: AudienciasResult = await audienciasCapture(params);
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

    // 6. Mostrar resultados
    console.log('\n✅ Captura concluída com sucesso!\n');
    console.log(`⏱️  Duração: ${duracao} segundos\n`);
    console.log('📊 Resultados:');
    console.log(`  - Período: ${resultado.dataInicio} até ${resultado.dataFim}`);
    console.log(`  - Total de audiências: ${resultado.total}`);
    
    if (resultado.audiencias.length > 0) {
      console.log(`  - Primeiras 5 audiências:`);
      resultado.audiencias.slice(0, 5).forEach((aud: Audiencia, idx: number) => {
        console.log(`    ${idx + 1}. Processo: ${aud.processo?.numero || 'N/A'}`);
        console.log(`       Data/Hora: ${aud.dataInicio}`);
        console.log(`       Tipo: ${aud.tipo?.descricao || 'N/A'}`);
        console.log(`       Sala: ${aud.salaAudiencia?.nome || 'N/A'}`);
        console.log(`       Status: ${aud.status}`);
        if (aud.urlAudienciaVirtual) {
          console.log(`       Virtual: ${aud.urlAudienciaVirtual}`);
        }
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
      periodo: {
        dataInicio: resultado.dataInicio,
        dataFim: resultado.dataFim,
      },
      duracaoSegundos: parseFloat(duracao),
      totalAudiencias: resultado.total,
      dados: resultado,
    };

    await writeFile(resultadoPath, JSON.stringify(resultadoCompleto, null, 2), 'utf-8');
    
    logCapture.stop();
    const logsCompletos = `=== LOGS DE EXECUÇÃO ===\n` +
      `Timestamp: ${timestamp}\n` +
      `TRT: ${config.trtCodigo}\n` +
      `Grau: ${config.grau}\n` +
      `Duração: ${duracao} segundos\n` +
      `Total de audiências: ${resultado.total}\n\n` +
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

  await testarAudiencias(testConfig);
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

export { testarAudiencias, type TestConfig };
