import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Função auxiliar para atualizar sessão (usada por proxy.ts se necessário)
 * 
 * NOTA: O middleware principal está em /middleware.ts na raiz do projeto
 * Esta função é mantida para compatibilidade, mas o middleware.ts é o principal
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Criar cliente Supabase seguindo documentação oficial
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Atualizar cookies na requisição
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          // Criar nova resposta com cookies atualizados
          supabaseResponse = NextResponse.next({
            request,
          })
          // Aplicar cookies na resposta
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANTE: 
  // 1. Sempre chamar getSession() para atualizar a sessão (atualiza cookies se necessário)
  // 2. Usar getUser() para verificar autenticação de forma segura (valida com servidor)
  // getSession() atualiza a sessão, mas getUser() valida a autenticidade
  await supabase.auth.getSession()

  // Usar getUser() para verificação segura de autenticação
  // Isso valida os dados contactando o servidor Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rotas públicas
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/confirm']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Rotas de API não devem ser bloqueadas
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Se não está autenticado e não é rota pública, redirecionar para login
  // Verificar tanto user quanto authError para garantir segurança
  if ((!user || authError) && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: Sempre retornar supabaseResponse para manter cookies sincronizados
  return supabaseResponse
}
