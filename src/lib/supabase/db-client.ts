/**
 * CORE DATABASE - Cliente de Banco Desacoplado
 *
 * Este arquivo encapsula o acesso ao Supabase para uso nos repositórios.
 * Toda comunicação com o banco deve passar por aqui.
 *
 * REGRA: Este módulo NÃO deve importar nada de React/Next.js
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Tipo do cliente Supabase para uso nos repositórios
 */
export type DbClient = SupabaseClient;

/**
 * Configuração do Supabase obtida das variáveis de ambiente
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Para operações de service (backend), usar secret key
  // Prioridade: SUPABASE_SECRET_KEY (nova) > SUPABASE_SERVICE_ROLE_KEY (legacy)
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!secretKey) {
    throw new Error(
      'Missing Supabase secret key. Set SUPABASE_SECRET_KEY environment variable.'
    );
  }

  return { url, secretKey };
}

/**
 * Cria cliente Supabase para uso em services/repositories
 *
 * Este cliente:
 * - Usa secret key (bypassa RLS)
 * - Deve ser usado APENAS em código server-side
 * - NUNCA expor ao browser
 */
export function createDbClient(): DbClient {
  const config = getSupabaseConfig();

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Singleton do cliente para evitar múltiplas instâncias
 * Usar com cuidado - considere criar novo cliente quando precisar de conexão fresca
 */
let dbClientInstance: DbClient | null = null;

export function getDbClient(): DbClient {
  if (!dbClientInstance) {
    dbClientInstance = createDbClient();
  }
  return dbClientInstance;
}
