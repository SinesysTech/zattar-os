/**
 * CORE DATABASE - Cliente de Banco Desacoplado
 *
 * Este arquivo encapsula o acesso ao Supabase para uso nos repositórios.
 * Toda comunicação com o banco deve passar por aqui.
 *
 * REGRA: Este módulo NÃO deve importar nada de React/Next.js.
 * REGRA: Este módulo É SERVER-ONLY. Nunca pode executar no browser —
 *        o guard `assertServerOnly()` lança se invocado no cliente.
 *
 * Chaves do Supabase (nomenclatura oficial vigente — 2026):
 *   - Publishable Key (novo): `sb_publishable_…` — uso no frontend (browser)
 *   - Secret Key (novo):      `sb_secret_…`      — uso server-only, bypassa RLS
 *   - anon / service_role (legacy JWTs): aceitos até a remoção pelo Supabase
 *     em late 2026. Mantemos fallback transitório em SUPABASE_SERVICE_ROLE_KEY.
 *
 * Ref: https://supabase.com/docs — "API Key Migration"
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Tipo do cliente Supabase para uso nos repositórios
 */
export type DbClient = SupabaseClient;

/**
 * Falha ruidosamente se o módulo for carregado no browser.
 * Defesa em profundidade: a Secret Key nunca deve sair do servidor.
 */
function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[supabase/db-client] createDbClient/getDbClient são server-only. ' +
        'Não importe este módulo de Client Components nem de código que roda no browser. ' +
        'Para uso no browser, utilize @/lib/supabase/client (publishable key).'
    );
  }
}

/**
 * Configuração do Supabase obtida das variáveis de ambiente.
 * Aceita a nova Secret Key (recomendada) e mantém fallback para a chave legacy
 * enquanto o Supabase não remove o suporte (previsto para late 2026).
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!secretKey) {
    throw new Error(
      'Missing Supabase Secret Key. Defina SUPABASE_SECRET_KEY (formato sb_secret_…) no ambiente. ' +
        'A variável legacy SUPABASE_SERVICE_ROLE_KEY ainda é aceita como fallback até o Supabase removê-la.'
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
 * - Usa Secret Key (bypassa RLS) — nomenclatura oficial Supabase pós-migração
 * - Deve ser usado APENAS em código server-side
 * - NUNCA expor ao browser (o guard `assertServerOnly` falha ruidosamente)
 * - Suporta query logging via DEBUG_SUPABASE
 */
export function createDbClient(): DbClient {
  assertServerOnly();
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
