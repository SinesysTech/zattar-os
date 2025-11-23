/**
 * Script de teste manual para captura de partes de processo
 *
 * PROPÓSITO:
 * Testar o fluxo completo de captura de partes de um processo específico,
 * incluindo persistência e criação de vínculos.
 *
 * COMO USAR:
 * npx tsx scripts/test-captura-partes.ts
 */

import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { autenticarPJE } from '@/backend/captura/services/trt/trt-auth.service';
import { capturarPartesProcesso } from '@/backend/captura/services/partes/partes-capture.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ProcessoParaCaptura } from '@/backend/captura/services/partes/partes-capture.service';
import type { GrauAcervo } from '@/backend/types/acervo/types';

// ==========================================
// CONFIGURAÇÕES DE TESTE (HARDCODED)
// ==========================================

const PROCESSO_ID = 2887163; // ID do processo na tabela acervo
const TRT = '03'; // TRT3
const GRAU: GrauAcervo = '1'; // Primeiro grau

// Credenciais hardcoded para teste
const CREDENCIAIS = {
  cpf: '07529294610',
  senha: '12345678A@',
};

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function main() {
  console.log('========================================');
  console.log('TESTE DE CAPTURA DE PARTES');
  console.log('========================================\n');

  const supabase = createServiceClient();
  let page: any = null;

  try {
    // 1. Buscar dados do processo no banco
    console.log(`[1/5] Buscando processo ID ${PROCESSO_ID} no banco...`);
    const { data: processoData, error: processoError } = await supabase
      .from('acervo')
      .select('id, numero_processo, id_pje, trt, grau')
      .eq('id', PROCESSO_ID)
      .single();

    if (processoError || !processoData) {
      throw new Error(`Processo ${PROCESSO_ID} não encontrado no banco: ${processoError?.message}`);
    }

    console.log(`✓ Processo encontrado: ${processoData.numero_processo}`);
    console.log(`  - TRT: ${processoData.trt}`);
    console.log(`  - Grau: ${processoData.grau}`);
    console.log(`  - ID PJE: ${processoData.id_pje}\n`);

    const processo: ProcessoParaCaptura = {
      id: processoData.id,
      numero_processo: processoData.numero_processo,
      id_pje: processoData.id_pje,
      trt: processoData.trt,
      grau: processoData.grau,
    };

    // 2. Buscar advogado pelo CPF
    console.log(`[2/5] Buscando advogado com CPF ${CREDENCIAIS.cpf}...`);
    const { data: advogadoData, error: advogadoError } = await supabase
      .from('advogados')
      .select('id, nome, cpf')
      .eq('cpf', CREDENCIAIS.cpf)
      .single();

    if (advogadoError || !advogadoData) {
      throw new Error(`Advogado não encontrado: ${advogadoError?.message}`);
    }

    console.log(`✓ Advogado encontrado: ${advogadoData.nome} (ID: ${advogadoData.id})\n`);

    const advogado = {
      id: advogadoData.id,
      cpf: advogadoData.cpf,
    };

    // 3. Obter configuração do tribunal
    console.log(`[3/5] Obtendo configuração do TRT ${TRT} (${GRAU}º grau)...`);
    const config = await getTribunalConfig(TRT, GRAU);
    console.log(`✓ Configuração obtida: ${config.nome}\n`);

    // 4. Autenticar no PJE
    console.log(`[4/5] Autenticando no PJE...`);
    const authResult = await autenticarPJE({
      credential: CREDENCIAIS,
      config,
      twofauthConfig: {
        accountId: CREDENCIAIS.cpf,
      },
    });

    page = authResult.page;
    console.log(`✓ Autenticação bem-sucedida\n`);

    // 5. Capturar partes do processo
    console.log(`[5/5] Capturando partes do processo ${processo.numero_processo}...`);
    console.log('─'.repeat(60));

    const resultado = await capturarPartesProcesso(page, processo, advogado);

    console.log('─'.repeat(60));
    console.log('\n========================================');
    console.log('RESULTADO DA CAPTURA');
    console.log('========================================\n');

    console.log(`Processo: ${resultado.numeroProcesso} (ID: ${resultado.processoId})`);
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
      console.log(`\nErros encontrados:`);
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
