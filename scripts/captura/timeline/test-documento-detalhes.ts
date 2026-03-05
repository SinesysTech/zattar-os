// Script exploratório para testar endpoint de detalhes de documento
// Endpoint: GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}

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
const PROCESSO_ID = '2887163';
const DOCUMENTO_ID = '222702194'; // ID do documento da timeline

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('\n🔍 Script Exploratório - Detalhes do Documento\n');
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

    // 5. Testar diferentes combinações de parâmetros
    const testes = [
      {
        nome: 'documento-com-assinatura-sem-anexos',
        params: {
          incluirAssinatura: true,
          incluirAnexos: false,
          grau: 1,
        },
      },
      {
        nome: 'documento-com-assinatura-com-anexos',
        params: {
          incluirAssinatura: true,
          incluirAnexos: true,
          grau: 1,
        },
      },
      {
        nome: 'documento-sem-assinatura-sem-anexos',
        params: {
          incluirAssinatura: false,
          incluirAnexos: false,
          grau: 1,
        },
      },
      {
        nome: 'documento-completo',
        params: {
          incluirAssinatura: true,
          incluirAnexos: true,
          grau: 1,
        },
      },
    ];

    for (const teste of testes) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Teste: ${teste.nome}`);
      console.log(`${'='.repeat(80)}\n`);

      try {
        const endpoint = `/pje-comum-api/api/processos/id/${PROCESSO_ID}/documentos/id/${DOCUMENTO_ID}`;
        
        console.log(`📡 Endpoint: ${endpoint}`);
        console.log(`📋 Parâmetros:`, teste.params);

        const resultado = await fetchPJEAPI<unknown>(page, endpoint, teste.params);

        // Analisar estrutura
        console.log('\n📊 Análise da resposta:');
        console.log(`  Tipo: ${typeof resultado}`);
        
        if (resultado && typeof resultado === 'object') {
          const keys = Object.keys(resultado);
          console.log(`  Propriedades (${keys.length}):`, keys);
          
          // Procurar campos importantes
          const camposImportantes = [
            'id',
            'idUnicoDocumento',
            'codigoDocumento',
            'titulo',
            'tipo',
            'url',
            'urlDownload',
            'download',
            'arquivo',
            'conteudo',
            'assinatura',
            'assinaturas',
            'anexos',
            'dataAssinatura',
            'signatario',
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
        }

        // Salvar resultado
        const resultadoPath = join(RESULTS_DIR, `${teste.nome}-${timestamp}.json`);
        await writeFile(
          resultadoPath,
          JSON.stringify({
            timestamp,
            trt: TRT_CODIGO,
            grau: GRAU,
            processoId: PROCESSO_ID,
            documentoId: DOCUMENTO_ID,
            parametros: teste.params,
            resultado,
          }, null, 2),
          'utf-8'
        );

        console.log(`\n✅ Resultado salvo em: ${resultadoPath}`);

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
    console.log(`\n📁 Resultados em: ${RESULTS_DIR}\n`);

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
