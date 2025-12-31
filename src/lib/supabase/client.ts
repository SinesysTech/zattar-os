import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para Client Components / browser.
 *
 * Regra: prefira importar daqui ao invés de `@/lib/client` (legado).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  );
}
