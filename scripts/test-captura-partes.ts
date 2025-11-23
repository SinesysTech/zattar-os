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

// Dados do processo (hardcoded para teste)
const PROCESSO_ID_ACERVO = 2887163; // ID na tabela acervo (se precisar persistir vínculos)
const PROCESSO_ID_PJE = 2887163; // ID no PJE (usado na URL da API)
const PROCESSO_NUMERO = '0010344-62.2024.5.03.0030'; // Número CNJ (opcional, pode deixar genérico)
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
    // 1. Buscar advogado pelo CPF (apenas para pegar o ID)
    console.log(`[1/4] Buscando advogado com CPF ${CREDENCIAIS.cpf}...`);
    const { data: advogadoData, error: advogadoError } = await supabase
      .from('advogados')
      .select('id, nome_completo, cpf')
      .eq('cpf', CREDENCIAIS.cpf)
      .single();

    if (advogadoError || !advogadoData) {
      throw new Error(`Advogado não encontrado: ${advogadoError?.message}`);
    }

    console.log(`✓ Advogado encontrado: ${advogadoData.nome_completo} (ID: ${advogadoData.id})\n`);

    const advogado = {
      id: advogadoData.id,
      cpf: advogadoData.cpf,
    };

    // 2. Criar objeto do processo com dados hardcoded
    console.log(`[2/4] Preparando dados do processo...`);
    const processo: ProcessoParaCaptura = {
      id: PROCESSO_ID_ACERVO,
      numero_processo: PROCESSO_NUMERO,
      id_pje: PROCESSO_ID_PJE,
      trt: TRT,
      grau: GRAU,
    };
    console.log(`✓ Processo: ${processo.numero_processo}`);
    console.log(`  - TRT: ${processo.trt}`);
    console.log(`  - Grau: ${processo.grau}`);
    console.log(`  - ID PJE: ${processo.id_pje}\n`);

    // 3. Obter configuração do tribunal e autenticar no PJE
    console.log(`[3/4] Obtendo configuração do TRT ${TRT} e autenticando...`);
    const grauTRT = GRAU === '1' ? 'primeiro_grau' : 'segundo_grau';
    const codigoTRT = `TRT${TRT}` as any; // TRT + código = TRT03
    const config = await getTribunalConfig(codigoTRT, grauTRT);
    console.log(`✓ Configuração obtida: ${config.nome}`);

    const authResult = await autenticarPJE({
      credential: CREDENCIAIS,
      config,
      twofauthConfig: {
        accountId: CREDENCIAIS.cpf,
      },
    });

    page = authResult.page;
    console.log(`✓ Autenticação bem-sucedida\n`);

    // 4. Capturar partes do processo
    console.log(`[4/4] Capturando partes do processo ${processo.numero_processo}...`);
    console.log(`URL da API: https://pje.trt${TRT}.jus.br/pje-comum-api/api/processos/id/${PROCESSO_ID_PJE}/partes?retornaEndereco=true`);
    console.log('─'.repeat(80));

    const resultado = await capturarPartesProcesso(page, processo, advogado);

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
