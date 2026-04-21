/**
 * Repository: Public Leads
 * ============================================================================
 * Acesso a public.public_leads via Supabase. O INSERT é chamado por Server
 * Action pública (sem autenticação) — usa o service client apenas porque o
 * form é anon; a validação/rate-limit ficam no service.
 * ============================================================================
 */

import 'server-only';

import { createServiceClient } from '@/lib/supabase/service-client';

import type { PublicLeadInput, PublicLeadMetadata, PublicLeadRow } from './domain';

export async function insertPublicLead(
  input: Omit<PublicLeadInput, 'website'>,
  metadata: PublicLeadMetadata,
): Promise<PublicLeadRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('public_leads')
    .insert({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone ?? null,
      assunto: input.assunto ?? null,
      mensagem: input.mensagem,
      source: input.source,
      user_agent: metadata.userAgent ?? null,
      ip: metadata.ip ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao registrar lead: ${error.message}`);
  }

  return data as PublicLeadRow;
}

/**
 * Conta leads do mesmo email nos últimos N minutos. Usado como anti-spam de
 * aplicação (complementa rate-limit por IP feito via Redis).
 */
export async function countRecentLeadsByEmail(
  email: string,
  windowMinutes: number,
): Promise<number> {
  const supabase = createServiceClient();

  const sinceIso = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count, error } = await supabase
    .from('public_leads')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', sinceIso);

  if (error) {
    // Em caso de falha de leitura, não bloqueamos o insert — apenas loggamos
    console.warn('[public-leads] countRecentLeadsByEmail falhou:', error.message);
    return 0;
  }

  return count ?? 0;
}
