#!/usr/bin/env tsx
/**
 * Script para aplicar a migration que adiciona 'chatflow' ao tipo app_type da tabela dify_apps
 * 
 * Uso: tsx scripts/apply-dify-chatflow-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const _supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔄 Aplicando migration: adicionar tipo "chatflow" ao dify_apps...\n');

  const migrationSQL = `
ALTER TABLE dify_apps DROP CONSTRAINT IF EXISTS dify_apps_app_type_check;

ALTER TABLE dify_apps ADD CONSTRAINT dify_apps_app_type_check 
  CHECK (app_type IN ('chat', 'chatflow', 'workflow', 'completion', 'agent'));

COMMENT ON COLUMN dify_apps.app_type IS 
  'Tipo do aplicativo Dify: chat (chatbot básico), chatflow (conversas multi-turn com memória), workflow (tarefas single-turn), completion (geração de texto), agent (agente com ferramentas)';
  `.trim();

  console.log('⚠️  O Supabase Client não suporta execução direta de DDL (ALTER TABLE).');
  console.log('    Você precisa aplicar esta migration manualmente.\n');
  console.log('📋 INSTRUÇÕES:\n');
  console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em "SQL Editor" no menu lateral');
  console.log('4. Cole e execute o SQL abaixo:\n');
  console.log('─'.repeat(80));
  console.log(migrationSQL);
  console.log('─'.repeat(80));
  console.log('\n✅ Após executar, o tipo "chatflow" estará disponível!\n');
}

applyMigration();
