/**
 * Script para preencher o campo nivel em plano_contas
 * Executa a migration 20260214000000_populate_plano_contas_nivel.sql
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 Iniciando migração do campo nivel...\n');

  try {
    // Buscar todas as contas e atualizar via API
    console.log('📊 Buscando todas as contas...');
    const { data: todasContas, error: errorBusca } = await supabase
      .from('plano_contas')
      .select('id, codigo, conta_pai_id, nivel');

    if (errorBusca) {
      throw new Error(`Erro ao buscar contas: ${errorBusca.message}`);
    }

    if (!todasContas || todasContas.length === 0) {
      console.log('⚠️ Nenhuma conta encontrada');
      return;
    }

    console.log(`✅ Encontradas ${todasContas.length} contas\n`);

    // Identificar quais contas têm filhas
    const contasComFilhas = new Set(
      todasContas
        .filter(c => c.conta_pai_id !== null)
        .map(c => c.conta_pai_id)
    );

    let contasAtualizadas = 0;
    let sinteticas = 0;
    let analiticas = 0;

    // Atualizar cada conta
    for (const conta of todasContas) {
      if (conta.nivel !== null) {
        continue; // Já tem nível definido
      }

      const novoNivel = contasComFilhas.has(conta.id) ? 'sintetica' : 'analitica';
      const aceitaLancamento = novoNivel === 'analitica';

      const { error } = await supabase
        .from('plano_contas')
        .update({
          nivel: novoNivel,
          aceita_lancamento: aceitaLancamento
        })
        .eq('id', conta.id);

      if (error) {
        console.error(`❌ Erro ao atualizar conta ${conta.codigo}:`, error.message);
      } else {
        contasAtualizadas++;
        if (novoNivel === 'sintetica') {
          sinteticas++;
        } else {
          analiticas++;
        }
      }
    }

    console.log('\n✅ Migração concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de contas atualizadas: ${contasAtualizadas}`);
    console.log(`   - Contas sintéticas: ${sinteticas}`);
    console.log(`   - Contas analíticas: ${analiticas}`);

    // Verificar se ainda há contas sem nível
    const { data: contasSemNivel } = await supabase
      .from('plano_contas')
      .select('id, codigo, nome')
      .is('nivel', null);

    if (contasSemNivel && contasSemNivel.length > 0) {
      console.log(`\n⚠️ Ainda existem ${contasSemNivel.length} contas sem nível:`);
      contasSemNivel.forEach(c => {
        console.log(`   - ${c.codigo}: ${c.nome}`);
      });
    } else {
      console.log('\n✅ Todas as contas foram atualizadas com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

main();
