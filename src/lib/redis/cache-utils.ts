import { getRedisClient } from './client';
import { isRedisAvailable } from './utils';

const REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL || '600', 10);

// Re-export for convenience
export { isRedisAvailable } from './utils';

export const CACHE_PREFIXES = {
  pendentes: 'pendentes',
  audiencias: 'audiencias',
  acervo: 'acervo',
  usuarios: 'usuarios',
  clientes: 'clientes',
  contratos: 'contratos',
  tiposExpedientes: 'tipos_expedientes',
  cargos: 'cargos',
  classeJudicial: 'classe_judicial',
  tipoAudiencia: 'tipo_audiencia',
  salaAudiencia: 'sala_audiencia',
  orgaoJulgador: 'orgao_julgador',
  documentos: 'documentos',
  pastas: 'pastas',
  templates: 'templates',
  compartilhamentos: 'compartilhamentos',
  planoContas: 'plano_contas',
} as const;

// TTLs específicos para documentos (em segundos)
export const DOCUMENT_CACHE_TTLS = {
  documento: 300, // 5 minutos para documento individual
  listaDocumentos: 60, // 1 minuto para listagens (mudam frequentemente)
  templates: 600, // 10 minutos para templates
  pastas: 300, // 5 minutos para pastas
} as const;

/**
 * Generates a consistent cache key from prefix and params.
 * Serializes params deterministically by sorting object keys.
 */
export function generateCacheKey(prefix: string, params?: Record<string, unknown>): string {
  if (!params) return prefix;
  const sortedParams = sortObjectKeys(params);
  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

/**
 * Recursively sorts object keys for deterministic serialization.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted: Record<string, unknown> = {};
  Object.keys(obj as Record<string, unknown>).sort().forEach(key => {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  });
  return sorted;
}

/**
 * Retrieves cached data for the given key.
 * Returns null if not found or Redis unavailable.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) return null;

  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`Cache get failed for key ${key}:`, error);
    return null;
  }
}

/**
 * Sets data in cache with optional TTL.
 * Does nothing if Redis unavailable.
 */
export async function setCached<T>(key: string, data: T, ttl: number = REDIS_CACHE_TTL): Promise<void> {
  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) return;

  try {
    await client.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn(`Cache set failed for key ${key}:`, error);
  }
}

/**
 * Deletes a specific cache key.
 * Does nothing if Redis unavailable.
 */
export async function deleteCached(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) return;

  try {
    await client.del(key);
  } catch (error) {
    console.warn(`Cache delete failed for key ${key}:`, error);
  }
}

/**
 * Deletes cache keys matching the pattern.
 * Returns the number of deleted keys.
 * Uses KEYS command (inefficient for large datasets, consider SCAN in production).
 */
export async function deletePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) return 0;

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    const deleted = await client.del(...keys);
    return deleted;
  } catch (error) {
    console.warn(`Cache delete pattern failed for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Retrieves Redis cache statistics.
 * Returns an object with stats or empty if unavailable.
 */
export async function getCacheStats(): Promise<Record<string, string>> {
  const client = getRedisClient();
  if (!client || !(await isRedisAvailable())) return {};

  try {
    const info = await client.info();
    // Parse relevant stats from INFO output
    const stats: Record<string, string> = {};
    const lines = info.split('\n');
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (['used_memory', 'total_connections_received', 'keyspace_hits', 'keyspace_misses', 'uptime_in_seconds'].includes(key)) {
          stats[key] = value.trim();
        }
      }
    }
    return stats;
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return {};
  }
}

/**
 * Higher-order function that wraps an async function with caching.
 * Checks cache first, if miss, calls fn, caches result, returns.
 */
export async function withCache<T>(key: string, fn: () => Promise<T>, ttl: number = REDIS_CACHE_TTL): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await setCached(key, result, ttl);
  return result;
}

// ============================================================================
// DOCUMENT-SPECIFIC CACHE HELPERS
// ============================================================================

/**
 * Invalida o cache de um documento específico
 */
export async function invalidateDocumentoCache(documentoId: number): Promise<void> {
  await deleteCached(`${CACHE_PREFIXES.documentos}:${documentoId}`);
  // Invalida também listagens que podem conter o documento
  await deletePattern(`${CACHE_PREFIXES.documentos}:list:*`);
}

/**
 * Invalida cache de listagens de documentos
 */
export async function invalidateDocumentosListCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.documentos}:list:*`);
}

/**
 * Invalida cache de templates
 */
export async function invalidateTemplateCache(templateId?: number): Promise<void> {
  if (templateId) {
    await deleteCached(`${CACHE_PREFIXES.templates}:${templateId}`);
  }
  await deletePattern(`${CACHE_PREFIXES.templates}:list:*`);
}

/**
 * Invalida cache de pastas
 */
export async function invalidatePastaCache(pastaId?: number): Promise<void> {
  if (pastaId) {
    await deleteCached(`${CACHE_PREFIXES.pastas}:${pastaId}`);
  }
  await deletePattern(`${CACHE_PREFIXES.pastas}:*`);
}

/**
 * Invalida cache de compartilhamentos de um documento
 */
export async function invalidateCompartilhamentoCache(documentoId: number): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.compartilhamentos}:${documentoId}:*`);
}