/**
 * Script simplificado para teste de captura de partes
 * Usa configurações hardcoded e apenas funções essenciais
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { autenticarPJE, capturarPartesProcesso, type ProcessoParaCaptura, type ConfigTRT } from '@/features/captura';
import type { GrauAcervo } from '@/features/acervo/types';

// ==========================================
// CONFIGURAÇÕES HARDCODED
// ==========================================

// Dados do processo
const PROCESSO: ProcessoParaCaptura = {
  id: 10131, // ID na tabela acervo
  numero_processo: '0000527-84.2025.5.13.0002',
  id_pje: 410213, // ID no PJE (usado na API)
  trt: 'TRT13',
  grau: 'primeiro_grau' as GrauAcervo,
};

// Dados do advogado
const ADVOGADO = {
  id: 1, // ID do advogado na tabela
  cpf: '07529294610',
};

// Credenciais de acesso
const CREDENCIAIS = {
  cpf: '07529294610',
  senha: '12345678A@',
};

// Configuração do TRT1 (obtida do banco via MCP)
const CONFIG_TRT13: ConfigTRT = {
  codigo: 'TRT13',
  nome: 'TRT da 13ª Região',
  grau: 'primeiro_grau',
  tipoAcesso: 'primeiro_grau',
  loginUrl: 'https://pje.trt13.jus.br/primeirograu/login.seam',
  baseUrl: 'https://pje.trt13.jus.br',
  apiUrl: 'https://pje.trt13.jus.br/pje-comum-api/api',
};

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function main() {
  console.log('========================================');
  console.log('TESTE DE CAPTURA DE PARTES (SIMPLIFICADO)');
  console.log('========================================\n');

  let page: Awaited<ReturnType<typeof autenticarPJE>>['page'] | null = null;

  try {
    // 1. Autenticar no PJE
    console.log(`[1/2] Autenticando no PJE TRT1...`);
    console.log(`  URL: ${CONFIG_TRT13.loginUrl}`);

    const authResult = await autenticarPJE({
      credential: CREDENCIAIS,
      config: CONFIG_TRT13,
      // twofauthConfig não precisa ser passado - usa variáveis de ambiente do .env.local
      // TWOFAUTH_ACCOUNT_ID=3 (ID da conta no 2FAuth)
    });

    page = authResult.page;
    console.log(`✓ Autenticação bem-sucedida\n`);

    // 2. Capturar partes do processo
    console.log(`[2/2] Capturando partes do processo ${PROCESSO.numero_processo}...`);
    console.log(`  Processo ID PJE: ${PROCESSO.id_pje}`);
    console.log(`  URL da API: ${CONFIG_TRT13.baseUrl}/pje-comum-api/api/processos/id/${PROCESSO.id_pje}/partes`);
    console.log('─'.repeat(80));

    const resultado = await capturarPartesProcesso(page, PROCESSO, ADVOGADO);

    console.log('─'.repeat(80));
    console.log('\n========================================');
    console.log('RESULTADO DA CAPTURA');
    console.log('========================================\n');

    console.log(`Processo: ${resultado.numeroProcesso} (ID Acervo: ${resultado.processoId})`);
    console.log(`\nEstatísticas:`);
    console.log(`  • Total de partes encontradas: ${resultado.totalPartes}`);
    console.log(`  • Clientes: ${resultado.clientes}`);
    console.log(`  • Partes contrárias: ${resultado.partesContrarias}`);
    console.log(`  • Terceiros: ${resultado.terceiros}`);
    console.log(`  • Representantes salvos: ${resultado.representantes}`);
    console.log(`  • Vínculos criados: ${resultado.vinculos}`);
    console.log(`  • Erros: ${resultado.erros.length}`);
    console.log(`  • Duração: ${resultado.duracaoMs}ms (${(resultado.duracaoMs / 1000).toFixed(2)}s)`);

    if (resultado.erros.length > 0) {
      console.log(`\n⚠ Erros encontrados:`);
      resultado.erros.forEach((erro, index) => {
        console.log(`  ${index + 1}. Parte ${erro.parteIndex + 1} (${erro.parteDados.nome}):`);
        console.log(`     ${erro.erro}`);
      });
    }

    console.log('\n✓ Teste concluído com sucesso!\n');

    // Fechar browser
    if (page) {
      await page.context().browser()?.close();
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:\n');
    console.error(error);

    // Fechar browser em caso de erro
    if (page) {
      try {
        await page.context().browser()?.close();
      } catch (closeError) {
        console.error('Erro ao fechar browser:', closeError);
      }
    }

    process.exit(1);
  }
}

// Executar
main();
