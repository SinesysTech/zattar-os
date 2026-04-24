/**
 * Cliente Supabase para serviços backend (sem cookies), bypassa RLS.
 *
 * Uso:
 * - Scheduled jobs (capturas agendadas pelo sistema)
 * - Operações administrativas que precisam ignorar RLS
 * - Repositórios e services que são executados APENAS no servidor
 *
 * NÃO usar para:
 * - Código que roda no browser (sempre retorna 401 e expõe a chave se bundled)
 * - Requisições on-demand de usuários autenticados (usar @/lib/supabase/server
 *   com a publishable key + cookies)
 *
 * Chaves do Supabase (nomenclatura oficial pós-migração — 2026):
 *   - Publishable Key (novo): `sb_publishable_…` — uso no frontend
 *   - Secret Key (novo):      `sb_secret_…`      — uso server-only, bypassa RLS
 *   - service_role (legacy JWT): aceito até o Supabase remover (late 2026).
 *     Mantido como fallback via SUPABASE_SERVICE_ROLE_KEY.
 *
 * Ref: https://supabase.com/docs — "API Key Migration"
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Falha ruidosamente se o módulo for carregado no browser.
 * Defesa em profundidade: a Secret Key nunca deve sair do servidor.
 */
function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[supabase/service-client] createServiceClient é server-only. ' +
        'Não importe este módulo de Client Components nem de código que roda no browser. ' +
        'Para uso no browser, utilize @/lib/supabase/client (publishable key).'
    );
  }
}

/**
 * Configuração do Supabase a partir das variáveis de ambiente.
 * Aceita a nova Secret Key (recomendada) e mantém fallback para a chave legacy
 * enquanto o Supabase não remove o suporte (previsto para late 2026).
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && secretKey) {
    return { url, secretKey };
  }

  throw new Error(
    'Missing Supabase configuration. ' +
      'Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (formato sb_secret_…) no ambiente. ' +
      'A variável legacy SUPABASE_SERVICE_ROLE_KEY ainda é aceita como fallback até o Supabase removê-la.'
  );
}

/**
 * Cria um cliente Supabase autenticado com Secret Key.
 *
 * Este cliente bypassa RLS e deve ser usado apenas em código server-side.
 * O guard `assertServerOnly` lança se for invocado no browser.
 */
export function createServiceClient() {
  assertServerOnly();
  const config = getSupabaseConfig();

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
