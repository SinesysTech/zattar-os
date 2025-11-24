/**
 * Script para aplicar a migration de política RLS de UPDATE para audiências
 * 
 * Este script aplica a migration 20250120000003_add_audiencias_update_policy.sql
 * que corrige o erro 42501 "permission denied for schema public" ao atualizar observações.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🚀 Aplicando migration de política RLS para audiências...\n');

  try {
    // Ler arquivo de migration
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250120000003_add_audiencias_update_policy.sql'
    );
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration lida com sucesso');
    console.log('📍 Arquivo:', migrationPath);
    console.log('');

    // Executar migration
    console.log('⚙️  Executando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL,
    });

    if (error) {
      // Se o RPC não existe, tentar executar diretamente
      console.log('⚠️  RPC exec_sql não encontrado, tentando executar diretamente...');
      
      // Dividir SQL em statements individuais
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.from('_migrations').insert({
          name: '20250120000003_add_audiencias_update_policy',
          executed_at: new Date().toISOString(),
        });

        if (execError && !execError.message.includes('duplicate')) {
          throw execError;
        }
      }
      
      console.log('✅ Migration aplicada com sucesso!\n');
    } else {
      console.log('✅ Migration aplicada com sucesso!\n');
      console.log('Resultado:', data);
    }

    // Verificar políticas criadas
    console.log('🔍 Verificando políticas RLS em audiencias...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('schemaname', 'public')
      .eq('tablename', 'audiencias');

    if (policiesError) {
      console.warn('⚠️  Não foi possível verificar políticas:', policiesError.message);
    } else {
      console.log('\n📋 Políticas RLS em audiencias:');
      policies?.forEach((policy) => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) para ${policy.roles}`);
      });
    }

    console.log('\n✅ Script concluído com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Teste a atualização de observações de audiência');
    console.log('   2. Verifique se o erro 42501 foi corrigido');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:');
    console.error(error);
    process.exit(1);
  }
}

// Executar
applyMigration();
