/**
 * Script de Teste: API PJE de Partes
 *
 * PROPÓSITO:
 * Testar integração com endpoints do PJE-TRT para captura de partes processuais:
 * - obterPartesProcesso()
 * - obterRepresentantesPartePorID()
 *
 * REQUISITOS:
 * - Credencial PJE válida com 2FA
 * - Processo real existente no TRT
 * - TRT5 (Bahia) configurado
 *
 * EXECUÇÃO:
 * npx tsx dev_data/scripts/test-pje-partes-api.ts
 *
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * - TWOFAUTH_API_URL
 * - TWOFAUTH_API_TOKEN
 * - TWOFAUTH_ACCOUNT_ID
 */

import { autenticarPJE, obterPartesProcesso, obterRepresentantesPartePorID } from '@/features/captura';
import { getCredentialComplete } from '@/features/advogados';
import type { Page } from 'playwright';
import { chromium } from 'playwright';

// ============================================================================
// CONFIGURAÇÃO DE TESTE
// ============================================================================

const CONFIG_TESTE = {
  // ID da credencial no banco (ajustar conforme seu ambiente)
  credencialId: 1,

  // ID do processo PJE (ajustar para processo real)
  // Exemplo: 123456 (id interno do PJE, não o número processual)
  idProcesso: 0, // AJUSTAR!

  // Tribunal de teste
  trt: 5, // TRT5 - Bahia

  // Timeout para operações
  timeout: 60000, // 60 segundos
};

