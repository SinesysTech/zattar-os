// Cliente Supabase para uso em serviços backend (sem cookies)
// Usa secret key para operações administrativas (scheduled jobs, sistema)
// Este cliente bypassa RLS e deve ser usado apenas em serviços backend

import { createClient } from '@supabase/supabase-js';

/**
 * Obtém configuração do Supabase a partir das variáveis de ambiente
 */
function getSupabaseConfig() {
  // A service_role key pode estar em SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (url && secretKey) {
    return { url, secretKey };
  }

  // Se chegou aqui, não há configuração disponível
  throw new Error(
    'Missing Supabase configuration. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) environment variables.'
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
  
  return createClient(
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

