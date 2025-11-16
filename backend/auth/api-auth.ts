// Utilitário de autenticação dual: Supabase Auth (front-end) + Bearer Token (API externa)

import { NextRequest } from 'next/server';

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  source?: 'session' | 'bearer';
}

/**
 * Autentica uma requisição verificando Supabase Auth ou Bearer Token
 * 
 * TEMPORÁRIO: Durante desenvolvimento, sempre retorna autenticado
 * TODO: Implementar autenticação real com Supabase após validação do backend
 * 
 * @param request - Requisição HTTP do Next.js
 * @returns Resultado da autenticação
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  // TEMPORÁRIO: Durante desenvolvimento, sempre autentica
  // TODO: Implementar lógica real de autenticação
  
  // Verificar se há Bearer Token no header
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Validar Bearer Token
    return {
      authenticated: true,
      userId: 'mock-user-id',
      source: 'bearer',
    };
  }

  // TODO: Verificar Supabase session (cookies)
  // Por enquanto, retorna autenticado para desenvolvimento
  return {
    authenticated: true,
    userId: 'mock-user-id',
    source: 'session',
  };
}
