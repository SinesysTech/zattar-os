#!/usr/bin/env node

/**
 * Script simples para verificar se a tabela integracoes existe
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTable() {
  console.log('🔍 Verificando tabela integracoes...\n');

  try {
    const { data, error } = await supabase
      .from('integracoes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      return false;
    }

    console.log('✅ Tabela integracoes existe e está acessível!');
    console.log(`   Registros encontrados: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('\n📋 Integrações existentes:');
      data.forEach((int: any) => {
        console.log(`   • ${int.tipo}: ${int.nome} (${int.ativo ? 'ativo' : 'inativo'})`);
      });
    }

    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return false;
  }
}

checkTable()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
