// Script para testar se a API de documento funciona com idUnicoDocumento da timeline

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

import { autenticarPJE } from '@/backend/captura/services/trt/trt-auth.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { fetchPJEAPI } from '@/backend/api/pje-trt';

/**
 * Configurações fixas para teste
 */
const TRT_CODIGO = 'TRT3';
const GRAU = 'primeiro_grau' as const;
const ID_DOCUMENTO = '85def44'; // idUnicoDocumento do primeiro documento da timeline

/**
 * Função principal
 */
async function main() {
  console.log('\n🔍 Testando API de Documento com idUnicoDocumento da Timeline\n');
  console.log(`TRT: ${TRT_CODIGO}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`ID Documento: ${ID_DOCUMENTO}\n`);

  let authResult = null;

  try {
    // 1. Obter configuração do tribunal
    const config = await getTribunalConfig(TRT_CODIGO, GRAU);
    if (!config) {
      throw new Error(`Configuração não encontrada para ${TRT_CODIGO} - ${GRAU}`);
    }

    console.log(`✅ Configuração obtida: ${config.loginUrl}\n`);

    // 2. Credenciais fixas
    const cpf = '07529294610';
    const senha = '12345678A@';

    // 3. Autenticar no PJE
    console.log('🔑 Autenticando no PJE...\n');
    authResult = await autenticarPJE({
      credential: { cpf, senha },
      config,
      headless: true,
    });

    console.log('✅ Autenticação bem-sucedida!\n');
    const { page } = authResult;

    // 4. Testar endpoint usado em pendentes de manifestação
    console.log('📡 Teste 1: Endpoint /pje-comum-api/api/paineladvogado/documento\n');
    try {
      const resultado1 = await fetchPJEAPI(
        page,
        `/pje-comum-api/api/paineladvogado/documento`,
        { idUnico: ID_DOCUMENTO }
      );
      console.log('✅ SUCESSO! API retornou:');
      console.log(JSON.stringify(resultado1, null, 2));
    } catch (error) {
      console.error('❌ FALHOU:', error instanceof Error ? error.message : error);
    }

    // 5. Testar endpoint alternativo (se existir)
    console.log('\n📡 Teste 2: Endpoint /pje-comum-api/api/documento/{idUnico}\n');
    try {
      const resultado2 = await fetchPJEAPI(
        page,
        `/pje-comum-api/api/documento/${ID_DOCUMENTO}`
      );
      console.log('✅ SUCESSO! API retornou:');
      console.log(JSON.stringify(resultado2, null, 2));
    } catch (error) {
      console.error('❌ FALHOU:', error instanceof Error ? error.message : error);
    }

    // 6. Testar endpoint de processos
    console.log('\n📡 Teste 3: Endpoint /pje-comum-api/api/processos/documento/{idUnico}\n');
    try {
      const resultado3 = await fetchPJEAPI(
        page,
        `/pje-comum-api/api/processos/documento/${ID_DOCUMENTO}`
      );
      console.log('✅ SUCESSO! API retornou:');
      console.log(JSON.stringify(resultado3, null, 2));
    } catch (error) {
      console.error('❌ FALHOU:', error instanceof Error ? error.message : error);
    }

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
