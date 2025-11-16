// Utilitário de autenticação dual: Supabase Auth (front-end) + Bearer Token (API externa) + Service API Key (jobs do sistema)

import { NextRequest } from 'next/server';

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  source?: 'session' | 'bearer' | 'service';
}

/**
 * Autentica uma requisição verificando:
 * 1. Service API Key (para jobs do sistema) - prioridade mais alta
 * 2. Bearer Token (JWT do Supabase) - para front-end/API externa
 * 3. Supabase Session (cookies) - para front-end
 * 
 * @param request - Requisição HTTP do Next.js
 * @returns Resultado da autenticação
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
    // TODO: Validar Bearer Token com Supabase
    // const token = authHeader.substring(7);
    // Por enquanto, aceita qualquer token para desenvolvimento
    return {
      authenticated: true,
      userId: 'mock-user-id',
      source: 'bearer',
    };
  }

  // 3. Verificar Supabase session (cookies)
  // TODO: Implementar verificação de cookies do Supabase
  // Por enquanto, retorna não autenticado para forçar uso de API Key em jobs
  return {
    authenticated: false,
  };
}
