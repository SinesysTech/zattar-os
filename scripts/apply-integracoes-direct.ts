/**
 * Script para aplicar migration via SQL direto no Supabase
 */

import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Aplicando migration da tabela integracoes via REST API...\n');

  // Ler arquivo de migration
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260216212759_create_integracoes_table.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Usar endpoint REST do Supabase para executar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro na API:', error);
      
      console.log('\n📋 Copie e execute este SQL no Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new\n');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      return;
    }

    console.log('✅ Migration aplicada com sucesso!\n');

  } catch (err) {
    console.error('❌ Erro:', err);
    console.log('\n📋 Execute manualmente no SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new\n');
  }
}

applyMigration();
