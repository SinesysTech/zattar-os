// Script para aplicar migrations pendentes via Supabase SDK
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- importado para referência futura
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Nota: Cliente Supabase não utilizado neste script (usa fetch direto)
// Mantido para referência futura caso seja necessário usar a SDK
// const _supabase = createClient(supabaseUrl, supabaseServiceKey, { ... });

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

const MIGRATIONS = [
  {
    file: '20250101000000_create_embeddings_conhecimento.sql',
    description: 'Criar tabela embeddings_conhecimento (Root)',
  },
  {
    file: 'nao-aplicadas/2025-12-06-create-conciliacao-bancaria-tables.sql',
    description: 'Criar tabelas de conciliação bancária',
  },
  {
    file: 'nao-aplicadas/2025-12-07-add-dados-adicionais-conciliacoes.sql',
    description: 'Adicionar dados adicionais conciliações',
  },
  {
    file: 'nao-aplicadas/2025-12-12-create-embeddings-system.sql',
    description: 'Criar sistema de embeddings',
  },
];

async function executeSQLDirect(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Tentar via fetch direto no endpoint SQL do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'params=single-object',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function applyMigration(migrationFile: string, description: string): Promise<boolean> {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`📝 Aplicando: ${migrationFile}`);
  console.log(`📄 Descrição: ${description}`);
  console.log('━'.repeat(80));

  const migrationPath = join(MIGRATIONS_DIR, migrationFile);
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('🚀 Executando SQL...\n');

  // Dividir SQL em statements individuais (separados por ponto-e-vírgula)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Pular comentários
    if (statement.startsWith('--')) continue;

    console.log(`  [${i + 1}/${statements.length}] Executando statement...`);

    const result = await executeSQLDirect(statement + ';');

    if (result.success) {
      console.log(`  ✅ Statement ${i + 1} executado com sucesso`);
      successCount++;
    } else {
      console.log(`  ❌ Erro no statement ${i + 1}: ${result.error}`);
      errorCount++;

      // Se erro crítico, parar execução
      if (!result.error?.includes('already exists') && !result.error?.includes('IF NOT EXISTS')) {
        console.log('\n⛔ Erro crítico detectado. Abortando migration.\n');
        return false;
      } else {
        console.log('  ℹ️  Erro ignorado (recurso já existe)\n');
      }
    }
  }

  console.log('\n📊 Resultado:');
  console.log(`  ✅ Sucesso: ${successCount}`);
  console.log(`  ❌ Erros: ${errorCount}`);

  return errorCount === 0 || errorCount === statements.length; // Sucesso se não houver erros ou todos falharam (já existentes)
}

async function main() {
  console.log('🔧 Aplicador de Migrations via Supabase SDK\n');
  console.log(`📁 Diretório: ${MIGRATIONS_DIR}`);
  console.log(`📂 Total de migrations: ${MIGRATIONS.length}\n`);

  let appliedCount = 0;
  let failedCount = 0;

  for (const migration of MIGRATIONS) {
    const success = await applyMigration(migration.file, migration.description);

    if (success) {
      console.log(`✅ Migration aplicada: ${migration.file}\n`);
      appliedCount++;
    } else {
      console.log(`❌ Falha ao aplicar: ${migration.file}\n`);
      failedCount++;
    }
  }

  console.log('━'.repeat(80));
  console.log('\n📊 RESUMO FINAL:\n');
  console.log(`✅ Migrations aplicadas: ${appliedCount}`);
  console.log(`❌ Migrations com falha: ${failedCount}`);
  console.log(`📂 Total: ${MIGRATIONS.length}`);

  if (failedCount > 0) {
    console.log('\n⚠️  ATENÇÃO: Algumas migrations falharam!');
    console.log('   Por favor, aplique-as manualmente via Supabase Dashboard.');
    console.log(`   URL: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
  } else {
    console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Mova os arquivos de nao-aplicadas/ para aplicadas/');
    console.log('   2. Atualize os READMEs');
    console.log('   3. Commit as mudanças');
  }
}

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error.message);
  console.error(error.stack);
  process.exit(1);
});
