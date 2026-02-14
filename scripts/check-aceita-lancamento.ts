/**
 * Verifica o campo aceita_lancamento no plano de contas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Verificando campo aceita_lancamento...\n');

  const { data, error } = await supabase
    .from('plano_contas')
    .select('codigo, nome, aceita_lancamento, nivel')
    .order('codigo')
    .limit(15);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('📊 Amostra de contas:\n');

  const resultado = data?.map(c => ({
    codigo: c.codigo,
    nome: c.nome.substring(0, 30),
    aceita_lanc: c.aceita_lancamento,
    nivel_calc: c.aceita_lancamento ? 'analitica' : 'sintetica',
    nivel_db: c.nivel
  }));

  console.table(resultado);

  // Contar totais
  const total = data?.length || 0;
  const analiticas = data?.filter(c => c.aceita_lancamento === true).length || 0;
  const sinteticas = data?.filter(c => c.aceita_lancamento === false).length || 0;
  const nulos = data?.filter(c => c.aceita_lancamento === null).length || 0;

  console.log(`\n📊 Resumo (primeiras ${total} contas):`);
  console.log(`   - Analíticas (aceita_lancamento = true): ${analiticas}`);
  console.log(`   - Sintéticas (aceita_lancamento = false): ${sinteticas}`);
  console.log(`   - NULL (aceita_lancamento = null): ${nulos}`);

  if (nulos > 0) {
    console.log('\n⚠️ PROBLEMA: Existem contas com aceita_lancamento = NULL!');
    console.log('   Essas contas aparecerão como "sintética" no frontend.');
  }
}

main();
