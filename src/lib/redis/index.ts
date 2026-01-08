/**
 * Barrel export para módulo Redis/Cache
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { getCached, setCached } from '@/lib/redis/cache-utils';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { getCached, setCached } from '@/lib/redis';
 */

// ============================================================================
// Client
// ============================================================================
export { getRedisClient, closeRedisClient } from './client';

// ============================================================================
// Utils
// ============================================================================
export { isRedisAvailable } from './utils';

// ============================================================================
// Cache Utils
// ============================================================================
export {
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
} from './cache-utils';

// ============================================================================
// Cache Keys
// ============================================================================
export {
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
} from './cache-keys';

// ============================================================================
// Invalidation
// ============================================================================
export {
  invalidatePendentesCache,
  invalidateAudienciasCache,
  invalidateAcervoCache,
  invalidateUsuariosCache,
  invalidateClientesCache,
  invalidateContratosCache,
  invalidateAllListCaches,
  invalidateCacheOnUpdate,
  invalidatePlanoContasCache,
} from './invalidation';