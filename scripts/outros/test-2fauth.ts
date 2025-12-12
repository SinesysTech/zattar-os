#!/usr/bin/env tsx
/**
 * Script para testar a conexão com o 2FAuth
 * Verifica se a configuração está correta e se o account ID existe
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { getOTP } from '@/lib/api';

async function testTwoFAuth() {
  console.log('🧪 Testando conexão com 2FAuth...\n');
  
  const apiUrl = process.env.TWOFAUTH_API_URL;
  const token = process.env.TWOFAUTH_API_TOKEN;
  const accountId = process.env.TWOFAUTH_ACCOUNT_ID;

  console.log('📋 Configuração:');
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Token: ${token?.substring(0, 50)}...`);
  console.log(`   Account ID: ${accountId}\n`);

  if (!apiUrl || !token || !accountId) {
    console.error('❌ Configuração incompleta! Verifique as variáveis de ambiente.');
    process.exit(1);
  }

  // Normalizar URL
  let baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  
  if (baseUrl.endsWith('/api/v1')) {
    // URL já está completa
  } else if (baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/v1`;
  } else if (!baseUrl.includes('/api')) {
    baseUrl = `${baseUrl}/api/v1`;
  }

  const testUrl = `${baseUrl}/twofaccounts/${accountId}/otp`;
  
  console.log(`🔗 URL final do endpoint: ${testUrl}\n`);

  // Testar listagem de contas primeiro
  console.log('📋 Testando listagem de contas...');
  const listUrl = `${baseUrl}/twofaccounts`;
  
  try {
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${listResponse.status}`);
    
    if (listResponse.ok) {
      const accounts = await listResponse.json();
      console.log(`   ✅ Contas disponíveis:\n`);
      
      interface TwoFAuthAccount {
        id: number;
        service?: string;
        account?: string;
      }

      if (Array.isArray(accounts)) {
        (accounts as TwoFAuthAccount[]).forEach((acc) => {
          console.log(`      - ID: ${acc.id}, Service: ${acc.service || 'N/A'}, Account: ${acc.account || 'N/A'}`);
        });
      } else if (accounts.data && Array.isArray(accounts.data)) {
        (accounts.data as TwoFAuthAccount[]).forEach((acc) => {
          console.log(`      - ID: ${acc.id}, Service: ${acc.service || 'N/A'}, Account: ${acc.account || 'N/A'}`);
        });
      }
      
      console.log('');
    } else {
      const errorText = await listResponse.text();
      console.error(`   ❌ Erro ao listar contas: ${errorText}\n`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao conectar: ${error}\n`);
  }

  // Testar obtenção de OTP
  console.log('🔑 Testando obtenção de OTP...');
  
  try {
    const otpResult = await getOTP();
    console.log(`   ✅ OTP obtido com sucesso!`);
    console.log(`      Password: ${otpResult.password}`);
    if (otpResult.nextPassword) {
      console.log(`      Next Password: ${otpResult.nextPassword}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao obter OTP:`);
    const err = error as { message?: string; statusCode?: number; reason?: unknown };
    console.error(`      ${err.message || String(error)}`);
    if (err.statusCode) {
      console.error(`      Status Code: ${err.statusCode}`);
    }
    if (err.reason) {
      console.error(`      Reason: ${JSON.stringify(err.reason)}`);
    }
  }
}

testTwoFAuth().catch(console.error);
