// Script para testar download de documento PDF
// Endpoint: GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo

import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { autenticarPJE, getTribunalConfig, type AuthResult } from '@/features/captura';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS_DIR = join(__dirname, 'results', 'timeline-exploratorio', 'documentos-pdf');

// Configurações de teste
const TRT_CODIGO = 'TRT3';
const GRAU = 'primeiro_grau' as const;
const PROCESSO_ID = '2887163';
const DOCUMENTO_ID = '222702194';

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n📥 Script de Download - Documento PDF\n');
  console.log(`TRT: ${TRT_CODIGO}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`Processo ID: ${PROCESSO_ID}`);
  console.log(`Documento ID: ${DOCUMENTO_ID}\n`);

  let authResult: AuthResult | null = null;

  try {
    // 1. Obter configuração
    const config = await getTribunalConfig(TRT_CODIGO, GRAU);
    if (!config) {
      throw new Error(`Configuração não encontrada para ${TRT_CODIGO} - ${GRAU}`);
    }

    console.log(`✅ Configuração obtida: ${config.loginUrl}\n`);

    // 2. Credenciais fixas
    const cpf = '07529294610';
    const senha = '12345678A@';

    console.log('🔐 Usando credenciais de teste\n');

    // 3. Autenticar
    console.log('🔑 Autenticando no PJE...\n');
    authResult = await autenticarPJE({
      credential: { cpf, senha },
      config,
      headless: true,
    });

    console.log('✅ Autenticação bem-sucedida!\n');
    console.log(`Advogado: ${authResult.advogadoInfo.nome}`);
    console.log(`ID Advogado: ${authResult.advogadoInfo.idAdvogado}\n`);

    const { page } = authResult;

    // 4. Criar diretório de resultados
    await mkdir(RESULTS_DIR, { recursive: true });

    // 5. Testar diferentes combinações
    const testes = [
      {
        nome: 'pdf-com-assinatura-sem-capa',
        params: {
          incluirCapa: false,
          grau: 1,
          incluirAssinatura: true,
        },
      },
      {
        nome: 'pdf-com-assinatura-com-capa',
        params: {
          incluirCapa: true,
          grau: 1,
          incluirAssinatura: true,
        },
      },
      {
        nome: 'pdf-sem-assinatura-sem-capa',
        params: {
          incluirCapa: false,
          grau: 1,
          incluirAssinatura: false,
        },
      },
    ];

    for (const teste of testes) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Teste: ${teste.nome}`);
      console.log(`${'='.repeat(80)}\n`);

      try {
        const endpoint = `/pje-comum-api/api/processos/id/${PROCESSO_ID}/documentos/id/${DOCUMENTO_ID}/conteudo`;
        
        console.log(`📡 Endpoint: ${endpoint}`);
        console.log(`📋 Parâmetros:`, teste.params);

        // Construir URL completa
        const baseUrl = config.baseUrl || 'https://pje.trt3.jus.br';
        const queryParams = new URLSearchParams(
          Object.entries(teste.params).map(([k, v]) => [k, String(v)])
        );
        const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;

        console.log(`\n🌐 URL completa: ${fullUrl}`);

        // Fazer requisição diretamente com page.evaluate para obter binário
        console.log('\n📥 Baixando PDF...');
        
        const pdfBuffer = await page.evaluate(async (url) => {
          const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // Incluir cookies de autenticação
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');

          console.log('Response headers:', {
            contentType,
            contentLength,
            status: response.status,
          });

          // Obter como ArrayBuffer
          const arrayBuffer = await response.arrayBuffer();
          
          // Converter para array de bytes
          return Array.from(new Uint8Array(arrayBuffer));
        }, fullUrl);

        const buffer = Buffer.from(pdfBuffer);

        console.log(`\n✅ PDF baixado com sucesso!`);
        console.log(`   Tamanho: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);

        // Salvar PDF
        const pdfPath = join(RESULTS_DIR, `${teste.nome}-doc${DOCUMENTO_ID}-${timestamp}.pdf`);
        await writeFile(pdfPath, buffer);

        console.log(`\n💾 PDF salvo em: ${pdfPath}`);

        // Verificar se é realmente um PDF
        const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';
        console.log(`\n🔍 Verificação: ${isPDF ? '✅ Arquivo PDF válido' : '❌ NÃO é um PDF válido'}`);

        if (!isPDF) {
          // Salvar também como .txt para ver o conteúdo
          const txtPath = join(RESULTS_DIR, `${teste.nome}-doc${DOCUMENTO_ID}-${timestamp}.txt`);
          await writeFile(txtPath, buffer.toString('utf8', 0, Math.min(1000, buffer.length)));
          console.log(`⚠️  Primeiros bytes salvos em: ${txtPath}`);
        }

      } catch (error) {
        console.error(`\n❌ Erro no teste ${teste.nome}:`, error);
      }

      // Delay entre testes
      if (testes.indexOf(teste) < testes.length - 1) {
        console.log('\n⏳ Aguardando 2 segundos...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TESTES CONCLUÍDOS!');
    console.log('='.repeat(80));
    console.log(`\n📁 PDFs salvos em: ${RESULTS_DIR}\n`);

  } catch (error) {
    console.error('\n❌ Erro durante execução:', error);
    throw error;
  } finally {
    if (authResult?.browser) {
      await authResult.browser.close();
      console.log('\n🔒 Navegador fechado\n');
    }
  }
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