// ============================================================================
// HELPERS
// ============================================================================

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = {
    info: '📘',
    success: '✅',
    error: '❌',
    warn: '⚠️ ',
  };
  console.log(`${icons[type]} ${message}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// TESTES
// ============================================================================

async function testarObterPartesProcesso(page: Page) {
  logSection('TESTE 1: obterPartesProcesso()');

  try {
    log('Buscando partes do processo...');

    const partes = await obterPartesProcesso(page, CONFIG_TESTE.idProcesso);

    log(`Partes encontradas: ${partes.length}`, 'success');

    // Exibe detalhes de cada parte
    partes.forEach((parte, index) => {
      console.log(`\n  Parte ${index + 1}:`);
      console.log(`    ID: ${parte.idParte}`);
      console.log(`    Nome: ${parte.nome}`);
      console.log(`    Tipo: ${parte.tipoParte}`);
      console.log(`    Polo: ${parte.polo}`);
      console.log(`    CPF/CNPJ: ${parte.numeroDocumento || 'N/A'}`);
      console.log(`    Tipo Pessoa: ${parte.tipoPessoa === 'F' ? 'Física' : 'Jurídica'}`);
      console.log(`    Principal: ${parte.principal ? 'Sim' : 'Não'}`);
      console.log(`    Representantes: ${parte.representantes?.length || 0}`);

      if (parte.representantes && parte.representantes.length > 0) {
        parte.representantes.forEach((rep, repIndex) => {
          console.log(`      ${repIndex + 1}. ${rep.nome} - OAB ${rep.numeroOAB || 'N/A'}/${rep.ufOAB || 'N/A'} - CPF ${rep.numeroDocumento || 'N/A'}`);
        });
      }
    });

    return { success: true, partes };
  } catch (error) {
    log(`Erro ao obter partes: ${error instanceof Error ? error.message : String(error)}`, 'error');
    console.error(error);
    return { success: false, error };
  }
}

async function testarObterRepresentantes(page: Page, idParte: number) {
  logSection('TESTE 2: obterRepresentantesPartePorID()');

  try {
    log(`Buscando representantes da parte ${idParte}...`);

    const representantes = await obterRepresentantesPartePorID(page, idParte);

    log(`Representantes encontrados: ${representantes.length}`, 'success');

    // Exibe detalhes de cada representante
    representantes.forEach((rep, index) => {
      console.log(`\n  Representante ${index + 1}:`);
      console.log(`    ID: ${rep.idRepresentante}`);
      console.log(`    Nome: ${rep.nome}`);
      console.log(`    OAB: ${rep.numeroOAB || 'N/A'} / ${rep.ufOAB || 'N/A'}`);
      console.log(`    CPF: ${rep.numeroDocumento || 'N/A'}`);
      console.log(`    Tipo Pessoa: ${rep.tipoPessoa === 'F' ? 'Física' : 'Jurídica'}`);

      if (rep.telefones && rep.telefones.length > 0) {
        console.log(`    Telefones:`);
        rep.telefones.forEach((tel) => {
          console.log(`      - ${tel.tipo}: ${tel.numero}`);
        });
      }
    });

    return { success: true, representantes };
  } catch (error) {
    log(`Erro ao obter representantes: ${error instanceof Error ? error.message : String(error)}`, 'error');
    console.error(error);
    return { success: false, error };
  }
}

async function testarCasosEspeciais(page: Page) {
  logSection('TESTE 3: Casos Especiais');

  const testes = [];

  // Teste 1: Processo inválido
  try {
    log('Testando com ID de processo inválido (999999)...');
    await obterPartesProcesso(page, 999999);
    testes.push({ nome: 'Processo inválido', resultado: 'FALHOU - Deveria ter lançado erro' });
  } catch {
    log('Erro esperado capturado corretamente', 'success');
    testes.push({ nome: 'Processo inválido', resultado: 'PASSOU' });
  }

  // Teste 2: Parte sem representantes
  try {
    log('Testando parte sem representantes (ID 0)...');
    const reps = await obterRepresentantesPartePorID(page, 0);
    if (Array.isArray(reps) && reps.length === 0) {
      log('Array vazio retornado corretamente', 'success');
      testes.push({ nome: 'Parte sem representantes', resultado: 'PASSOU' });
    } else {
      testes.push({ nome: 'Parte sem representantes', resultado: 'FALHOU' });
    }
  } catch {
    log('Erro ao testar parte sem representantes', 'warn');
    testes.push({ nome: 'Parte sem representantes', resultado: 'FALHOU' });
  }

  // Resumo dos testes especiais
  console.log('\n  Resumo:');
  testes.forEach((teste) => {
    const icon = teste.resultado.includes('PASSOU') ? '✅' : '❌';
    console.log(`    ${icon} ${teste.nome}: ${teste.resultado}`);
  });

  return testes;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🧪 TESTE DE INTEGRAÇÃO: API PJE DE PARTES\n');

  // Validação de configuração
  if (CONFIG_TESTE.idProcesso === 0) {
    log('ERRO: Configure CONFIG_TESTE.idProcesso com um ID de processo real!', 'error');
    log('Você pode obter o ID acessando um processo no PJE e inspecionando a URL', 'info');
    process.exit(1);
  }

  if (!process.env.TWOFAUTH_API_URL || !process.env.TWOFAUTH_API_TOKEN) {
    log('ERRO: Variáveis de ambiente 2FAuth não configuradas!', 'error');
    log('Configure TWOFAUTH_API_URL, TWOFAUTH_API_TOKEN e TWOFAUTH_ACCOUNT_ID', 'info');
    process.exit(1);
  }

  let browser;
  let page: Page;

  try {
    // 1. Buscar credencial
    logSection('SETUP: Autenticação');
    log(`Buscando credencial ID ${CONFIG_TESTE.credencialId}...`);

    const credencial = await getCredentialComplete(CONFIG_TESTE.credencialId);
    if (!credencial) {
      throw new Error(`Credencial ${CONFIG_TESTE.credencialId} não encontrada`);
    }

    log(`Credencial encontrada: ${credencial.usuario}`, 'success');
    log(`Tribunal: TRT${credencial.trt} (${credencial.grau})`);

    // 2. Iniciar browser
    log('Iniciando navegador Chromium...');
    browser = await chromium.launch({
      headless: false, // false para debug visual
      slowMo: 100,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    page = await context.newPage();

    // 3. Autenticar no PJE
    log('Autenticando no PJE...');
    await autenticarPJE({
      page,
      credencial,
      trt: CONFIG_TESTE.trt,
      grau: credencial.grau || 'primeiroGrau',
    });

    log('Autenticação bem-sucedida!', 'success');

    // 4. Executar testes
    const resultadoPartes = await testarObterPartesProcesso(page);

    if (resultadoPartes.success && resultadoPartes.partes && resultadoPartes.partes.length > 0) {
      // Testa obter representantes da primeira parte
      const primeiraParte = resultadoPartes.partes[0];
      await testarObterRepresentantes(page, primeiraParte.idParte);
    }

    await testarCasosEspeciais(page);

    // 5. Relatório final
    logSection('RELATÓRIO FINAL');

    if (resultadoPartes.success) {
      log('Todos os testes principais passaram!', 'success');
      log(`Total de partes capturadas: ${resultadoPartes.partes?.length || 0}`);
      log(`Total de representantes: ${resultadoPartes.partes?.reduce((sum, p) => sum + (p.representantes?.length || 0), 0) || 0}`);
    } else {
      log('Testes falharam - verifique os logs acima', 'error');
    }

    console.log('\n✅ Teste concluído!\n');
  } catch (error) {
    log(`Erro durante execução dos testes: ${error instanceof Error ? error.message : String(error)}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      log('Fechando navegador...');
      await browser.close();
    }
  }
}

// Executar
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
