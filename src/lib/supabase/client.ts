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

const LOCK_STOLEN_MARKER = 'was released because another request stole it';
const LOCK_NOT_RELEASED_MARKER = 'was not released within';
const SUPABASE_AUTH_LOCK_PREFIX = 'lock:sb-';
const LOCK_ACQUIRE_TIMEOUT_MS = 10_000;

let lockNoiseFilterInstalled = false;

/**
 * O @supabase/auth-js emite dois sinais benignos quando o Navigator LockManager
 * detecta contenção no lock do token de auth (storageKey):
 *
 * 1. Warning síncrono em `console.warn`: "Lock \"lock:sb-...\" was not released
 *    within Nms" — indica que o detentor anterior demorou, e o SDK vai
 *    recuperar via `{steal: true}` ([locks.ts:232-236]).
 * 2. `NavigatorLockAcquireTimeoutError` com `isAcquireTimeout=true` e mensagem
 *    "...was released because another request stole it" — a chamada original
 *    perde o lock ([locks.ts:291-293]); o SDK projeta esse erro como
 *    recuperável e documenta o filtro via `isAcquireTimeout`.
 *
 * Esses dois sinais são consequência natural de:
 *  - React Strict Mode em dev (dupla montagem).
 *  - `visibilitychange` concorrente ao `_autoRefreshTokenTick`.
 *  - Múltiplas abas do mesmo usuário.
 *
 * O Next.js 16 encaminha `console.warn/error` e `unhandledrejection` do browser
 * para o terminal via bridge de dev (browserDebugInfoInTerminal), portanto
 * `event.preventDefault()` no listener de rejection não basta — o Next já
 * capturou e reencaminhou. Precisamos filtrar nas três camadas:
 *
 *   - `unhandledrejection` com `capture: true` (prioridade sobre handlers do Next).
 *   - `console.warn` patched para descartar "was not released within Nms".
 *   - `console.error` patched para descartar "was released because another request stole it".
 *
 * Todos os filtros são cirúrgicos (cheques por marker literal + prefixo do lock)
 * para não silenciar nenhum outro log legítimo da aplicação.
 */
function installLockNoiseFilter() {
  if (lockNoiseFilterInstalled || typeof window === 'undefined') return;
  lockNoiseFilterInstalled = true;

  const isBenignLockMessage = (message: unknown): boolean => {
    if (typeof message !== 'string') return false;
    if (!message.includes(SUPABASE_AUTH_LOCK_PREFIX)) return false;
    return (
      message.includes(LOCK_STOLEN_MARKER) || message.includes(LOCK_NOT_RELEASED_MARKER)
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason as { isAcquireTimeout?: unknown; message?: string } | null;
      const matchesByFlag = reason?.isAcquireTimeout === true;
      const matchesByMessage = isBenignLockMessage(reason?.message);
      if (matchesByFlag || matchesByMessage) {
        event.preventDefault();
      }
    },
    { capture: true },
  );

  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (args.some((arg) => isBenignLockMessage(arg))) return;
    originalWarn(...args);
  };

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const hasBenign = args.some((arg) => {
      if (isBenignLockMessage(arg)) return true;
      if (arg && typeof arg === 'object') {
        const maybeError = arg as { message?: unknown; isAcquireTimeout?: unknown };
        if (maybeError.isAcquireTimeout === true) return true;
        if (isBenignLockMessage(maybeError.message)) return true;
      }
      return false;
    });
    if (hasBenign) return;
    originalError(...args);
  };
}

// Instala o filtro no nível do módulo para garantir que esteja ativo
// antes que qualquer componente React renderize e antes que o auth-js
// dispare erros de lock durante a hidratação inicial da sessão.
// Sem isso, o bridge de dev do Next.js/Turbopack captura os erros
// antes do filtro ser instalado pelo primeiro `createClient()`.
installLockNoiseFilter();

export function createClient() {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key são obrigatórios. ' +
      'Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY.'
    );
  }

  // `lockAcquireTimeout` é aceito em runtime pelo @supabase/auth-js
  // (GoTrueClient.ts: settings.lockAcquireTimeout) mas não está exposto
  // no tipo público do @supabase/ssr. Aumentar o default de 5s para 10s
  // reduz steals espúrios em conexões lentas de dev e StrictMode.
  const options = {
    auth: { lockAcquireTimeout: LOCK_ACQUIRE_TIMEOUT_MS },
  } as unknown as Parameters<typeof createBrowserClient>[2];

  return createBrowserClient<Database>(url, anonKey, options);
}
