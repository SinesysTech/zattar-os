#!/usr/bin/env node

/**
 * Script simplificado para testar configurações de integrações
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testTableExists() {
  console.log('📋 Teste 1: Verificar se a tabela integracoes existe...');
  
  const { error } = await supabase
    .from('integracoes')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Tabela não existe ou não está acessível:', error.message);
    return false;
  }

  console.log('✅ Tabela integracoes existe e está acessível\n');
  return true;
}

async function testListIntegrations() {
  console.log('📋 Teste 2: Listar todas as integrações...');
  
  const { data, error } = await supabase
    .from('integracoes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao listar integrações:', error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Nenhuma integração encontrada no banco');
    console.log('   Execute: npm run integrations:migrate\n');
    return true;
  }

  console.log(`✅ ${data.length} integração(ões) encontrada(s):\n`);
  
  data.forEach((integracao) => {
    console.log(`   • ${integracao.tipo.toUpperCase()}: ${integracao.nome}`);
    console.log(`     Ativo: ${integracao.ativo ? '✅' : '❌'}`);
    console.log(`     Criado em: ${new Date(integracao.created_at).toLocaleString('pt-BR')}`);
    console.log('');
  });

  return true;
}

async function test2FAuthConfig() {
  console.log('📋 Teste 3: Buscar configuração do 2FAuth...');
  
  const { data, error } = await supabase
    .from('integracoes')
    .select('*')
    .eq('tipo', 'twofauth')
    .eq('ativo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️  Nenhuma integração 2FAuth ativa encontrada');
      
      const hasEnvVars = process.env.TWOFAUTH_API_URL && process.env.TWOFAUTH_API_TOKEN;
      if (hasEnvVars) {
        console.log('   ✅ Fallback: Variáveis de ambiente configuradas');
        console.log(`      URL: ${process.env.TWOFAUTH_API_URL}`);
      } else {
        console.log('   ❌ Variáveis de ambiente também não configuradas');
      }
      console.log('');
      return true;
    }
    
    console.error('❌ Erro ao buscar configuração:', error.message);
    return false;
  }

  console.log('✅ Configuração 2FAuth encontrada:');
  console.log(`   Nome: ${data.nome}`);
  console.log(`   URL: ${data.configuracao.api_url}`);
  console.log(`   Token: ${data.configuracao.api_token ? '***' + data.configuracao.api_token.slice(-4) : 'não configurado'}`);
  console.log(`   Account ID: ${data.configuracao.account_id || 'não configurado'}`);
  console.log('');

  return true;
}

async function runTests() {
  console.log('🧪 Testando Configuração de Integrações\n');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    tableExists: await testTableExists(),
    listIntegrations: await testListIntegrations(),
    twofauth: await test2FAuthConfig(),
  };

  console.log('='.repeat(60));
  console.log('\n📊 Resumo dos Testes:\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`   ✅ Passou: ${passed}/${total}`);
  console.log(`   ❌ Falhou: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n✨ Todos os testes passaram!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Acesse /app/configuracoes?tab=integracoes');
    console.log('   2. Configure ou edite suas integrações');
    console.log('   3. Remova variáveis de ambiente após confirmar funcionamento');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  }

  console.log('');
  return passed === total;
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar testes:', error);
    process.exit(1);
  });
