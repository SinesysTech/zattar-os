#!/usr/bin/env tsx

/**
 * Script: Migrate Integrations to Database
 * 
 * Este script migra as configurações de integrações de variáveis de ambiente
 * para a tabela `integracoes` no banco de dados.
 * 
 * Uso:
 *   tsx scripts/migrate-integrations-to-db.ts
 * 
 * Variáveis de ambiente suportadas:
 *   - TWOFAUTH_API_URL
 *   - TWOFAUTH_API_TOKEN
 *   - TWOFAUTH_ACCOUNT_ID
 *   - DIFY_API_URL
 *   - DIFY_API_KEY
 *   - ZAPIER_WEBHOOK_URL
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =============================================================================
// TIPOS
// =============================================================================

interface Integracao {
  tipo: 'twofauth' | 'zapier' | 'dify' | 'webhook' | 'api';
  nome: string;
  descricao: string;
  ativo: boolean;
  configuracao: Record<string, unknown>;
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

async function integracaoExiste(tipo: string, nome: string): Promise<boolean> {
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

async function inserirIntegracao(integracao: Integracao): Promise<boolean> {
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

// =============================================================================
// MIGRAÇÃO
// =============================================================================

async function migrarIntegracoes() {
  console.log('🚀 Iniciando migração de integrações...\n');

  const integracoes: Integracao[] = [];

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

  // Verificar se há integrações para migrar
  if (integracoes.length === 0) {
    console.log('ℹ️  Nenhuma integração encontrada nas variáveis de ambiente');
    console.log('\nVariáveis de ambiente suportadas:');
    console.log('  - TWOFAUTH_API_URL + TWOFAUTH_API_TOKEN');
    console.log('  - DIFY_API_URL + DIFY_API_KEY');
    console.log('  - ZAPIER_WEBHOOK_URL');
    return;
  }

  // Inserir integrações
  let inseridas = 0;
  for (const integracao of integracoes) {
    const sucesso = await inserirIntegracao(integracao);
    if (sucesso) inseridas++;
  }

  console.log(`\n✨ Migração concluída: ${inseridas}/${integracoes.length} integrações inseridas`);
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

migrarIntegracoes()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

