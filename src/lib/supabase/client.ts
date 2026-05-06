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
 * O Next.js 16 trata `unhandledrejection` em duas frentes:
 *   a) Dev Overlay (Runtime Error) — `app-dev-overlay-setup` chama
 *      `handleGlobalErrors()` que registra `addEventListener('unhandledrejection',
 *      onUnhandledRejection)` em capture: false (bubble phase). O handler
 *      empilha o erro em `rejectionQueue` e dispara o overlay.
 *   b) Bridge para o terminal — `forwardLogs`/`logUnhandledRejection` é chamado
 *      dentro do mesmo `onUnhandledRejection`, então é blocked pelo mesmo path.
 *
 * Pela spec DOM, listeners com `capture: true` em `window` são processados na
 * capture phase antes dos listeners com `capture: false` (bubble phase). Isso
 * garante que o nosso filtro execute primeiro. Para impedir que o handler do
 * Next.js receba o evento depois, usamos `event.stopImmediatePropagation()`
 * em vez de só `event.preventDefault()` — preventDefault apenas marca o
 * evento como tratado pelo agente, NÃO interrompe propagação para outros
 * listeners no mesmo target.
 *
 * Filtros adicionais para a forma "log-only" do auth-js:
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
        // Sem isso, o `onUnhandledRejection` do Dev Overlay (registrado em
        // capture: false) ainda recebe o evento e mostra o Runtime Error.
        event.stopImmediatePropagation();
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

/**
 * Adapter `userStorage` SSR-safe.
 *
 * Em @supabase/ssr >=0.9.0, quando `cookies.encode === 'tokens-only'`, o
 * `createBrowserClient` avalia `options?.auth?.userStorage ?? window.localStorage`
 * sincronamente durante a construção ([createBrowserClient.js:41]). Isso quebra
 * o SSR de Client Components ("use client"), que ainda rodam no servidor no
 * primeiro render — `window` é undefined lá.
 *
 * Fornecemos um adapter explícito que forwarda para `window.localStorage` no
 * browser e vira no-op durante SSR (onde nenhum `supabase.auth.*` é chamado
 * — essas operações rodam só em `useEffect`/handlers). É o mesmo padrão do
 * `createServerClient`, que usa `memoryLocalStorageAdapter()` no server.
 */
const browserUserStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

/**
 * getAll/setAll implementados manualmente via `document.cookie` para que
 * possamos passar `encode: 'tokens-only'` no objeto `cookies`. Sem isso,
 * o SDK lança erro exigindo as implementações quando um `cookies` custom
 * é fornecido ([@supabase/ssr cookies.js:79]).
 *
 * Replica o default do SDK para browser ([@supabase/ssr cookies.js:87-102]).
 */
const browserCookieMethods = {
  encode: 'tokens-only' as const,
  getAll() {
    if (typeof document === 'undefined') return [];
    return document.cookie
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const idx = pair.indexOf('=');
        const name = idx < 0 ? pair : pair.substring(0, idx);
        const value = idx < 0 ? '' : decodeURIComponent(pair.substring(idx + 1));
        return { name, value };
      });
  },
  setAll(
    cookiesToSet: Array<{
      name: string;
      value: string;
      options?: {
        domain?: string;
        path?: string;
        expires?: Date | number | string;
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
        priority?: 'low' | 'medium' | 'high';
        partitioned?: boolean;
      };
    }>,
  ) {
    if (typeof document === 'undefined') return;
    cookiesToSet.forEach(({ name, value, options = {} }) => {
      let cookieStr = `${name}=${encodeURIComponent(value)}`;
      if (options.maxAge !== undefined) cookieStr += `; Max-Age=${options.maxAge}`;
      if (options.expires) {
        const exp =
          options.expires instanceof Date
            ? options.expires
            : new Date(options.expires);
        cookieStr += `; Expires=${exp.toUTCString()}`;
      }
      if (options.path) cookieStr += `; Path=${options.path}`;
      if (options.domain) cookieStr += `; Domain=${options.domain}`;
      if (options.secure) cookieStr += `; Secure`;
      if (options.httpOnly) cookieStr += `; HttpOnly`;
      if (options.sameSite) {
        const val =
          options.sameSite === true
            ? 'Strict'
            : options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
        cookieStr += `; SameSite=${val}`;
      }
      if (options.priority) {
        cookieStr += `; Priority=${options.priority.charAt(0).toUpperCase() + options.priority.slice(1)}`;
      }
      if (options.partitioned) cookieStr += `; Partitioned`;
      document.cookie = cookieStr;
    });
  },
};

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
  //
  // `cookies.encode: 'tokens-only'` mantém apenas access/refresh tokens nos
  // cookies; o user object vai para `userStorage` (browserUserStorage acima),
  // que forwarda para `window.localStorage` no browser e é no-op no SSR.
  // Fornecê-lo explicitamente evita que o SDK dereferencie `window.localStorage`
  // durante construção no SSR de Client Components. Isto elimina o warning
  // "Using the user object as returned from supabase.auth.getSession()..."
  // que o SDK emite ao envolver `session.user` em Proxy no server-side.
  // Precisa estar sincronizado com os clients de server (server.ts,
  // api-auth.ts, proxy.ts).
  const options = {
    auth: {
      lockAcquireTimeout: LOCK_ACQUIRE_TIMEOUT_MS,
      userStorage: browserUserStorage,
    },
    cookies: browserCookieMethods,
  } as unknown as Parameters<typeof createBrowserClient>[2];

  return createBrowserClient<Database>(url, anonKey, options);
}
