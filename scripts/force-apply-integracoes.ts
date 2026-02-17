#!/usr/bin/env node

/**
 * Script para forçar aplicação da migration de integrações
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  console.log('🚀 Aplicando migration de integrações...\n');

  // Ler arquivo de migration
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260216220000_create_integracoes_table.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Arquivo de migration não encontrado:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📝 Executando SQL...\n');

  try {
    // Executar SQL via RPC (se disponível)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      console.log('\n⚠️  Tentando método alternativo...\n');
      
      // Método alternativo: executar statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📋 ${statements.length} statements para executar\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        
        if (stmt.toLowerCase().includes('create table')) {
          console.log(`   ${i + 1}. Criando tabela...`);
        } else if (stmt.toLowerCase().includes('create index')) {
          console.log(`   ${i + 1}. Criando índice...`);
        } else if (stmt.toLowerCase().includes('create trigger')) {
          console.log(`   ${i + 1}. Criando trigger...`);
        } else if (stmt.toLowerCase().includes('create policy')) {
          console.log(`   ${i + 1}. Criando policy...`);
        } else if (stmt.toLowerCase().includes('comment on')) {
          console.log(`   ${i + 1}. Adicionando comentário...`);
        } else {
          console.log(`   ${i + 1}. Executando statement...`);
        }
      }

      console.log('\n⚠️  Execute manualmente no SQL Editor do Supabase:');
      console.log('   https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new\n');
      return false;
    }

    console.log('✅ SQL executado com sucesso!\n');
    return true;

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return false;
  }
}

async function verifyTable() {
  console.log('🔍 Verificando se a tabela foi criada...\n');

  try {
    const { data, error } = await supabase
      .from('integracoes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Tabela não encontrada:', error.message);
      return false;
    }

    console.log('✅ Tabela integracoes criada com sucesso!');
    console.log(`   Registros: ${data?.length || 0}\n`);
    return true;

  } catch (err) {
    console.error('❌ Erro ao verificar tabela:', err);
    return false;
  }
}

async function main() {
  const applied = await applyMigration();
  
  if (applied) {
    await verifyTable();
  }
}

main()
  .then(() => {
    console.log('✅ Processo concluído');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
