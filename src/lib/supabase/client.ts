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

let lockErrorFilterInstalled = false;

/**
 * O @supabase/auth-js dispara NavigatorLockAcquireTimeoutError (locks.ts:235)
 * quando outro request "rouba" o lock do token — cenário benigno de corrida
 * causado por múltiplas abas, StrictMode ou visibilitychange concorrente.
 *
 * O SDK tipa o erro com `isAcquireTimeout=true` justamente para callers
 * filtrarem. Alguns fluxos internos (`_onVisibilityChanged`, `initialize()`)
 * não envolvem o throw em try/catch externo, então a rejeição escapa como
 * unhandled e o overlay do Next.js a promove para "Console Error".
 *
 * Este handler intercepta apenas rejeições com `isAcquireTimeout=true` e
 * converte em `console.warn`, preservando visibilidade em dev sem poluir
 * o overlay com um erro que o próprio SDK classifica como recuperável.
 */
function installLockErrorFilter() {
  if (lockErrorFilterInstalled || typeof window === 'undefined') return;
  lockErrorFilterInstalled = true;

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { isAcquireTimeout?: unknown; message?: string } | null;
    if (reason && reason.isAcquireTimeout === true) {
      event.preventDefault();
      console.warn('[supabase] Lock de auth foi roubado (benigno):', reason.message);
    }
  });
}

export function createClient() {
  installLockErrorFilter();

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
