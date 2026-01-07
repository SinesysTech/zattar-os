import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware para gerenciar autenticação Supabase e roteamento multi-app
 *
 * ARQUITETURA BASEADA EM DIRETÓRIOS:
 * - Website: / (raiz) -> Público
 * - Dashboard: /app/* -> Requer autenticação Supabase
 * - Portal do Cliente: /portal/* -> Requer sessão CPF
 *
 * Responsabilidades:
 * 1. Atualizar sessão do usuário automaticamente
 * 2. Redirecionar usuários não autenticados para /login
 * 3. Permitir acesso a rotas públicas
 * 4. Não interferir em rotas de API (elas têm sua própria autenticação)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Assets públicos que não precisam de processamento
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

  // Headers de debug
  const applyDebugHeaders = (response: NextResponse) => {
    response.headers.set("x-zattar-pathname", pathname);
    response.headers.set("x-zattar-app-type", getAppType(pathname));
    return response;
  };

  // Determinar qual app baseado no path
  function getAppType(path: string): "website" | "dashboard" | "portal" {
    if (path.startsWith("/app")) return "dashboard";
    if (path.startsWith("/portal")) return "portal";
    return "website";
  }

  const appType = getAppType(pathname);

  // ============================================================================
  // WEBSITE - Público (raiz /)
  // ============================================================================
  if (appType === "website") {
    // Website é sempre público, apenas passar
    return applyDebugHeaders(supabaseResponse);
  }

  // ============================================================================
  // PORTAL DO CLIENTE - Requer sessão CPF (/portal/*)
  // ============================================================================
  if (appType === "portal") {
    // Permitir acesso à página de login do portal
    if (pathname === "/portal" || pathname === "/portal/") {
      return applyDebugHeaders(supabaseResponse);
    }

    // Verificar cookie de sessão do portal
    const portalCookie = request.cookies.get("portal-cpf-session");
    if (!portalCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return applyDebugHeaders(NextResponse.redirect(url));
    }

    // Sessão válida, permitir acesso
    return applyDebugHeaders(supabaseResponse);
  }

  // ============================================================================
  // DASHBOARD - Requer autenticação Supabase (/app/*)
  // ============================================================================

  // Rotas de API não devem ser bloqueadas pelo middleware
  // Elas têm sua própria lógica de autenticação
  if (pathname.startsWith("/api/")) {
    return applyDebugHeaders(supabaseResponse);
  }

  // Rotas públicas do dashboard (login, signup, etc)
  const publicDashboardRoutes = [
    "/app/login",
    "/app/sign-up",
    "/app/sign-up-success",
    "/app/forgot-password",
    "/app/update-password",
    "/app/confirm",
    "/app/error",
  ];

  // Rotas públicas globais (assinatura digital, formulários)
  const globalPublicRoutes = [
    "/assinatura",
    "/formulario",
  ];

  const isPublicRoute =
    publicDashboardRoutes.some((route) => pathname.startsWith(route)) ||
    globalPublicRoutes.some((route) => pathname.startsWith(route));

  // Criar cliente Supabase para middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Atualizar e validar sessão
  await supabase.auth.getSession();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Se não está autenticado e não é rota pública, redirecionar para login
  if ((!user || authError) && !isPublicRoute) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar erros ao fazer signOut
    }

    const url = request.nextUrl.clone();
    url.pathname = "/app/login";
    url.searchParams.set("redirectTo", pathname);

    const redirectResponse = NextResponse.redirect(url);

    // Limpar cookies inválidos
    const cookiesToDelete = [
      "sb-access-token",
      "sb-refresh-token",
      "sb-provider-token",
      "sb-provider-refresh-token",
    ];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
        cookiesToDelete.push(`sb-${projectRef}-auth-token`);
        cookiesToDelete.push(`sb-${projectRef}-auth-token-code-verifier`);
      } catch {
        // Ignorar erro
      }
    }

    cookiesToDelete.forEach((cookieName) => {
      redirectResponse.cookies.delete(cookieName);
      redirectResponse.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    });

    return applyDebugHeaders(redirectResponse);
  }

  return applyDebugHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
