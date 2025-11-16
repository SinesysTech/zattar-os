// Cliente Supabase para uso em serviços backend (sem cookies)
// Usa secret key para operações administrativas (scheduled jobs, sistema)
// Este cliente bypassa RLS e deve ser usado apenas em serviços backend

import { createClient } from '@supabase/supabase-js';

// Importação condicional do mock config (apenas para testes)
// Usa type assertion para evitar erro de tipo quando não disponível
let mockConfigModule: typeof import('@/dev_data/storage/mock-config') | null = null;

try {
  // Tentar importar mock config usando path alias (funciona com tsx)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mockConfigModule = require('@/dev_data/storage/mock-config') as typeof import('@/dev_data/storage/mock-config');
} catch {
  // Ignorar erro se mock-config não estiver disponível (normal em produção)
  mockConfigModule = null;
}

/**
 * Obtém configuração do Supabase
 * Prioriza variáveis de ambiente, mas usa valores mockados como fallback para testes
 */
function getSupabaseConfig() {
  // Tentar usar variáveis de ambiente primeiro
  // A service_role key pode estar em SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (url && secretKey) {
    return { url, secretKey };
  }

  // Se não houver variáveis de ambiente, tentar usar mock config
  if (mockConfigModule) {
    const mockSupabase = mockConfigModule.MOCK_SUPABASE_CONFIG || mockConfigModule.getMockSupabaseConfig?.();
    
    if (mockSupabase?.url && mockSupabase?.secretKey) {
      // Validar que não são valores placeholder
      if (mockSupabase.url !== 'https://your-project.supabase.co' && 
          mockSupabase.secretKey !== 'your-secret-key-here') {
        return {
          url: mockSupabase.url,
          secretKey: mockSupabase.secretKey,
        };
      }
    }
  }

  // Se chegou aqui, não há configuração disponível
  throw new Error(
    'Missing Supabase configuration. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) environment variables, ' +
    'or configure MOCK_SUPABASE_CONFIG in dev_data/storage/mock-config.ts'
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

