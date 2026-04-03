// Script exploratório para capturar timeline de processo do PJE
// Objetivo: Entender a estrutura de dados retornada pela API de timeline

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config(); // Carregar .env também se existir

import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { autenticarPJE, getTribunalConfig, obterTimeline, getCredentialByTribunalAndGrau, type AuthResult } from '@/app/(authenticated)/captura/server';

/**
 * Obter __dirname em módulos ES
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Diretório de resultados
 */
const RESULTS_DIR = join(__dirname, 'results', 'timeline-exploratorio');

/**
 * Configurações fixas para teste
 */
const TRT_CODIGO = 'TRT3'; // TRT3 - Minas Gerais
const GRAU = 'primeiro_grau' as const;
const PROCESSO_ID = '2887163'; // ID do processo para teste (ajustar conforme necessário)

/**
 * Função principal
 */
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n🔍 Script Exploratório - Timeline do Processo\n');
  console.log(`TRT: ${TRT_CODIGO}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`Processo ID: ${PROCESSO_ID}\n`);

  let authResult: AuthResult | null = null;

  try {
    // 1. Obter configuração do tribunal
    const config = await getTribunalConfig(TRT_CODIGO, GRAU);
    if (!config) {
      throw new Error(`Configuração não encontrada para ${TRT_CODIGO} - ${GRAU}`);
    }

    console.log(`✅ Configuração obtida: ${config.loginUrl}\n`);

    // 2. Buscar credenciais do banco
    const ADVOGADO_ID = 1;
    const credencial = await getCredentialByTribunalAndGrau({
      advogadoId: ADVOGADO_ID,
      tribunal: TRT_CODIGO,
      grau: GRAU,
    });

    if (!credencial) {
      throw new Error(`Credencial não encontrada para advogado_id=${ADVOGADO_ID}, tribunal=${TRT_CODIGO}, grau=${GRAU}`);
    }

    console.log('🔐 Credenciais obtidas do banco\n');

    // 3. Autenticar no PJE
    console.log('🔑 Autenticando no PJE...\n');
    authResult = await autenticarPJE({
      credential: credencial,
      config,
      headless: true,
    });

    console.log('✅ Autenticação bem-sucedida!\n');
    console.log(`Advogado: ${authResult.advogadoInfo.nome}`);
    console.log(`CPF: ${authResult.advogadoInfo.cpf}`);
    console.log(`ID Advogado: ${authResult.advogadoInfo.idAdvogado}\n`);

    const { page } = authResult;

    // 4. Testar diferentes combinações de parâmetros
    console.log('📡 Testando API de Timeline...\n');

    const testes = [
      {
        nome: 'timeline-completa-docs-assinados',
        options: {
          somenteDocumentosAssinados: true,
          buscarMovimentos: true,
          buscarDocumentos: true,
        },
      },
      {
        nome: 'timeline-completa-todos-docs',
        options: {
          somenteDocumentosAssinados: false,
          buscarMovimentos: true,
          buscarDocumentos: true,
        },
      },
      {
        nome: 'timeline-apenas-movimentos',
        options: {
          somenteDocumentosAssinados: false,
          buscarMovimentos: true,
          buscarDocumentos: false,
        },
      },
      {
        nome: 'timeline-apenas-documentos',
        options: {
          somenteDocumentosAssinados: true,
          buscarMovimentos: false,
          buscarDocumentos: true,
        },
      },
    ];

    // Criar diretório de resultados
    await mkdir(RESULTS_DIR, { recursive: true });

    // Executar testes
    for (const teste of testes) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Teste: ${teste.nome}`);
      console.log(`${'='.repeat(80)}\n`);

      try {
        const timeline = await obterTimeline(page, PROCESSO_ID, teste.options);

        // Analisar estrutura
        console.log('📊 Análise da resposta:');
        console.log(`  Tipo: ${typeof timeline}`);
        
        if (timeline && typeof timeline === 'object') {
          const keys = Object.keys(timeline);
          console.log(`  Propriedades (${keys.length}): ${keys.join(', ')}`);

          // Verificar arrays
          for (const key of keys) {
            const value = (timeline as unknown as Record<string, unknown>)[key];
            if (Array.isArray(value)) {
              console.log(`  - ${key}: Array com ${value.length} itens`);
              if (value.length > 0) {
                console.log(`    Primeiro item:`, JSON.stringify(value[0], null, 2).substring(0, 200) + '...');
              }
            } else if (value && typeof value === 'object') {
              console.log(`  - ${key}: Objeto com propriedades: ${Object.keys(value).join(', ')}`);
            } else {
              console.log(`  - ${key}: ${typeof value} = ${value}`);
            }
          }
        }

        // Salvar resultado completo
        const resultadoPath = join(RESULTS_DIR, `${teste.nome}-${timestamp}.json`);
        await writeFile(
          resultadoPath,
          JSON.stringify({
            timestamp,
            trt: TRT_CODIGO,
            grau: GRAU,
            processoId: PROCESSO_ID,
            opcoes: teste.options,
            resultado: timeline,
          }, null, 2),
          'utf-8'
        );

        console.log(`\n✅ Resultado salvo em: ${resultadoPath}`);

      } catch (error) {
        console.error(`\n❌ Erro no teste ${teste.nome}:`, error);
      }

      // Delay entre testes
      if (testes.indexOf(teste) < testes.length - 1) {
        console.log('\n⏳ Aguardando 2 segundos antes do próximo teste...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('='.repeat(80));
    console.log(`\n📁 Resultados salvos em: ${RESULTS_DIR}\n`);

  } catch (error) {
    console.error('\n❌ Erro durante execução:', error);
    throw error;
  } finally {
    // Limpar recursos
    if (authResult?.browser) {
      await authResult.browser.close();
      console.log('\n🔒 Navegador fechado\n');
    }
  }
}

// Executar
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
