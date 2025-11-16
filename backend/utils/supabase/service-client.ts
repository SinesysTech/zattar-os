// Cliente Supabase para uso em serviços backend (sem cookies)
// Usa secret key para operações administrativas (scheduled jobs, sistema)
// Este cliente bypassa RLS e deve ser usado apenas em serviços backend

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY environment variable');
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

