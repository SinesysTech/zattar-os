
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser to avoid external dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('📄 Carregando .env.local...');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  } else {
    console.warn('⚠️ .env.local não encontrado.');
  }
}

async function executeSQL(supabase: any, sql: string) {
  // Tenta executar via RPC 'query'
  const { data, error } = await supabase.rpc('query', { query: sql });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service Role Key

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Credenciais do Supabase não encontradas.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations', 'nao-aplicadas');
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Diretório não encontrado: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('✅ Nenhuma migration pendente encontrada.');
    process.exit(0);
  }

  console.log(`📦 Encontradas ${files.length} migrations pendentes:`);
  files.forEach(f => console.log(`   - ${f}`));

  for (const file of files) {
    console.log(`\n▶️  Processando: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Split statements by semicolon, handling simple cases
    // Note: This is a basic splitter and might fail on semicolons inside strings.
    // Ideally we should use a proper SQL parser, but for now we follow the existing pattern.
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Encontrados ${statements.length} comandos SQL.`);

    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        await executeSQL(supabase, statement);
        // console.log(`   ✅ Comando ${i + 1} executado.`);
        successCount++;
      } catch (err: any) {
        if (err.message?.includes('already exists') || err.message?.includes('IF NOT EXISTS')) {
             console.log(`   ⚠️  Aviso no comando ${i + 1}: ${err.message} (Ignorado)`);
             successCount++; // Count as success to proceed
        } else {
             console.error(`   ❌ Erro no comando ${i + 1}: ${err.message}`);
             console.error(`   SQL: ${statement.substring(0, 100)}...`);
             process.exit(1);
        }
      }
    }
    console.log(`   ✅ Migration ${file} aplicada com sucesso!`);
  }

  console.log('\n🏁 Todas as migrations foram processadas.');
}

main();
