/**
 * Script de debug para verificar os dados do plano de contas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Buscando dados do plano de contas...\n');

  const { data, error } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome, tipo_conta, nivel, ativo')
    .order('codigo')
    .limit(10);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('📊 Primeiras 10 contas:\n');
  console.table(data);

  console.log('\n🔍 Verificando tipos de dados:');
  if (data && data.length > 0) {
    const primeira = data[0];
    console.log('Exemplo da primeira conta:');
    console.log(JSON.stringify(primeira, null, 2));
    console.log('\nTipos:');
    console.log(`  - nivel: ${typeof primeira.nivel} = ${primeira.nivel}`);
    console.log(`  - tipo_conta: ${typeof primeira.tipo_conta} = ${primeira.tipo_conta}`);
  }
}

main();
