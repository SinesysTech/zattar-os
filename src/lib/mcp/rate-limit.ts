/**
 * Rate Limiting para MCP do Sinesys
 *
 * Implementa rate limiting por tier (anonymous, authenticated, service)
 * usando Redis como backend.
 */

import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/utils';

// =============================================================================
// TIPOS
// =============================================================================

export type RateLimitTier = 'anonymous' | 'authenticated' | 'service';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const DEFAULT_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  anonymous: { windowMs: 60000, maxRequests: 10 }, // 10 req/min
  authenticated: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  service: { windowMs: 60000, maxRequests: 1000 }, // 1000 req/min
};

const RATE_LIMIT_PREFIX = 'mcp:ratelimit:';

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

/**
 * Verifica rate limit para um identificador
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  const config = DEFAULT_LIMITS[tier];
  const key = `${RATE_LIMIT_PREFIX}${tier}:${identifier}`;

  // Se Redis não disponível, permitir (fail open)
  if (!(await isRedisAvailable())) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  const client = getRedisClient();
  if (!client) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  try {
    // Incrementar contador
    const current = await client.incr(key);

    // Se é primeira requisição, definir TTL
    if (current === 1) {
      await client.pexpire(key, config.windowMs);
    }

    // Obter TTL restante
    const ttl = await client.pttl(key);
    const resetAt = new Date(Date.now() + Math.max(ttl, 0));

    const allowed = current <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current);

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('[Rate Limit] Erro ao verificar rate limit:', error);
    // Fail open em caso de erro
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }
}

/**
 * Reseta rate limit para um identificador
 */
export async function resetRateLimit(identifier: string, tier: RateLimitTier): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${tier}:${identifier}`;

  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error('[Rate Limit] Erro ao resetar rate limit:', error);
  }
}

/**
 * Obtém status atual do rate limit
 */
export async function getRateLimitStatus(
  identifier: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const config = DEFAULT_LIMITS[tier];
  const key = `${RATE_LIMIT_PREFIX}${tier}:${identifier}`;

  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  try {
    const [current, ttl] = await Promise.all([client.get(key), client.pttl(key)]);

    const currentCount = current ? parseInt(current, 10) : 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetAt = new Date(Date.now() + Math.max(ttl, 0));

    return {
      allowed: remaining > 0,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('[Rate Limit] Erro ao obter status:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }
}

// =============================================================================
// RATE LIMIT POR TOOL
// =============================================================================

/**
 * Verifica rate limit específico para uma tool
 */
export async function checkToolRateLimit(
  identifier: string,
  toolName: string,
  tier: RateLimitTier = 'authenticated'
): Promise<RateLimitResult> {
  // Para tools específicas, podemos ter limites diferentes
  const toolSpecificLimits: Record<string, Partial<RateLimitConfig>> = {
    busca_semantica: { maxRequests: 20 }, // Mais restritivo por usar IA
    gerar_resumo_chamada: { maxRequests: 10 },
  };

  const baseConfig = DEFAULT_LIMITS[tier];
  const toolConfig = toolSpecificLimits[toolName];

  const config: RateLimitConfig = {
    windowMs: toolConfig?.windowMs || baseConfig.windowMs,
    maxRequests: toolConfig?.maxRequests || baseConfig.maxRequests,
  };

  const key = `${RATE_LIMIT_PREFIX}tool:${toolName}:${tier}:${identifier}`;

  // Mesma lógica de checkRateLimit mas com config customizada
  if (!(await isRedisAvailable())) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  const client = getRedisClient();
  if (!client) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }

  try {
    const current = await client.incr(key);

    if (current === 1) {
      await client.pexpire(key, config.windowMs);
    }

    const ttl = await client.pttl(key);
    const resetAt = new Date(Date.now() + Math.max(ttl, 0));

    return {
      allowed: current <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current),
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('[Rate Limit] Erro ao verificar rate limit de tool:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
      limit: config.maxRequests,
    };
  }
}

// =============================================================================
// ERRO DE RATE LIMIT
// =============================================================================

export class RateLimitError extends Error {
  constructor(
    public resetAt: Date,
    public remaining: number,
    public limit: number
  ) {
    super(`Rate limit excedido. Tente novamente em ${Math.ceil((resetAt.getTime() - Date.now()) / 1000)} segundos.`);
    this.name = 'RateLimitError';
  }
}

// =============================================================================
// HEADERS HTTP
// =============================================================================

/**
 * Gera headers de rate limit para resposta HTTP
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.allowed ? {} : { 'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString() }),
  };
}
