// Script para verificar quais migrations foram aplicadas
import { createClient } from '@supabase/supabase-js';
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Mapeamento de migrations para verificação
// Formato: { migration_file: { table?: string, column?: string, function?: string } }
const MIGRATION_CHECKS: Record<string, {
  table?: string;
  column?: { table: string; column: string };
  function?: string;
  description?: string;
}> = {
  '20251125000000_create_locks_table.sql': {
    table: 'locks',
    description: 'Tabela de distributed locks',
  },
  '20250120000000_create_capturas_log.sql': {
    table: 'capturas_log',
    description: 'Tabela de logs de captura',
  },
  '20250118115831_create_agendamentos.sql': {
    table: 'agendamentos',
    description: 'Tabela de agendamentos',
  },
  '20251117015304_create_logs_alteracao.sql': {
    table: 'logs_alteracao',
    description: 'Tabela de logs de alteração',
  },
  '20251117015305_add_responsavel_id_tables.sql': {
    column: { table: 'acervo', column: 'responsavel_id' },
    description: 'Adiciona responsavel_id às tabelas',
  },
  '20250118120000_create_cargos.sql': {
    table: 'cargos',
    description: 'Tabela de cargos',
  },
  '20250118120100_create_permissoes.sql': {
    table: 'permissoes',
    description: 'Tabela de permissões',
  },
  '20251119000001_create_classe_judicial_tipo_sala_audiencia.sql': {
    table: 'classe_judicial',
    description: 'Tabelas de classe judicial e tipo sala audiência',
  },
  '20251120000001_add_timeline_mongodb_id_to_acervo.sql': {
    column: { table: 'acervo', column: 'timeline_mongodb_id' },
    description: 'Adiciona timeline_mongodb_id ao acervo',
  },
  '20251121000002_create_expedientes_manuais_system.sql': {
    table: 'expedientes_manuais',
    description: 'Sistema de expedientes manuais',
  },
  '20251122185339_create_acervo_unificado_view.sql': {
    table: 'acervo_unificado',
    description: 'View de acervo unificado',
  },
  '20251123172800_create_representantes.sql': {
    table: 'representantes',
    description: 'Tabela de representantes',
  },
  '20251127000000_create_processo_partes.sql': {
    table: 'processo_partes',
    description: 'Tabela de vínculo processo-partes',
  },
  '20251126000000_create_enderecos_table.sql': {
    table: 'enderecos',
    description: 'Tabela de endereços',
  },
  '20251125000003_add_ata_audiencia_fields.sql': {
    column: { table: 'audiencias', column: 'ata_assinada' },
    description: 'Adiciona campos de ata de audiência',
  },
};

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    // Se não houver erro, a tabela existe (mesmo que vazia)
    // Se erro for PGRST205 ou similar, tabela não existe
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Tentar fazer uma query selecionando a coluna específica
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    if (error) {
      // Se erro mencionar coluna não existe, retorna false
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return false;
      }
      // Se tabela não existe, coluna também não
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function checkMigrationApplied(migrationFile: string): Promise<boolean> {
  const check = MIGRATION_CHECKS[migrationFile];

  if (!check) {
    // Se não tem check definido, não conseguimos verificar
    return false;
  }

  if (check.table) {
    return await checkTableExists(check.table);
  }

  if (check.column) {
    return await checkColumnExists(check.column.table, check.column.column);
  }

  return false;
}

async function main() {
  console.log('🔍 Verificando migrations aplicadas...\n');

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const allMigrations = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Total de migrations encontradas: ${allMigrations.length}\n`);

  const applied: string[] = [];
  const notApplied: string[] = [];
  const unknown: string[] = [];

  for (const migration of allMigrations) {
    const check = MIGRATION_CHECKS[migration];

    if (!check) {
      unknown.push(migration);
      console.log(`❓ ${migration} - Sem verificação definida`);
      continue;
    }

    const isApplied = await checkMigrationApplied(migration);

    if (isApplied) {
      applied.push(migration);
      console.log(`✅ ${migration} - ${check.description || 'Aplicada'}`);
    } else {
      notApplied.push(migration);
      console.log(`❌ ${migration} - ${check.description || 'Não aplicada'}`);
    }
  }

  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 Resumo:\n');
  console.log(`✅ Aplicadas: ${applied.length}`);
  console.log(`❌ Não aplicadas: ${notApplied.length}`);
  console.log(`❓ Sem verificação: ${unknown.length}`);
  console.log(`📂 Total: ${allMigrations.length}`);

  if (notApplied.length > 0) {
    console.log('\n⚠️  Migrations NÃO aplicadas:');
    notApplied.forEach(m => console.log(`   - ${m}`));
  }

  if (unknown.length > 0) {
    console.log('\n❓ Migrations sem verificação (assumindo como aplicadas):');
    unknown.forEach(m => console.log(`   - ${m}`));
  }

  // Retornar listas para uso posterior
  return {
    applied: [...applied, ...unknown], // Tratamos unknown como aplicadas por segurança
    notApplied,
    unknown,
    total: allMigrations.length,
  };
}

main()
  .then((result) => {
    // Salvar resultado em arquivo JSON
    writeFileSync(
      join(process.cwd(), 'migration-status.json'),
      JSON.stringify(result, null, 2)
    );
    console.log('\n💾 Resultado salvo em: migration-status.json');
  })
  .catch((error) => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });
