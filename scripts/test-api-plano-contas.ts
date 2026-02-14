/**
 * Testa a API do plano de contas diretamente
 */

// Simular o ambiente Next.js
process.env.NEXT_RUNTIME = 'nodejs';

import { actionListarPlanoContas } from '../src/features/financeiro/actions/plano-contas';

async function main() {
  console.log('🔍 Testando actionListarPlanoContas...\n');

  const result = await actionListarPlanoContas({ ativo: true });

  if (!result.success) {
    console.error('❌ Erro:', result.error);
    return;
  }

  console.log(`✅ Sucesso! Retornadas ${result.data?.length || 0} contas\n`);

  // Mostrar primeiras 5 contas
  const primeiras = result.data?.slice(0, 5) || [];

  console.log('📊 Primeiras 5 contas:\n');
  primeiras.forEach(c => {
    console.log(`${c.codigo.padEnd(15)} ${c.nome.padEnd(35)} nivel=${c.nivel}`);
  });

  // Verificar tipos
  if (primeiras.length > 0) {
    const primeira = primeiras[0];
    console.log('\n🔍 Tipos da primeira conta:');
    console.log(`  - nivel: ${typeof primeira.nivel} = "${primeira.nivel}"`);
    console.log(`  - tipoConta: ${typeof primeira.tipoConta} = "${primeira.tipoConta}"`);
    console.log(`  - aceita_lancamento: ${typeof primeira.aceitaLancamento} = ${primeira.aceitaLancamento}`);
  }
}

main();
