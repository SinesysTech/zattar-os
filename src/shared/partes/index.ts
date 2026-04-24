/**
 * Partes Shared Module — Barrel
 *
 * Reexporta domain (tipos + schemas + helpers como `normalizarDocumento`),
 * tipos auxiliares, errors e utils. NÃO reexporta `service`/`repository`
 * porque esses são server-only — importe via `@/shared/partes/server`.
 */

export * from './domain';
export * from './types';
export * from './errors';
export * from './utils';
