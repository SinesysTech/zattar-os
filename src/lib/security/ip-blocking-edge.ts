/**
 * Edge-Compatible IP Blocking System
 *
 * Simplified version for Edge Runtime (middleware).
 * Uses only in-memory storage - no Redis dependency.
 *
 * For full functionality with Redis persistence, use ip-blocking.ts in Node.js runtime.
 *
 * @module lib/security/ip-blocking-edge
 */

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
// CONFIGURACAO
// =============================================================================

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
    windowMs: 5 * 60 * 1000, // 5 min
  },
  rate_limit_abuse: {
    count: parseInt(process.env.IP_BLOCK_RATE_LIMIT_ABUSE || '10', 10),
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  invalid_endpoints: {
    count: parseInt(process.env.IP_BLOCK_INVALID_ENDPOINTS || '20', 10),
    windowMs: 5 * 60 * 1000, // 5 min
  },
  manual: {
    count: 1,
    windowMs: 0,
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
// IN-MEMORY STORAGE (Edge Runtime compatible)
// =============================================================================

const inMemoryBlocked = new Map<
  string,
  { expiresAt: number; reason: BlockReason }
>();
const inMemoryWhitelist = new Set<string>(ENV_WHITELIST);
const inMemorySuspicious = new Map<string, number[]>();

/**
 * Cleanup expired entries
 */
function cleanupExpired(): void {
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

// =============================================================================
// FUNCOES PRINCIPAIS
// =============================================================================

/**
 * Check if an IP is whitelisted
 */
export function isIpWhitelisted(ip: string): boolean {
  return ENV_WHITELIST.includes(ip) || inMemoryWhitelist.has(ip);
}

/**
 * Check if an IP is blocked
 */
export function isIpBlocked(ip: string): boolean {
  if (!IP_BLOCKING_ENABLED) return false;

  // Check whitelist first
  if (isIpWhitelisted(ip)) {
    return false;
  }

  // Cleanup expired entries occasionally
  if (Math.random() < 0.1) {
    cleanupExpired();
  }

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
export function blockIp(
  ip: string,
  reason: BlockReason,
  ttlMs: number = DEFAULT_BLOCK_TTL_MS
): void {
  if (!IP_BLOCKING_ENABLED) return;

  // Don't block whitelisted IPs
  if (isIpWhitelisted(ip)) {
    console.warn(`[IP Blocking Edge] Attempted to block whitelisted IP: ${ip}`);
    return;
  }

  const permanent = ttlMs === 0;
  const expiresAt = permanent ? 0 : Date.now() + ttlMs;

  console.warn(`[IP Blocking Edge] Blocking IP: ${ip}`, {
    reason: reason.type,
    count: reason.count,
    permanent,
    expiresAt: permanent ? 'never' : new Date(expiresAt).toISOString(),
  });

  inMemoryBlocked.set(ip, { expiresAt, reason });
}

/**
 * Get block info for an IP
 */
export function getBlockInfo(ip: string): BlockedIpInfo | null {
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
 * Record suspicious activity and potentially auto-block
 */
export function recordSuspiciousActivity(
  ip: string,
  type: SuspiciousActivityType,
  details?: string
): { blocked: boolean; count: number } {
  if (!IP_BLOCKING_ENABLED) return { blocked: false, count: 0 };

  // Don't record for whitelisted IPs
  if (isIpWhitelisted(ip)) {
    return { blocked: false, count: 0 };
  }

  const threshold = BLOCK_THRESHOLDS[type];
  const now = Date.now();
  const memKey = `${type}:${ip}`;

  // Get existing timestamps and filter by window
  const timestamps = inMemorySuspicious.get(memKey) || [];
  const windowStart = now - threshold.windowMs;
  const filtered = timestamps.filter((t) => t > windowStart);
  filtered.push(now);
  inMemorySuspicious.set(memKey, filtered);

  const count = filtered.length;

  // Check if threshold exceeded
  if (count >= threshold.count) {
    blockIp(
      ip,
      {
        type,
        count,
        timestamp: now,
        details,
      },
      DEFAULT_BLOCK_TTL_MS
    );

    console.warn(`[IP Blocking Edge] Auto-blocked IP ${ip} for ${type}`, {
      count,
      threshold: threshold.count,
    });

    return { blocked: true, count };
  }

  return { blocked: false, count };
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
