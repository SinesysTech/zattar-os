// Script para aplicar migration de locks via Supabase Admin Client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Criar cliente com service role (bypassa RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log('🔍 Verificando se tabela locks existe...');

    // Tentar consultar a tabela
    const { data, error } = await supabase
      .from('locks')
      .select('key')
      .limit(1);

    if (!error) {
      console.log('✅ Tabela locks já existe!');
      console.log('📊 Verificando locks ativos...');

      const { data: activeLocks, error: countError } = await supabase
        .from('locks')
        .select('key, expires_at, created_at, metadata');

      if (!countError && activeLocks) {
        console.log(`📈 Total de locks ativos: ${activeLocks.length}`);
        if (activeLocks.length > 0) {
          console.log('🔒 Locks ativos:');
          activeLocks.forEach((lock: any) => {
            const expiresAt = new Date(lock.expires_at);
            const isExpired = expiresAt < new Date();
            console.log(`  - ${lock.key} (${isExpired ? '❌ EXPIRADO' : '✅ ATIVO'} - expires: ${lock.expires_at})`);
          });

          // Limpar locks expirados
          const expiredCount = activeLocks.filter((lock: any) => new Date(lock.expires_at) < new Date()).length;
          if (expiredCount > 0) {
            console.log(`\n🧹 Limpando ${expiredCount} lock(s) expirado(s)...`);
            const { error: deleteError } = await supabase
              .from('locks')
              .delete()
              .lt('expires_at', new Date().toISOString());

            if (!deleteError) {
              console.log('✅ Locks expirados removidos!');
            } else {
              console.log('⚠️ Erro ao remover locks expirados:', deleteError.message);
            }
          }
        }
      }

      return;
    }

    // Se erro, verificar se é por tabela não existir
    if (error.code === 'PGRST205' || error.code === 'PGRST200' || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('schema cache')) {
      console.log('📝 Tabela não existe. Aplicando migration...');
      console.log('');

      const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251125000000_create_locks_table.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      // Tentar executar via RPC (SQL direto)
      console.log('🚀 Executando SQL via Supabase...');

      // Usar a função rpc para executar SQL direto (se disponível)
      // Como não temos acesso direto ao SQL via Supabase JS client, vamos usar fetch
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: migrationSQL }),
        });

        if (response.ok) {
          console.log('✅ Migration aplicada com sucesso via RPC!');

          // Validar criação
          const { data: validateData, error: validateError } = await supabase
            .from('locks')
            .select('key')
            .limit(1);

          if (!validateError) {
            console.log('✅ Tabela locks criada e validada!');
          } else {
            throw new Error('Erro ao validar tabela: ' + validateError.message);
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (rpcError: any) {
        console.log('⚠️ Não foi possível executar via RPC:', rpcError.message);
        console.log('');
        console.log('📋 Por favor, aplique manualmente via Supabase Dashboard:');
        console.log('');
        console.log('1. Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new');
        console.log('2. Cole o conteúdo abaixo e execute:');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(migrationSQL);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('✅ Após executar, rode este script novamente para validar!');
      }
    } else {
      console.error('❌ Erro ao verificar tabela:', error);
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
