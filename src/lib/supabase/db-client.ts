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
 * Logger de queries lentas com suporte a DEBUG_SUPABASE
 * Emite console.warn quando DEBUG_SUPABASE=true e duração > 1000ms
 */
function logSlowQuery(queryName: string, durationMs: number): void {
  if (process.env.DEBUG_SUPABASE === 'true' && durationMs > 1000) {
    console.warn(
      `[Supabase] Slow query (${durationMs}ms): ${queryName}`,
      {
        threshold: 1000,
        duration: durationMs,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Wrapper para logging e timing de queries
 * Uso: await logQuery('nome_da_query', () => supabase.from('tabela').select())
 */
export async function logQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const durationMs = Date.now() - startTime;

    // Log slow queries se DEBUG_SUPABASE está ativo
    if (durationMs > 1000) {
      logSlowQuery(queryName, durationMs);
    }

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(
      `[Supabase] Query failed (${durationMs}ms): ${queryName}`,
      {
        error: error instanceof Error ? error.message : String(error),
        duration: durationMs,
        timestamp: new Date().toISOString(),
      }
    );
    throw error;
  }
}

/**
 * Cria cliente Supabase para uso em services/repositories
 *
 * Este cliente:
 * - Usa secret key (bypassa RLS)
 * - Deve ser usado APENAS em código server-side
 * - NUNCA expor ao browser
 * - Suporta query logging via DEBUG_SUPABASE
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
