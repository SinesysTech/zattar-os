import { deletePattern, CACHE_PREFIXES } from './cache-utils';

/**
 * Invalidates all pendentes cache entries.
 */
export async function invalidatePendentesCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.pendentes}:*`);
}

/**
 * Invalidates all audiencias cache entries.
 */
export async function invalidateAudienciasCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.audiencias}:*`);
}

/**
 * Invalidates all acervo cache entries.
 */
export async function invalidateAcervoCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.acervo}:*`);
}

/**
 * Invalidates all usuarios cache entries.
 */
export async function invalidateUsuariosCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.usuarios}:*`);
}

/**
 * Invalidates all clientes cache entries.
 */
export async function invalidateClientesCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.clientes}:*`);
}

/**
 * Invalidates all contratos cache entries.
 */
export async function invalidateContratosCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.contratos}:*`);
}

/**
 * Invalidates all list caches (pendentes, audiencias, acervo, usuarios, clientes, contratos, tiposExpedientes, cargos).
 */
export async function invalidateAllListCaches(): Promise<void> {
  await Promise.all([
    deletePattern(`${CACHE_PREFIXES.pendentes}:*`),
    deletePattern(`${CACHE_PREFIXES.audiencias}:*`),
    deletePattern(`${CACHE_PREFIXES.acervo}:*`),
    deletePattern(`${CACHE_PREFIXES.usuarios}:*`),
    deletePattern(`${CACHE_PREFIXES.clientes}:*`),
    deletePattern(`${CACHE_PREFIXES.contratos}:*`),
    deletePattern(`${CACHE_PREFIXES.tiposExpedientes}:*`),
    deletePattern(`${CACHE_PREFIXES.cargos}:*`),
  ]);
}

/**
 * Invalidates cache for a specific entity update.
 * Calls the appropriate invalidate function and deletes specific ID-based keys.
 */
export async function invalidateCacheOnUpdate(entityType: string, id: string): Promise<void> {
  switch (entityType) {
    case 'pendentes':
      await invalidatePendentesCache();
      await deletePattern(`${CACHE_PREFIXES.pendentes}:id:${id}`);
      break;
    case 'audiencias':
      await invalidateAudienciasCache();
      await deletePattern(`${CACHE_PREFIXES.audiencias}:id:${id}`);
      break;
    case 'acervo':
      await invalidateAcervoCache();
      await deletePattern(`${CACHE_PREFIXES.acervo}:id:${id}`);
      break;
    case 'usuarios':
      await invalidateUsuariosCache();
      await deletePattern(`${CACHE_PREFIXES.usuarios}:id:${id}`);
      await deletePattern(`${CACHE_PREFIXES.usuarios}:cpf:*`);
      await deletePattern(`${CACHE_PREFIXES.usuarios}:email:*`);
      break;
    case 'clientes':
      await invalidateClientesCache();
      await deletePattern(`${CACHE_PREFIXES.clientes}:id:${id}`);
      await deletePattern(`${CACHE_PREFIXES.clientes}:cpf:*`);
      await deletePattern(`${CACHE_PREFIXES.clientes}:cnpj:*`);
      break;
    case 'contratos':
      await invalidateContratosCache();
      await deletePattern(`${CACHE_PREFIXES.contratos}:id:${id}`);
      break;
    case 'tiposExpedientes':
      await deletePattern(`${CACHE_PREFIXES.tiposExpedientes}:*`);
      await deletePattern(`${CACHE_PREFIXES.tiposExpedientes}:id:${id}`);
      break;
    case 'cargos':
      await deletePattern(`${CACHE_PREFIXES.cargos}:*`);
      await deletePattern(`${CACHE_PREFIXES.cargos}:id:${id}`);
      break;
    case 'planoContas':
      await invalidatePlanoContasCache();
      await deletePattern(`${CACHE_PREFIXES.planoContas}:id:${id}`);
      await deletePattern(`${CACHE_PREFIXES.planoContas}:codigo:*`);
      break;
    default:
      console.warn(`Unknown entity type for cache invalidation: ${entityType}`);
  }
}

/**
 * Invalidates all plano de contas cache entries.
 */
export async function invalidatePlanoContasCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.planoContas}:*`);
}

/**
 * Invalidates notificacoes cache entries for current user.
 * Uses pattern matching to delete all cache keys starting with notificacoes prefix.
 */
export async function invalidateNotificacoesCache(): Promise<void> {
  // Pattern deletes all user-scoped cache keys like notificacoes:{"action":"...","usuarioId":123}
  await deletePattern(`${CACHE_PREFIXES.notificacoes}:*`);
}