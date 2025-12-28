import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware para gerenciar autenticação Supabase e roteamento multi-app
 *
 * Segue a documentação oficial do Supabase para Next.js App Router:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Responsabilidades:
 * 1. Atualizar sessão do usuário automaticamente
 * 2. Redirecionar usuários não autenticados para /auth/login
 * 3. Permitir acesso a rotas públicas (/auth, /login, /website)
 * 4. Não interferir em rotas de API (elas têm sua própria autenticação)
 * 5. Suportar roteamento baseado em domínio (multi-app)
 *
 * ARQUITETURA MULTI-APP:
 * - Dashboard: app.zattaradvogados.com -> / (dashboard routes)
 * - Website: zattaradvogados.com -> /website/*
 * - Meu Processo: meuprocesso.zattaradvogados.com -> /meu-processo/*
 *
 * Em produção, um reverse proxy (Nginx/Cloudflare) deve rotear os domínios
 * para os paths corretos. Este middleware valida e aplica autenticação.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Detectar domínio e pathname para roteamento multi-app
  const hostname = request.headers.get("host") || "";
  let pathname = request.nextUrl.pathname;

  // Extrair domínio base (sem porta)
  const domain = hostname.split(":")[0];

  const isLocalhost = domain === "localhost" || domain === "127.0.0.1";
  const isPublicRootAsset =
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/workbox-") ||
    pathname.startsWith("/android-chrome-") ||
    pathname.startsWith("/apple-touch-icon");

  if (isPublicRootAsset) {
    return supabaseResponse;
  }

  // Detectar qual app está sendo acessado baseado no domínio
  // Em desenvolvimento, usar pathname; em produção, usar domínio
  const isProduction = process.env.NODE_ENV === "production";
  const dashboardDomain = process.env.NEXT_PUBLIC_DASHBOARD_URL
    ? new URL(process.env.NEXT_PUBLIC_DASHBOARD_URL).hostname
    : "";
  const meuProcessoDomain = process.env.NEXT_PUBLIC_MEU_PROCESSO_URL
    ? new URL(process.env.NEXT_PUBLIC_MEU_PROCESSO_URL).hostname
    : "";
  const websiteDomain = process.env.NEXT_PUBLIC_WEBSITE_URL
    ? new URL(process.env.NEXT_PUBLIC_WEBSITE_URL).hostname
    : "";

  const detectByDomain =
    isProduction ||
    (!isLocalhost && (domain.includes("app.") || domain.includes("meuprocesso."))) ||
    domain === dashboardDomain ||
    domain === meuProcessoDomain ||
    domain === websiteDomain;

  // Determinar qual app está sendo acessado
  let appType: "dashboard" | "meu-processo" | "website" | "unknown" = "unknown";

  if (detectByDomain) {
    // Em produção, detectar por domínio
    if (domain === dashboardDomain || domain.includes("app.")) {
      appType = "dashboard";
    } else if (domain === meuProcessoDomain || domain.includes("meuprocesso.")) {
      appType = "meu-processo";
    } else if (domain === websiteDomain || (!domain.includes("app.") && !domain.includes("meuprocesso."))) {
      appType = "website";
    }
  } else {
    // Em desenvolvimento, detectar por pathname
    if (pathname.startsWith("/meu-processo")) {
      appType = "meu-processo";
    } else if (pathname.startsWith("/website")) {
      appType = "website";
    } else {
      appType = "dashboard";
    }
  }

  if (appType === "website" || pathname.startsWith("/website")) {
    if (
      detectByDomain &&
      appType === "website" &&
      !pathname.startsWith("/website") &&
      !pathname.startsWith("/api/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/website${pathname}`;
      return NextResponse.rewrite(url);
    }
    return supabaseResponse;
  }

  let meuProcessoRewriteUrl: URL | null = null;
  if (
    detectByDomain &&
    appType === "meu-processo" &&
    !pathname.startsWith("/meu-processo") &&
    !pathname.startsWith("/api/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/meu-processo${pathname}`;
    meuProcessoRewriteUrl = url;
    pathname = url.pathname;
  }

  if (appType === "meu-processo" || pathname.startsWith("/meu-processo")) {
    // Allow root (login page) and public assets if any
    if (pathname === "/meu-processo" || pathname === "/meu-processo/") {
      return meuProcessoRewriteUrl ? NextResponse.rewrite(meuProcessoRewriteUrl) : supabaseResponse;
    }

    // Check for portal session cookie
    const portalCookie = request.cookies.get("portal-cpf-session");
    if (!portalCookie) {
      const url = request.nextUrl.clone();
      // Em produção com domínio separado, redirecionar para o domínio correto
      if (!isLocalhost && meuProcessoDomain && domain !== meuProcessoDomain) {
        url.host = meuProcessoDomain;
      }
      url.pathname = "/meu-processo";
      return NextResponse.redirect(url);
    }
    // If session exists, allow access
    return meuProcessoRewriteUrl ? NextResponse.rewrite(meuProcessoRewriteUrl) : supabaseResponse;
  }

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

  // ============================================================================
  // ROTEAMENTO POR APP
  // ============================================================================

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/confirm",
    "/website", // Website é sempre público
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Rotas de API não devem ser bloqueadas pelo middleware
  // Elas têm sua própria lógica de autenticação (Bearer token, Service API Key, etc.)
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Dashboard: Requer autenticação Supabase
  // Se não está autenticado e não é rota pública, limpar cookies e redirecionar para login
  // Também tratar "unknown" como dashboard (fallback)
  if ((appType === "dashboard" || appType === "unknown") && (!user || authError) && !isPublicRoute) {
    // Tentar fazer signOut (pode falhar se sessão já expirou)
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar erros ao fazer signOut quando a sessão já está inválida
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Preservar a URL original para redirecionar após login
    url.searchParams.set("redirectTo", pathname);
    
    // Criar resposta de redirecionamento
    const redirectResponse = NextResponse.redirect(url);
    
    // Limpar cookies inválidos
    const cookiesToDelete = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token',
      'sb-provider-refresh-token',
    ];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        cookiesToDelete.push(`sb-${projectRef}-auth-token`);
        cookiesToDelete.push(`sb-${projectRef}-auth-token-code-verifier`);
      } catch {
        // Ignorar erro
      }
    }

    cookiesToDelete.forEach((cookieName) => {
      redirectResponse.cookies.delete(cookieName);
      redirectResponse.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return redirectResponse;
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
