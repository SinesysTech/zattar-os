import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware para gerenciar autenticação Supabase
 *
 * Segue a documentação oficial do Supabase para Next.js App Router:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Responsabilidades:
 * 1. Atualizar sessão do usuário automaticamente
 * 2. Redirecionar usuários não autenticados para /auth/login
 * 3. Permitir acesso a rotas públicas (/auth, /login)
 * 4. Não interferir em rotas de API (elas têm sua própria autenticação)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Criar cliente Supabase para middleware
  // IMPORTANTE: Sempre criar novo cliente a cada requisição
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Atualizar cookies na requisição
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Criar nova resposta com cookies atualizados
          supabaseResponse = NextResponse.next({
            request,
          });
          // Aplicar cookies na resposta
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE:
  // 1. Sempre chamar getSession() para atualizar a sessão (atualiza cookies se necessário)
  // 2. Usar getUser() para verificar autenticação de forma segura (valida com servidor)
  // getSession() atualiza a sessão, mas getUser() valida a autenticidade
  await supabase.auth.getSession();

  // Usar getUser() para verificação segura de autenticação
  // Isso valida os dados contactando o servidor Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Portal do Cliente Logic
  // Handles separate authentication using cookies for the client portal
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/meu-processo")) {
    // Allow root (login page) and public assets if any
    // Assuming /meu-processo is the login page.
    if (pathname === "/meu-processo") {
      return supabaseResponse;
    }

    // Check for portal session cookie
    const portalCookie = request.cookies.get("portal-cpf-session");
    if (!portalCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/meu-processo";
      return NextResponse.redirect(url);
    }
    // If session exists, allow access
    return supabaseResponse;
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/confirm",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Rotas de API não devem ser bloqueadas pelo middleware
  // Elas têm sua própria lógica de autenticação (Bearer token, Service API Key, etc.)
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Se não está autenticado e não é rota pública, redirecionar para login
  // Verificar tanto user quanto authError para garantir segurança
  if ((!user || authError) && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Preservar a URL original para redirecionar após login
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: Sempre retornar supabaseResponse para manter cookies sincronizados
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
