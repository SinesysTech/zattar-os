/**
 * Query Logger - Logging de queries lentas (>1s) com DEBUG_SUPABASE
 *
 * Este módulo fornece helpers para logging de queries com timing.
 * Funciona em conjunto com db-client.ts para oferecer consistência
 * na monitorização de performance do banco de dados.
 *
 * Uso:
 * ```
 * import { logQuery } from '@/lib/supabase/db-client';
 * const result = await logQuery('listar_usuarios', () =>
 *   supabase.from('usuarios').select('*')
 * );
 * ```
 *
 * Ativa logging via: DEBUG_SUPABASE=true
 * Threshold padrão: 1000ms
 */

/**
 * Wrapper para logging de queries lentas com timing detalhado
 *
 * @param queryName - Nome descritivo da query para logs
 * @param queryFn - Função que executa a query
 * @param thresholdMs - Limiar de duração em ms (default: 1000ms)
 * @returns Resultado da query
 * @throws Rethrow do erro da query com logging
 *
 * @example
 * ```typescript
 * const users = await logQuery('fetch_users_by_role', () =>
 *   supabase
 *     .from('usuarios')
 *     .select('id, nome, role')
 *     .eq('role', 'admin')
 * );
 * ```
 */
export async function logQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  thresholdMs: number = 1000
): Promise<T> {
  const startTime = Date.now();
  const startHighResolution = process.hrtime.bigint();

  try {
    const result = await queryFn();
    const endHighResolution = process.hrtime.bigint();
    const durationMs = Number(endHighResolution - startHighResolution) / 1_000_000;

    // Emitir warning se threshold foi excedido e DEBUG_SUPABASE está ativo
    if (process.env.DEBUG_SUPABASE === 'true' && durationMs > thresholdMs) {
      console.warn(
        `[Supabase] Slow query detected (${durationMs.toFixed(2)}ms > ${thresholdMs}ms): ${queryName}`,
        {
          queryName,
          duration_ms: durationMs.toFixed(2),
          threshold_ms: thresholdMs,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        }
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      `[Supabase] Query execution failed (${duration}ms): ${queryName}`,
      {
        queryName,
        error: errorMessage,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      }
    );

    throw error;
  }
}

/**
 * Variante não-async para decorar promises existentes
 *
 * @example
 * ```typescript
 * const usersPromise = supabase
 *   .from('usuarios')
 *   .select('*')
 *   .then(result => result.data || []);
 *
 * const users = await logQueryPromise('fetch_users', usersPromise);
 * ```
 */
export async function logQueryPromise<T>(
  queryName: string,
  promise: Promise<T>,
  thresholdMs: number = 1000
): Promise<T> {
  return logQuery(queryName, () => promise, thresholdMs);
}

/**
 * Batch logging para múltiplas queries
 * Útil para rastrear múltiplas operações em uma transação
 */
export async function logBatchQueries(
  batchName: string,
  queries: Record<string, () => Promise<unknown>>,
  thresholdMs: number = 1000
): Promise<Record<string, unknown>> {
  const startTime = Date.now();
  const results: Record<string, unknown> = {};
  const durations: Record<string, number> = {};

  try {
    for (const [key, queryFn] of Object.entries(queries)) {
      const start = Date.now();
      try {
        results[key] = await queryFn();
        durations[key] = Date.now() - start;
      } catch (error) {
        durations[key] = Date.now() - start;
        throw error;
      }
    }

    const totalDuration = Date.now() - startTime;

    if (process.env.DEBUG_SUPABASE === 'true') {
      const slowQueries = Object.entries(durations).filter(
        ([_, duration]) => duration > thresholdMs
      );

      if (slowQueries.length > 0) {
        console.warn(
          `[Supabase] Batch ${batchName}: ${slowQueries.length} slow queries detected (${totalDuration}ms total)`,
          {
            batch_name: batchName,
            total_duration_ms: totalDuration,
            slow_queries: Object.fromEntries(slowQueries),
            threshold_ms: thresholdMs,
            timestamp: new Date().toISOString(),
          }
        );
      }
    }

    return results;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(
      `[Supabase] Batch ${batchName} failed after ${totalDuration}ms`,
      {
        batch_name: batchName,
        error: error instanceof Error ? error.message : String(error),
        total_duration_ms: totalDuration,
        completed_queries: Object.keys(results).length,
        total_queries: Object.keys(queries).length,
        timestamp: new Date().toISOString(),
      }
    );
    throw error;
  }
}

