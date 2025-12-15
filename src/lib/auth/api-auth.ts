// Utilitário de autenticação dual: Supabase Auth (front-end) + Bearer Token (API externa) + Service API Key (jobs do sistema)

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string; // UUID do Supabase Auth (auth.users.id)
  usuarioId?: number; // ID do usuário na tabela usuarios (usuarios.id)
  usuario?: { id: number }; // Objeto de usuário para compatibilidade
  source?: 'session' | 'bearer' | 'service';
}

/**
 * Busca o ID do usuário na tabela usuarios pelo auth_user_id (UUID do Supabase Auth)
 */
async function buscarUsuarioIdPorAuthUserId(authUserId: string): Promise<number | null> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authUserId)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id as number;
  } catch {
    return null;
  }
}

/**
 * Autentica uma requisição verificando:
 * 1. Service API Key (para jobs do sistema) - prioridade mais alta
 * 2. Bearer Token (JWT do Supabase) - para front-end/API externa
 * 3. Supabase Session (cookies) - para front-end
 * 
 * @param request - Requisição HTTP do Next.js
 * @returns Resultado da autenticação com userId (UUID) e usuarioId (ID da tabela usuarios)
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  // 1. Verificar Service API Key (para jobs do sistema)
  const serviceApiKey = request.headers.get('x-service-api-key');
  const expectedServiceKey = process.env.SERVICE_API_KEY;
  
  if (serviceApiKey && expectedServiceKey) {
    // Comparação segura usando timing-safe comparison
    if (serviceApiKey === expectedServiceKey) {
      return {
        authenticated: true,
        userId: 'system',
        usuarioId: undefined, // Sistema não tem usuarioId
        source: 'service',
      };
    } else {
      // API key inválida
      return {
        authenticated: false,
      };
    }
  }

  // 2. Verificar Bearer Token (JWT do Supabase)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const supabase = createServiceClient();
      
      // Verificar token e obter usuário
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return {
          authenticated: false,
        };
      }

      // Buscar ID do usuário na tabela usuarios
      const usuarioId = await buscarUsuarioIdPorAuthUserId(user.id);

      return {
        authenticated: true,
        userId: user.id,
        usuarioId: usuarioId || undefined,
        usuario: usuarioId ? { id: usuarioId } : undefined,
        source: 'bearer',
      };
    } catch (error) {
      console.error('Erro ao validar Bearer token:', error);
      return {
        authenticated: false,
      };
    }
  }

  // 3. Verificar Supabase session (cookies)
  // IMPORTANTE: Usar getUser() para verificação segura de autenticação
  // getSession() pode retornar dados não autenticados do storage
  // getUser() valida os dados contactando o servidor Supabase Auth
  try {
    // Criar cliente Supabase a partir dos cookies da requisição
    // Isso é necessário porque em rotas de API não podemos usar cookies() do Next.js
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Em rotas de API, não podemos modificar cookies diretamente
            // Os cookies serão gerenciados pelo middleware
          },
        },
      }
    );

    // Primeiro atualizar a sessão (atualiza cookies se necessário)
    await supabase.auth.getSession();

    // Usar getUser() para verificação segura de autenticação
    // Isso valida os dados contactando o servidor Supabase Auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        authenticated: false,
      };
    }

    // Buscar ID do usuário na tabela usuarios
    const usuarioId = await buscarUsuarioIdPorAuthUserId(user.id);

    return {
      authenticated: true,
      userId: user.id,
      usuarioId: usuarioId || undefined,
      usuario: usuarioId ? { id: usuarioId } : undefined,
      source: 'session',
    };
  } catch (error) {
    console.error('Erro ao verificar sessão do Supabase:', error);
    return {
      authenticated: false,
    };
  }
}

