import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        // `encode: 'tokens-only'` mantém apenas access/refresh tokens nos
        // cookies; o user object vai para `memoryLocalStorageAdapter()` no
        // server. Elimina o warning "Using the user object as returned from
        // supabase.auth.getSession()..." que o SDK emite ao envolver
        // `session.user` em Proxy no server-side. Deve estar sincronizado
        // com client.ts, api-auth.ts e proxy.ts.
        encode: 'tokens-only',
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

