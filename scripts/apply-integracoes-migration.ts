/**
 * Script para aplicar migration da tabela integracoes no Supabase remoto
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🚀 Aplicando migration da tabela integracoes...\n');

  // Ler arquivo de migration
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260216220000_create_integracoes_table.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Arquivo de migration não encontrado:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Executar SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se a função exec_sql não existir, tentar via REST API diretamente
      console.log('⚠️  Função exec_sql não disponível, tentando método alternativo...\n');
      
      // Dividir SQL em statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('create table')) {
          console.log('📝 Criando tabela integracoes...');
        } else if (statement.toLowerCase().includes('create index')) {
          console.log('📝 Criando índices...');
        } else if (statement.toLowerCase().includes('create trigger')) {
          console.log('📝 Criando trigger...');
        } else if (statement.toLowerCase().includes('create policy')) {
          console.log('📝 Criando RLS policies...');
        } else if (statement.toLowerCase().includes('insert into')) {
          console.log('📝 Inserindo registro padrão...');
        }
      }

      console.log('\n⚠️  Execute manualmente no SQL Editor do Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new\n');
      console.log('SQL a executar:');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      return;
    }

    console.log('✅ Migration aplicada com sucesso!\n');

    // Verificar se a tabela foi criada
    const { error: tablesError } = await supabase
      .from('integracoes')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ Erro ao verificar tabela:', tablesError.message);
    } else {
      console.log('✅ Tabela integracoes criada e acessível!\n');
    }

    // Inserir configuração do 2FAuth do .env.local
    const twofauthUrl = process.env.TWOFAUTH_API_URL;
    const twofauthToken = process.env.TWOFAUTH_API_TOKEN;
    const twofauthAccountId = process.env.TWOFAUTH_ACCOUNT_ID;

    if (twofauthUrl && twofauthToken) {
      console.log('📝 Migrando configuração do 2FAuth do .env.local...\n');

      const { data: insertData, error: insertError } = await supabase
        .from('integracoes')
        .upsert({
          tipo: 'twofauth',
          nome: '2FAuth Principal',
          descricao: 'Servidor de autenticação de dois fatores',
          ativo: true,
          configuracao: {
            api_url: twofauthUrl,
            api_token: twofauthToken,
            account_id: twofauthAccountId ? parseInt(twofauthAccountId, 10) : null,
          },
        }, {
          onConflict: 'tipo,nome',
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir configuração:', insertError.message);
      } else {
        console.log('✅ Configuração 2FAuth migrada com sucesso!');
        console.log('   ID:', insertData.id);
        console.log('   URL:', insertData.configuracao.api_url);
        console.log('\n💡 Agora você pode remover as variáveis do .env.local:');
        console.log('   - TWOFAUTH_API_URL');
        console.log('   - TWOFAUTH_API_TOKEN');
        console.log('   - TWOFAUTH_ACCOUNT_ID\n');
      }
    } else {
      console.log('⚠️  Variáveis TWOFAUTH_* não encontradas no .env.local');
      console.log('   Configure via interface em /app/configuracoes?tab=integracoes\n');
    }

  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err);
    process.exit(1);
  }
}

applyMigration();
