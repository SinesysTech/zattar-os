/**
 * Wrapper para logging de queries lentas.
 * Uso: await logQuery('nome_da_query', () => supabase.from('tabela').select())
 */
export async function logQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    if (process.env.DEBUG_SUPABASE === 'true' && duration > 1000) {
      console.warn(`[Supabase] Slow query (${duration}ms): ${queryName}`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[Supabase] Query failed (${duration}ms): ${queryName}`, error);
    throw error;
  }
}
