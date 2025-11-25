// Script para aplicar migration diretamente via PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Usar connection string do .env.local
const connectionString = 'postgresql://postgres.qggifqpqgjjgobcqbfgo:Zattar2024%40@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando se tabela locks existe...');

    // Verificar se tabela existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'locks'
      ) as table_exists
    `);

    if (checkResult.rows[0].table_exists) {
      console.log('✅ Tabela locks já existe!');

      // Mostrar locks ativos
      const locksResult = await client.query('SELECT * FROM locks');
      console.log(`📈 Total de locks ativos: ${locksResult.rows.length}`);

      if (locksResult.rows.length > 0) {
        console.log('🔒 Locks ativos:');
        locksResult.rows.forEach(lock => {
          console.log(`  - ${lock.key} (expires: ${lock.expires_at})`);
        });
      }

      return;
    }

    console.log('📝 Tabela não existe. Lendo arquivo de migration...');

    // Ler arquivo SQL
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251125000000_create_locks_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Aplicando migration...');

    // Executar SQL
    await client.query(migrationSQL);

    console.log('✅ Migration aplicada com sucesso!');

    // Verificar se tabela foi criada
    const verifyResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'locks'
      ) as table_exists
    `);

    if (verifyResult.rows[0].table_exists) {
      console.log('✅ Tabela locks criada e verificada!');
    } else {
      console.log('❌ Erro: Tabela não foi criada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
