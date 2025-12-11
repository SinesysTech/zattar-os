/**
 * Script simplificado para teste de captura RAW de partes (sem mapeamento)
 * Salva a resposta crua da API do PJE em JSON
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Carregar variáveis de ambiente do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { autenticarPJE, type ConfigTRT } from '@/features/captura';
import type { GrauAcervo } from '@/features/acervo/types';
import type { Page } from 'playwright';

// ==========================================
// CONFIGURAÇÕES HARDCODED
// ==========================================

// Dados do processo
const PROCESSO = {
  id: 10131, // ID na tabela acervo
  numero_processo: '0000527-84.2025.5.13.0002',
  id_pje: 410213, // ID no PJE (usado na API)
  trt: 'TRT13',
  grau: 'primeiro_grau' as GrauAcervo,
};

// Credenciais de acesso
const CREDENCIAIS = {
  cpf: '07529294610',
  senha: '12345678A@',
};

// Configuração do TRT13
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
// FUNÇÃO PARA CAPTURA RAW
// ==========================================

async function capturarPartesRaw(page: Page, idProcesso: number): Promise<unknown> {
  console.log(`[RAW-CAPTURE] Buscando partes do processo ${idProcesso} via API...`);

  // Fazer requisição direta via evaluate para capturar resposta crua
  const url = `/pje-comum-api/api/processos/id/${idProcesso}/partes`;
  console.log(`[RAW-CAPTURE] URL: ${url}`);

  const response = await page.evaluate(async (apiUrl) => {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  }, url);

  return response;
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function main() {
  console.log('========================================');
  console.log('TESTE DE CAPTURA RAW DE PARTES');
  console.log('========================================\n');

  let page: Page | null = null;

  try {
    // 1. Autenticar no PJE
    console.log(`[1/2] Autenticando no PJE TRT13...`);
    console.log(`  URL: ${CONFIG_TRT13.loginUrl}`);

    const authResult = await autenticarPJE({
      credential: CREDENCIAIS,
      config: CONFIG_TRT13,
    });

    page = authResult.page;
    console.log(`✓ Autenticação bem-sucedida\n`);

    // 2. Capturar partes RAW (sem mapeamento)
    console.log(`[2/2] Capturando partes RAW do processo ${PROCESSO.numero_processo}...`);
    console.log(`  Processo ID PJE: ${PROCESSO.id_pje}`);
    console.log(`  URL da API: ${CONFIG_TRT13.baseUrl}/pje-comum-api/api/processos/id/${PROCESSO.id_pje}/partes`);
    console.log('─'.repeat(80));

    const inicio = Date.now();
    const partesRaw = await capturarPartesRaw(page, PROCESSO.id_pje);
    const duracao = Date.now() - inicio;

    console.log('─'.repeat(80));

    // 3. Salvar resultado em arquivo JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `partes-raw-${PROCESSO.trt}-${PROCESSO.id_pje}-${timestamp}.json`;
    const filepath = path.resolve(process.cwd(), 'dev_data/scripts/results', filename);

    const resultado = {
      metadata: {
        processo: PROCESSO,
        timestamp: new Date().toISOString(),
        duracaoMs: duracao,
        totalPartes: Array.isArray(partesRaw) ? partesRaw.length : 0,
      },
      partesRaw,
    };

    fs.writeFileSync(filepath, JSON.stringify(resultado, null, 2), 'utf-8');

    console.log('\n========================================');
    console.log('RESULTADO DA CAPTURA RAW');
    console.log('========================================\n');
    console.log(`Processo: ${PROCESSO.numero_processo} (ID PJE: ${PROCESSO.id_pje})`);
    console.log(`Total de partes: ${resultado.metadata.totalPartes}`);
    console.log(`Duração: ${duracao}ms (${(duracao / 1000).toFixed(2)}s)`);
    console.log(`\n✅ Arquivo salvo em: ${filepath}`);
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
