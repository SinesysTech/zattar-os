/**
 * Service: Public Leads
 * ============================================================================
 * Orquestração da submissão de lead pelo formulário público:
 *  1. Honeypot check (descarta silenciosamente se campo oculto veio preenchido)
 *  2. Rate-limit por IP via Redis (60s) — fail-open se Redis indisponível
 *  3. Anti-spam de aplicação: mesmo email nos últimos 5min = bloqueio
 *  4. Insert na tabela via repository
 * ============================================================================
 */

import 'server-only';

import { getRedisClient } from '@/lib/redis/client';

import type { PublicLeadInput, PublicLeadMetadata, PublicLeadRow } from './domain';
import { countRecentLeadsByEmail, insertPublicLead } from './repository';

const RATE_LIMIT_WINDOW_SEC = 60;
const DEDUP_EMAIL_WINDOW_MIN = 5;

export class RateLimitError extends Error {
  constructor(message = 'Aguarde um momento antes de enviar outra mensagem.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DuplicateLeadError extends Error {
  constructor(message = 'Recebemos uma mensagem sua há pouco. Aguarde nossa resposta.') {
    super(message);
    this.name = 'DuplicateLeadError';
  }
}

/**
 * Resultado do submitLead. O honeypot hit retorna sucesso silencioso (bot
 * acha que deu certo, mas nada é persistido).
 */
export type SubmitLeadResult =
  | { kind: 'created'; lead: PublicLeadRow }
  | { kind: 'honeypot' };

/**
 * Rate-limit por IP. Fail-open: se Redis indisponível, permite a requisição.
 */
async function checkIpRateLimit(ip: string | null | undefined): Promise<void> {
  if (!ip) return;

  const redis = getRedisClient();
  if (!redis) return; // Redis off → fail-open

  const key = `public-lead:ratelimit:${ip}`;
  try {
    // SET NX + EX: cria a chave apenas se não existir, com TTL de 60s
    const set = await redis.set(key, '1', 'EX', RATE_LIMIT_WINDOW_SEC, 'NX');
    if (set !== 'OK') {
      throw new RateLimitError();
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    // Falhas de rede/Redis: fail-open, loga e segue
    console.warn('[public-leads] rate-limit check falhou:', err);
  }
}

/**
 * Dedupe por email: mais de 1 lead do mesmo email em 5min → bloqueio.
 */
async function checkEmailDedup(email: string): Promise<void> {
  const count = await countRecentLeadsByEmail(email, DEDUP_EMAIL_WINDOW_MIN);
  if (count >= 1) {
    throw new DuplicateLeadError();
  }
}

export async function submitLead(
  input: PublicLeadInput,
  metadata: PublicLeadMetadata,
): Promise<SubmitLeadResult> {
  // 1. Honeypot: se `website` veio preenchido, bot detectado
  if (input.website && input.website.length > 0) {
    return { kind: 'honeypot' };
  }

  // 2. Rate-limit por IP
  await checkIpRateLimit(metadata.ip);

  // 3. Dedupe email
  await checkEmailDedup(input.email);

  // 4. Insert
  const { website: _honeypot, ...inputData } = input;
  const lead = await insertPublicLead(inputData, metadata);

  return { kind: 'created', lead };
}
