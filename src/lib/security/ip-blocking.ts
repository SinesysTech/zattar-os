/**
 * IP Blocking System
 *
 * Implements automatic IP blocking based on suspicious behavior detection.
 * Uses Redis for distributed state management with graceful degradation.
 *
 * Features:
 * - Automatic blocking based on configurable thresholds
 * - Whitelist support for trusted IPs
 * - Temporary and permanent blocking
 * - Detailed logging of blocked attempts
 *
 * @module lib/security/ip-blocking
 */

import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/utils';

// =============================================================================
// TIPOS
// =============================================================================

export type SuspiciousActivityType =
  | 'auth_failures'
  | 'rate_limit_abuse'
  | 'invalid_endpoints'
  | 'manual';

export interface BlockReason {
  type: SuspiciousActivityType;
  count: number;
  timestamp: number;
  details?: string;
}

export interface BlockedIpInfo {
  ip: string;
  reason: BlockReason;
  blockedAt: Date;
  expiresAt: Date | null;
  permanent: boolean;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const BLOCK_PREFIX = 'security:blocked-ip:';
const REASON_PREFIX = 'security:block-reason:';
const WHITELIST_KEY = 'security:whitelist';
const SUSPICIOUS_PREFIX = 'security:suspicious:';

/**
 * Whether IP blocking is enabled
 */
const IP_BLOCKING_ENABLED = process.env.IP_BLOCKING_ENABLED !== 'false';

/**
 * Thresholds for automatic blocking
 */
const BLOCK_THRESHOLDS: Record<
  SuspiciousActivityType,
  { count: number; windowMs: number }
> = {
  auth_failures: {
    count: parseInt(process.env.IP_BLOCK_AUTH_FAILURES || '5', 10),
    windowMs: 5 * 60 * 1000, // 5 falhas em 5 minutos
  },
  rate_limit_abuse: {
    count: parseInt(process.env.IP_BLOCK_RATE_LIMIT_ABUSE || '10', 10),
    windowMs: 60 * 60 * 1000, // 10 vezes em 1 hora
  },
  invalid_endpoints: {
    count: parseInt(process.env.IP_BLOCK_INVALID_ENDPOINTS || '20', 10),
    windowMs: 5 * 60 * 1000, // 20 em 5 minutos
  },
  manual: {
    count: 1,
    windowMs: 0, // Imediato
  },
};

/**
 * Default TTL for temporary blocks (1 hour)
 */
const DEFAULT_BLOCK_TTL_MS = 60 * 60 * 1000;

/**
 * IPs always allowed (from environment)
 */
const ENV_WHITELIST = (process.env.IP_WHITELIST || '127.0.0.1,::1')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

// =============================================================================
// IN-MEMORY FALLBACK
// =============================================================================

/**
 * In-memory cache for when Redis is unavailable
 */
const inMemoryBlocked = new Map<string, { expiresAt: number; reason: BlockReason }>();
const inMemoryWhitelist = new Set<string>(ENV_WHITELIST);
const inMemorySuspicious = new Map<string, number[]>();

/**
 * Cleanup expired entries periodically
 */
function cleanupInMemory(): void {
  const now = Date.now();

  // Cleanup blocked IPs
  for (const [ip, data] of inMemoryBlocked.entries()) {
    if (data.expiresAt > 0 && data.expiresAt < now) {
      inMemoryBlocked.delete(ip);
    }
  }

  // Cleanup suspicious activity
  for (const [key, timestamps] of inMemorySuspicious.entries()) {
    const [, type] = key.split(':');
    const threshold = BLOCK_THRESHOLDS[type as SuspiciousActivityType];
    if (threshold) {
      const windowStart = now - threshold.windowMs;
      const filtered = timestamps.filter((t) => t > windowStart);
      if (filtered.length === 0) {
        inMemorySuspicious.delete(key);
      } else {
        inMemorySuspicious.set(key, filtered);
      }
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInMemory, 60 * 1000);
}

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

/**
 * Check if an IP is blocked
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!IP_BLOCKING_ENABLED) return false;

  // Check whitelist first
  if (await isIpWhitelisted(ip)) {
    return false;
  }

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const exists = await client.exists(`${BLOCK_PREFIX}${ip}`);
        return exists === 1;
      } catch (error) {
        console.error('[IP Blocking] Error checking blocked status:', error);
      }
    }
  }

  // Fallback to in-memory
  const blocked = inMemoryBlocked.get(ip);
  if (blocked) {
    if (blocked.expiresAt > 0 && blocked.expiresAt < Date.now()) {
      inMemoryBlocked.delete(ip);
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Block an IP address
 */
export async function blockIp(
  ip: string,
  reason: BlockReason,
  ttlMs: number = DEFAULT_BLOCK_TTL_MS
): Promise<void> {
  if (!IP_BLOCKING_ENABLED) return;

  // Don't block whitelisted IPs
  if (await isIpWhitelisted(ip)) {
    console.warn(`[IP Blocking] Attempted to block whitelisted IP: ${ip}`);
    return;
  }

  const permanent = ttlMs === 0;
  const expiresAt = permanent ? 0 : Date.now() + ttlMs;

  console.warn(`[IP Blocking] Blocking IP: ${ip}`, {
    reason: reason.type,
    count: reason.count,
    permanent,
    expiresAt: permanent ? 'never' : new Date(expiresAt).toISOString(),
  });

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const pipeline = client.pipeline();

        // Set blocked flag
        if (permanent) {
          pipeline.set(`${BLOCK_PREFIX}${ip}`, '1');
        } else {
          pipeline.set(`${BLOCK_PREFIX}${ip}`, '1', 'PX', ttlMs);
        }

        // Store reason
        pipeline.hset(`${REASON_PREFIX}${ip}`, {
          type: reason.type,
          count: reason.count.toString(),
          timestamp: reason.timestamp.toString(),
          details: reason.details || '',
          blockedAt: Date.now().toString(),
          expiresAt: expiresAt.toString(),
          permanent: permanent ? '1' : '0',
        });

        if (!permanent) {
          pipeline.pexpire(`${REASON_PREFIX}${ip}`, ttlMs);
        }

        await pipeline.exec();
        return;
      } catch (error) {
        console.error('[IP Blocking] Error blocking IP:', error);
      }
    }
  }

  // Fallback to in-memory
  inMemoryBlocked.set(ip, { expiresAt, reason });
}

