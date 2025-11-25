// Script temporário para aplicar migration de locks
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔍 Verificando se tabela locks existe...');

    // Verificar se tabela existe
    const { data: tables, error: checkError } = await supabase
      .from('locks')
      .select('key')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tabela locks já existe!');
      console.log('📊 Verificando locks ativos...');

      const { data: activeLocks, error: countError } = await supabase
        .from('locks')
        .select('key, expires_at, created_at');

      if (!countError) {
        console.log(`📈 Total de locks ativos: ${activeLocks?.length || 0}`);
        if (activeLocks && activeLocks.length > 0) {
          console.log('🔒 Locks ativos:');
          activeLocks.forEach(lock => {
            console.log(`  - ${lock.key} (expires: ${lock.expires_at})`);
          });
        }
      }

      return;
    }

    console.log('📝 Tabela não existe. Lendo arquivo de migration...');

    // Ler arquivo SQL
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251125000000_create_locks_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Aplicando migration...');

    // Executar SQL via RPC (se disponível) ou informar que precisa aplicar manualmente
    console.log('⚠️  A migration precisa ser aplicada através do Supabase Dashboard ou SQL Editor:');
    console.log('');
    console.log('1. Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new');
    console.log('2. Cole o conteúdo do arquivo: supabase/migrations/20251125000000_create_locks_table.sql');
    console.log('3. Execute a query');
    console.log('');
    console.log('Ou use o comando:');
    console.log('  npx supabase db push --db-url "postgresql://postgres.qggifqpqgjjgobcqbfgo:Zattar2024@...@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
