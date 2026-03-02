import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  shouldApplySecurityHeaders,
  applySecurityHeaders,
  generateNonce,
} from "@/middleware/security-headers";

/**
 * Supabase Auth Middleware
 *
 * Responsável por:
 * 1. Refresh automático do access token JWT em cada request
 * 2. Aplicar headers de segurança (CSP, HSTS, etc.)
 *
 * Sem este middleware, o token expira após 1h e as queries ao banco
 * falham com "new row violates row-level security policy" porque
 * auth.uid() retorna NULL no contexto do PostgREST.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token - IMPORTANT: do not remove this call.
  // It triggers the token refresh if the access token is expired,
  // updating the cookies in the response so the server-side
  // Supabase client has a valid JWT for auth.uid() in RLS policies.
  await supabase.auth.getUser();

  // Apply security headers
  const { pathname } = request.nextUrl;
  if (shouldApplySecurityHeaders(pathname)) {
    const nonce = generateNonce();
    applySecurityHeaders(supabaseResponse.headers, nonce);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (images, SW, manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
