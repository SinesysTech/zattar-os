/**
 * Barrel export para módulo lib (utilitários core)
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { getLogger } from '@/lib/logger';
 * import { getCached, setCached } from '@/lib/redis/cache-utils';
 * import { createClient } from '@/lib/supabase/client';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { getLogger, getCached, createClient } from '@/lib';
 */

// ============================================================================
// Redis/Cache
// ============================================================================
export {
  // Client
  getRedisClient,
  closeRedisClient,
  // Utils
  isRedisAvailable,
  // Cache Utils
  CACHE_PREFIXES,
  DOCUMENT_CACHE_TTLS,
  generateCacheKey,
  getCached,
  setCached,
  deleteCached,
  deletePattern,
  getCacheStats,
  withCache,
  invalidateDocumentoCache,
  invalidateDocumentosListCache,
  invalidateTemplateCache,
  invalidatePastaCache,
  invalidateCompartilhamentoCache,
  // Cache Keys
  getPendentesListKey,
  getPendentesGroupKey,
  getAudienciasListKey,
  getAcervoListKey,
  getAcervoGroupKey,
  getUsuariosListKey,
  getClientesListKey,
  getContratosListKey,
  getTiposExpedientesListKey,
  getCargosListKey,
  getPlanoContasListKey,
  getPlanoContasHierarquiaKey,
  // Invalidation
  invalidatePendentesCache,
  invalidateAudienciasCache,
  invalidateAcervoCache,
  invalidateUsuariosCache,
  invalidateClientesCache,
  invalidateContratosCache,
  invalidateAllListCaches,
  invalidateCacheOnUpdate,
  invalidatePlanoContasCache,
} from './redis';

// ============================================================================
// Distributed Lock
// ============================================================================
export type { LockOptions } from './utils/locks/distributed-lock';
export { DistributedLock, withDistributedLock } from './utils/locks/distributed-lock';

// ============================================================================
// Logger
// ============================================================================
export type { Logger } from './logger';
export {
  correlationStorage,
  baseLogger,
  getLogger,
  withCorrelationId,
} from './logger';
export { default as logger } from './logger';

// ============================================================================
// Retry Utilities
// ============================================================================
export type { RetryOptions } from './utils/retry';
export { withRetry, createRetryable } from './utils/retry';

// ============================================================================
// Supabase
// ============================================================================
export type { DbClient } from './supabase';
export {
  // Client (Browser)
  createClient,
  // Service Client (Backend)
  createServiceClient,
  // DB Client (Core)
  createDbClient,
  getDbClient,
  // User Context Helpers
  atribuirResponsavelAcervo,
  atribuirResponsavelAudiencia,
  atribuirResponsavelPendente,
} from './supabase';

// Re-export all database types
export type * from './supabase/database.types';
