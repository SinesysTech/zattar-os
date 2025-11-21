import { generateCacheKey, CACHE_PREFIXES } from './cache-utils';
import type { ListarPendentesParams } from '@/backend/types/pendentes/types';
import type { ListarAudienciasParams } from '@/backend/types/audiencias/types';
import type { ListarAcervoParams } from '@/backend/types/acervo/types';

/**
 * Normalizes params by removing undefined values and sorting keys for consistency.
 */
function normalizeParams(params: any): any {
  if (!params || typeof params !== 'object') return params;
  const normalized: any = {};
  for (const key of Object.keys(params).sort()) {
    if (params[key] !== undefined) {
      normalized[key] = params[key];
    }
  }
  return normalized;
}

/**
 * Generates cache key for pendentes list based on ListarPendentesParams.
 */
export function getPendentesListKey(params: ListarPendentesParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.pendentes, normalized);
}

/**
 * Generates cache key for pendentes group based on ListarPendentesParams.
 */
export function getPendentesGroupKey(params: ListarPendentesParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(`${CACHE_PREFIXES.pendentes}:group`, normalized);
}

/**
 * Generates cache key for audiencias list based on ListarAudienciasParams.
 */
export function getAudienciasListKey(params: ListarAudienciasParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.audiencias, normalized);
}

/**
 * Generates cache key for acervo list based on ListarAcervoParams.
 */
export function getAcervoListKey(params: ListarAcervoParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.acervo, normalized);
}

/**
 * Generates cache key for acervo group based on ListarAcervoParams.
 */
export function getAcervoGroupKey(params: ListarAcervoParams): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(`${CACHE_PREFIXES.acervo}:group`, normalized);
}

/**
 * Generates cache key for usuarios list.
 */
export function getUsuariosListKey(params: any): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.usuarios, normalized);
}

/**
 * Generates cache key for clientes list.
 */
export function getClientesListKey(params: any): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.clientes, normalized);
}

/**
 * Generates cache key for contratos list.
 */
export function getContratosListKey(params: any): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.contratos, normalized);
}

/**
 * Generates cache key for tipos expedientes list.
 */
export function getTiposExpedientesListKey(params: any): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.tiposExpedientes, normalized);
}

/**
 * Generates cache key for cargos list.
 */
export function getCargosListKey(params: any): string {
  const normalized = normalizeParams(params);
  return generateCacheKey(CACHE_PREFIXES.cargos, normalized);
}