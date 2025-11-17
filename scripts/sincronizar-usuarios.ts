#!/usr/bin/env tsx
/**
 * Script para sincronizar usuários de auth.users para public.usuarios
 * 
 * Uso:
 *   npm run sincronizar-usuarios
 *   ou
 *   tsx scripts/sincronizar-usuarios.ts
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Tentar carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { sincronizarUsuariosAuth } from '../backend/usuarios/services/persistence/sincronizar-usuarios-auth.service';

async function main() {
  console.log('🚀 Iniciando sincronização de usuários...\n');
  
  try {
    const resultado = await sincronizarUsuariosAuth();
    
    console.log('\n📊 Resultado da sincronização:');
    console.log(`   Total encontrados: ${resultado.totalEncontrados}`);
    console.log(`   Sincronizados com sucesso: ${resultado.sincronizados}`);
    console.log(`   Erros: ${resultado.erros.length}`);
    
    if (resultado.erros.length > 0) {
      console.log('\n❌ Erros encontrados:');
      resultado.erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro.email}: ${erro.erro}`);
      });
    }
    
    if (resultado.sucesso) {
      console.log('\n✅ Sincronização concluída com sucesso!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Sincronização concluída com erros.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro fatal ao sincronizar usuários:', error);
    process.exit(1);
  }
}

main();

