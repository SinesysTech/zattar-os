import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/database.types';

/**
 * Cliente Supabase para Client Components / browser.
 *
 * @supabase/ssr >=0.8.0 já gerencia um singleton interno via `cachedBrowserClient`.
 * Em ambiente de browser (isBrowser()===true), chamadas subsequentes retornam
 * a mesma instância automaticamente — nenhuma lógica extra de cache é necessária.
 *
 * Regra: prefira importar daqui ao invés de `@/lib/client` (legado).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key são obrigatórios. ' +
      'Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY.'
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