/**
 * Unblock an IP address
 */
export async function unblockIp(ip: string): Promise<void> {
  console.log(`[IP Blocking] Unblocking IP: ${ip}`);

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.del(`${BLOCK_PREFIX}${ip}`, `${REASON_PREFIX}${ip}`);
      } catch (error) {
        console.error('[IP Blocking] Error unblocking IP:', error);
      }
    }
  }

  // Also remove from in-memory
  inMemoryBlocked.delete(ip);
}

/**
 * Check if an IP is whitelisted
 */
export async function isIpWhitelisted(ip: string): Promise<boolean> {
  // Check environment whitelist first
  if (ENV_WHITELIST.includes(ip)) {
    return true;
  }

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const isMember = await client.sismember(WHITELIST_KEY, ip);
        return isMember === 1;
      } catch (error) {
        console.error('[IP Blocking] Error checking whitelist:', error);
      }
    }
  }

  // Fallback to in-memory
  return inMemoryWhitelist.has(ip);
}

/**
 * Add an IP to the whitelist
 */
export async function addToWhitelist(ip: string): Promise<void> {
  console.log(`[IP Blocking] Adding IP to whitelist: ${ip}`);

  // Also unblock if blocked
  await unblockIp(ip);

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.sadd(WHITELIST_KEY, ip);
        return;
      } catch (error) {
        console.error('[IP Blocking] Error adding to whitelist:', error);
      }
    }
  }

  // Fallback to in-memory
  inMemoryWhitelist.add(ip);
}

/**
 * Remove an IP from the whitelist
 */
export async function removeFromWhitelist(ip: string): Promise<void> {
  console.log(`[IP Blocking] Removing IP from whitelist: ${ip}`);

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.srem(WHITELIST_KEY, ip);
      } catch (error) {
        console.error('[IP Blocking] Error removing from whitelist:', error);
      }
    }
  }

  // Also remove from in-memory (unless it's in ENV_WHITELIST)
  if (!ENV_WHITELIST.includes(ip)) {
    inMemoryWhitelist.delete(ip);
  }
}

/**
 * Record suspicious activity and potentially auto-block
 */
export async function recordSuspiciousActivity(
  ip: string,
  type: SuspiciousActivityType,
  details?: string
): Promise<{ blocked: boolean; count: number }> {
  if (!IP_BLOCKING_ENABLED) return { blocked: false, count: 0 };

  // Don't record for whitelisted IPs
  if (await isIpWhitelisted(ip)) {
    return { blocked: false, count: 0 };
  }

  const threshold = BLOCK_THRESHOLDS[type];
  const now = Date.now();
  const key = `${SUSPICIOUS_PREFIX}${type}:${ip}`;

  let count = 0;

  // Try Redis with sliding window
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const windowStart = now - threshold.windowMs;
        const member = `${now}:${Math.random().toString(36).substring(2, 7)}`;

        const pipeline = client.pipeline();
        pipeline.zremrangebyscore(key, '-inf', windowStart);
        pipeline.zadd(key, now, member);
        pipeline.zcard(key);
        pipeline.pexpire(key, threshold.windowMs);

        const results = await pipeline.exec();
        count = (results?.[2]?.[1] as number) || 0;
      } catch (error) {
        console.error('[IP Blocking] Error recording suspicious activity:', error);
      }
    }
  } else {
    // Fallback to in-memory
    const memKey = `${type}:${ip}`;
    const timestamps = inMemorySuspicious.get(memKey) || [];
    const windowStart = now - threshold.windowMs;
    const filtered = timestamps.filter((t) => t > windowStart);
    filtered.push(now);
    inMemorySuspicious.set(memKey, filtered);
    count = filtered.length;
  }

  // Check if threshold exceeded
  if (count >= threshold.count) {
    await blockIp(
      ip,
      {
        type,
        count,
        timestamp: now,
        details,
      },
      DEFAULT_BLOCK_TTL_MS
    );

    console.warn(`[IP Blocking] Auto-blocked IP ${ip} for ${type}`, {
      count,
      threshold: threshold.count,
    });

    return { blocked: true, count };
  }

  return { blocked: false, count };
}

