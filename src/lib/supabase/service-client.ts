// Cliente Supabase para uso em serviços backend (sem cookies)
// Usa secret key para operações administrativas (scheduled jobs, sistema)
// Este cliente bypassa RLS e deve ser usado apenas em serviços backend

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Obtém configuração do Supabase a partir das variáveis de ambiente
 * 
 * Com as novas API keys do Supabase:
 * - Publishable Key: para uso no frontend (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY)
 * - Secret Key: para operações administrativas no backend (SUPABASE_SECRET_KEY)
 * 
 * A Secret Key substitui a antiga service_role key e deve ser usada para operações que bypassam RLS.
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Prioridade: SUPABASE_SECRET_KEY (nova chave) > SUPABASE_SERVICE_ROLE_KEY (legacy)
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && secretKey) {
    return { url, secretKey };
  }

  // Se chegou aqui, não há configuração disponível
  throw new Error(
    'Missing Supabase configuration. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy) environment variables. ' +
    'Note: With new Supabase API keys, use SUPABASE_SECRET_KEY (Secret Key) instead of the legacy service_role key.'
  );
}

/**
 * Cria um cliente Supabase com secret key para operações administrativas
 * 
 * USO:
 * - Scheduled jobs (capturas agendadas pelo sistema)
 * - Operações que precisam bypassar RLS
 * - NUNCA usar no browser (sempre retorna 401)
 * 
 * NÃO USAR para:
 * - Requisições on-demand de usuários autenticados (usar server.ts com publishable key)
 */
export function createServiceClient() {
  const config = getSupabaseConfig();
  
  return createClient<Database>(
    config.url,
    config.secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

