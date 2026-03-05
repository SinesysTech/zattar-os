// Script exploratório para testar endpoint de validação de assinatura
// Endpoint: GET /pje-comum-api/api/assinaturas2/urlvalidacao

import { config } from 'dotenv';
import { resolve, join, dirname } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { autenticarPJE, getTribunalConfig, fetchPJEAPI, type AuthResult } from '@/features/captura/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS_DIR = join(__dirname, 'results', 'timeline-exploratorio');

// Configurações de teste
const TRT_CODIGO = 'TRT3';
const GRAU = 'primeiro_grau' as const;

// Códigos de documento para testar (podem ser obtidos da timeline ou do endpoint de documento)
const CODIGOS_DOCUMENTO = [
  '25071013290252300000221979541', // Código fornecido pelo usuário
];

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n🔍 Script Exploratório - Validação de Assinatura\n');
  console.log(`TRT: ${TRT_CODIGO}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`Códigos de documento a testar: ${CODIGOS_DOCUMENTO.length}\n`);

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
    const senha = '12345678aA@';

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

    // 5. Testar cada código de documento
    for (const codigoDocumento of CODIGOS_DOCUMENTO) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Testando código: ${codigoDocumento}`);
      console.log(`${'='.repeat(80)}\n`);

      try {
        const endpoint = `/pje-comum-api/api/assinaturas2/urlvalidacao`;
        const params = { codigoDocumento };
        
        console.log(`📡 Endpoint: ${endpoint}`);
        console.log(`📋 Parâmetros:`, params);

        const resultado = await fetchPJEAPI<unknown>(page, endpoint, params);

        // Analisar estrutura
        console.log('\n📊 Análise da resposta:');
        console.log(`  Tipo: ${typeof resultado}`);
        
        if (resultado && typeof resultado === 'object') {
          const keys = Object.keys(resultado);
          console.log(`  Propriedades (${keys.length}):`, keys);
          
          // Procurar campos importantes
          const camposImportantes = [
            'url',
            'urlValidacao',
            'urlDownload',
            'urlAssinatura',
            'valida',
            'valido',
            'assinado',
            'assinaturas',
            'codigo',
            'hash',
            'certificado',
          ];

          console.log('\n  🔍 Campos importantes encontrados:');
          for (const campo of camposImportantes) {
            if (campo in resultado) {
              const valor = (resultado as Record<string, unknown>)[campo];
              if (Array.isArray(valor)) {
                console.log(`    ✅ ${campo}: Array[${valor.length}]`);
              } else if (valor && typeof valor === 'object') {
                console.log(`    ✅ ${campo}: Object {${Object.keys(valor).join(', ')}}`);
              } else {
                const valorStr = String(valor).length > 100 
                  ? String(valor).substring(0, 100) + '...'
                  : String(valor);
                console.log(`    ✅ ${campo}: ${valorStr}`);
              }
            }
          }

          // Mostrar estrutura completa (primeiros 500 caracteres)
          console.log('\n  📄 Estrutura (preview):');
          const jsonStr = JSON.stringify(resultado, null, 2);
          console.log(jsonStr.substring(0, 500) + (jsonStr.length > 500 ? '\n  ...' : ''));
        }

        // Salvar resultado
        const nomeArquivo = `assinatura-validacao-${codigoDocumento.substring(0, 20)}-${timestamp}.json`;
        const resultadoPath = join(RESULTS_DIR, nomeArquivo);
        await writeFile(
          resultadoPath,
          JSON.stringify({
            timestamp,
            trt: TRT_CODIGO,
            grau: GRAU,
            codigoDocumento,
            resultado,
          }, null, 2),
          'utf-8'
        );

        console.log(`\n✅ Resultado salvo em: ${resultadoPath}`);

      } catch (error) {
        console.error(`\n❌ Erro ao testar código ${codigoDocumento}:`, error);
      }

      // Delay entre testes
      if (CODIGOS_DOCUMENTO.indexOf(codigoDocumento) < CODIGOS_DOCUMENTO.length - 1) {
        console.log('\n⏳ Aguardando 2 segundos...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ TESTES CONCLUÍDOS!');
    console.log('='.repeat(80));
    console.log(`\n📁 Resultados em: ${RESULTS_DIR}\n`);

    // 6. BONUS: Tentar encontrar codigoDocumento na timeline
    console.log('\n💡 DICA: Para encontrar mais códigos de documento, verifique a timeline:');
    console.log('   - Procure por campo "codigoDocumento" nos documentos da timeline');
    console.log('   - Pode estar em documentos com documento: true\n');

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