/**
 * Get list of all blocked IPs (for admin dashboard)
 */
export async function getBlockedIps(): Promise<BlockedIpInfo[]> {
  const results: BlockedIpInfo[] = [];

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        // Scan for blocked IPs
        let cursor = '0';
        const blockedIps: string[] = [];

        do {
          const [newCursor, keys] = await client.scan(
            cursor,
            'MATCH',
            `${BLOCK_PREFIX}*`,
            'COUNT',
            100
          );
          cursor = newCursor;
          blockedIps.push(...keys.map((k) => k.replace(BLOCK_PREFIX, '')));
        } while (cursor !== '0');

        // Get details for each IP
        for (const ip of blockedIps) {
          const info = await getBlockInfo(ip);
          if (info) {
            results.push(info);
          }
        }
      } catch (error) {
        console.error('[IP Blocking] Error getting blocked IPs:', error);
      }
    }
  }

  // Also add in-memory blocked IPs
  for (const [ip, data] of inMemoryBlocked.entries()) {
    // Skip if already in Redis results
    if (results.some((r) => r.ip === ip)) continue;

    results.push({
      ip,
      reason: data.reason,
      blockedAt: new Date(data.reason.timestamp),
      expiresAt: data.expiresAt > 0 ? new Date(data.expiresAt) : null,
      permanent: data.expiresAt === 0,
    });
  }

  return results;
}

/**
 * Get detailed info for a blocked IP
 */
export async function getBlockInfo(ip: string): Promise<BlockedIpInfo | null> {
  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const data = await client.hgetall(`${REASON_PREFIX}${ip}`);
        if (!data || Object.keys(data).length === 0) {
          return null;
        }

        return {
          ip,
          reason: {
            type: data.type as SuspiciousActivityType,
            count: parseInt(data.count, 10),
            timestamp: parseInt(data.timestamp, 10),
            details: data.details || undefined,
          },
          blockedAt: new Date(parseInt(data.blockedAt, 10)),
          expiresAt:
            data.expiresAt && data.expiresAt !== '0'
              ? new Date(parseInt(data.expiresAt, 10))
              : null,
          permanent: data.permanent === '1',
        };
      } catch (error) {
        console.error('[IP Blocking] Error getting block info:', error);
      }
    }
  }

  // Check in-memory
  const memData = inMemoryBlocked.get(ip);
  if (memData) {
    return {
      ip,
      reason: memData.reason,
      blockedAt: new Date(memData.reason.timestamp),
      expiresAt: memData.expiresAt > 0 ? new Date(memData.expiresAt) : null,
      permanent: memData.expiresAt === 0,
    };
  }

  return null;
}

/**
 * Get list of whitelisted IPs
 */
export async function getWhitelistedIps(): Promise<string[]> {
  const results = new Set<string>(ENV_WHITELIST);

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const members = await client.smembers(WHITELIST_KEY);
        members.forEach((ip) => results.add(ip));
      } catch (error) {
        console.error('[IP Blocking] Error getting whitelisted IPs:', error);
      }
    }
  }

  // Add in-memory whitelist
  inMemoryWhitelist.forEach((ip) => results.add(ip));

  return Array.from(results);
}

/**
 * Clear all suspicious activity for an IP
 */
export async function clearSuspiciousActivity(ip: string): Promise<void> {
  console.log(`[IP Blocking] Clearing suspicious activity for IP: ${ip}`);

  // Try Redis
  if (await isRedisAvailable()) {
    const client = getRedisClient();
    if (client) {
      try {
        const types: SuspiciousActivityType[] = [
          'auth_failures',
          'rate_limit_abuse',
          'invalid_endpoints',
        ];
        const keys = types.map((type) => `${SUSPICIOUS_PREFIX}${type}:${ip}`);
        await client.del(...keys);
      } catch (error) {
        console.error('[IP Blocking] Error clearing suspicious activity:', error);
      }
    }
  }

  // Clear in-memory
  for (const key of inMemorySuspicious.keys()) {
    if (key.endsWith(`:${ip}`)) {
      inMemorySuspicious.delete(key);
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  IP_BLOCKING_ENABLED,
  BLOCK_THRESHOLDS,
  DEFAULT_BLOCK_TTL_MS,
  ENV_WHITELIST,
};
