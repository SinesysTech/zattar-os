#!/usr/bin/env node

/**
 * Script simplificado para migrar integrações
 * Usa CommonJS para melhor compatibilidade com dotenv
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SECRET_KEY:', process.env.SUPABASE_SECRET_KEY ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function integracaoExiste(tipo, nome) {
  const { data, error } = await supabase
    .from('integracoes')
    .select('id')
    .eq('tipo', tipo)
    .eq('nome', nome)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`❌ Erro ao verificar integração ${tipo}/${nome}:`, error.message);
    return false;
  }

  return !!data;
}

async function inserirIntegracao(integracao) {
  const existe = await integracaoExiste(integracao.tipo, integracao.nome);

  if (existe) {
    console.log(`⏭️  Integração ${integracao.tipo}/${integracao.nome} já existe, pulando...`);
    return false;
  }

  const { error } = await supabase
    .from('integracoes')
    .insert(integracao);

  if (error) {
    console.error(`❌ Erro ao inserir integração ${integracao.tipo}/${integracao.nome}:`, error.message);
    return false;
  }

  console.log(`✅ Integração ${integracao.tipo}/${integracao.nome} inserida com sucesso`);
  return true;
}

async function migrarIntegracoes() {
  console.log('🚀 Iniciando migração de integrações...\n');

  const integracoes = [];

  // 2FAuth
  const twofauthUrl = process.env.TWOFAUTH_API_URL;
  const twofauthToken = process.env.TWOFAUTH_API_TOKEN;
  const twofauthAccountId = process.env.TWOFAUTH_ACCOUNT_ID;

  if (twofauthUrl && twofauthToken) {
    integracoes.push({
      tipo: 'twofauth',
      nome: '2FAuth Principal',
      descricao: 'Servidor de autenticação de dois fatores',
      ativo: true,
      configuracao: {
        api_url: twofauthUrl,
        api_token: twofauthToken,
        ...(twofauthAccountId && { account_id: parseInt(twofauthAccountId, 10) }),
      },
    });
  }

  // Dify
  const difyUrl = process.env.DIFY_API_URL;
  const difyKey = process.env.DIFY_API_KEY;

  if (difyUrl && difyKey) {
    integracoes.push({
      tipo: 'dify',
      nome: 'Dify AI Principal',
      descricao: 'Plataforma de agentes e workflows de IA',
      ativo: true,
      configuracao: {
        api_url: difyUrl,
        api_key: difyKey,
      },
    });
  }

  // Zapier
  const zapierWebhook = process.env.ZAPIER_WEBHOOK_URL;

  if (zapierWebhook) {
    integracoes.push({
      tipo: 'zapier',
      nome: 'Zapier Principal',
      descricao: 'Automação de workflows',
      ativo: true,
      configuracao: {
        webhook_url: zapierWebhook,
      },
    });
  }

  if (integracoes.length === 0) {
    console.log('ℹ️  Nenhuma integração encontrada nas variáveis de ambiente');
    console.log('\nVariáveis de ambiente suportadas:');
    console.log('  - TWOFAUTH_API_URL + TWOFAUTH_API_TOKEN');
    console.log('  - DIFY_API_URL + DIFY_API_KEY');
    console.log('  - ZAPIER_WEBHOOK_URL');
    return;
  }

  let inseridas = 0;
  for (const integracao of integracoes) {
    const sucesso = await inserirIntegracao(integracao);
    if (sucesso) inseridas++;
  }

  console.log(`\n✨ Migração concluída: ${inseridas}/${integracoes.length} integrações inseridas`);
}

migrarIntegracoes()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
