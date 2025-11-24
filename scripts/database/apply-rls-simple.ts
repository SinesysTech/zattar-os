/**
 * Script simplificado para aplicar a migration de política RLS
 * 
 * Executa o SQL diretamente no banco de dados usando o Supabase client
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('🚀 Aplicando política RLS de UPDATE para audiências...\n');

  try {
    // SQL para criar a política de UPDATE
    const createPolicySQL = `
      -- Remover política antiga se existir
      DROP POLICY IF EXISTS "Service role pode atualizar audiências" ON public.audiencias;
      
      -- Criar política permitindo UPDATE via service_role
      CREATE POLICY "Service role pode atualizar audiências"
        ON public.audiencias
        FOR UPDATE
        TO service_role
        USING (true)
        WITH CHECK (true);
    `;

    console.log('⚙️  Executando SQL via REST API...');
    
    // Tentar executar usando query direto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('exec', {
      sql: createPolicySQL,
    });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      console.log('\n📋 Por favor, execute manualmente no Supabase Dashboard:');
      console.log('   1. Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/editor');
      console.log('   2. Clique em "SQL Editor"');
      console.log('   3. Cole e execute o seguinte SQL:\n');
      console.log('```sql');
      console.log(createPolicySQL);
      console.log('```\n');
    } else {
      console.log('✅ Migration aplicada com sucesso!\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

// Executar
applyMigration();
