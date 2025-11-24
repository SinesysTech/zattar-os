// Utilitário de autenticação dual: Supabase Auth (front-end) + Bearer Token (API externa) + Service API Key (jobs do sistema)

import { NextRequest } from 'next/server';
import { createClient } from '@/backend/utils/supabase/server';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string; // UUID do Supabase Auth (auth.users.id)
  usuarioId?: number; // ID do usuário na tabela usuarios (usuarios.id)
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
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
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
      source: 'session',
    };
  } catch (error) {
    console.error('Erro ao verificar sessão do Supabase:', error);
    return {
      authenticated: false,
    };
  }
}

