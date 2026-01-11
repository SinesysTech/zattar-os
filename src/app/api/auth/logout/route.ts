/**
 * API Route para logout
 * 
 * Limpa todos os cookies de sessão do Supabase, mesmo quando a sessão já expirou.
 * Isso permite que o logout funcione mesmo quando o token já está inválido.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Criar cliente Supabase para acessar cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Cookies serão gerenciados pela resposta
          },
        },
      }
    );

    // Tentar fazer signOut (pode falhar se a sessão já expirou, mas não é problema)
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar erros de signOut quando a sessão já expirou
      console.log('Sessão já expirada, apenas limpando cookies');
    }

    // Criar resposta de sucesso
    const response = NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    );

    // Nota: localStorage é limpo pelo cliente via useAuth hook
    // pois não temos acesso ao localStorage no servidor

    // Limpar todos os cookies do Supabase manualmente
    // Nomes padrão dos cookies do Supabase Auth
    const supabaseCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token',
      'sb-provider-refresh-token',
    ];

    // Também limpar cookies com prefixo do projeto (formato: sb-{project-ref}-auth-token)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        supabaseCookies.push(`sb-${projectRef}-auth-token`);
        supabaseCookies.push(`sb-${projectRef}-auth-token-code-verifier`);
      } catch {
        // Ignorar erro ao extrair project ref
      }
    }

    // Deletar todos os cookies do Supabase
    supabaseCookies.forEach((cookieName) => {
      response.cookies.delete(cookieName);
      // Também tentar deletar com path e domain explícitos
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return response;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    
    // Mesmo em caso de erro, tentar limpar cookies
    const errorResponse = NextResponse.json(
      { success: false, error: 'Erro ao fazer logout' },
      { status: 500 }
    );

    // Limpar cookies mesmo em caso de erro
    // Nomes padrão dos cookies do Supabase Auth
    const supabaseCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token',
      'sb-provider-refresh-token',
    ];

    // Também limpar cookies com prefixo do projeto (formato: sb-{project-ref}-auth-token)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        supabaseCookies.push(`sb-${projectRef}-auth-token`);
        supabaseCookies.push(`sb-${projectRef}-auth-token-code-verifier`);
      } catch {
        // Ignorar erro ao extrair project ref
      }
    }

    // Deletar todos os cookies do Supabase (incluindo os específicos do projeto)
    supabaseCookies.forEach((cookieName) => {
      errorResponse.cookies.delete(cookieName);
      // Também tentar deletar com path e domain explícitos
      errorResponse.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return errorResponse;
  }
}
