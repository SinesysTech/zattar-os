/**
 * Arquivo: audiencias/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Audiências.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterPautaAudiencias } from './obter-pauta';
export { obterTodasAudiencias } from './obter-todas';

// Re-exportar tipos para facilitar imports
export type { Audiencia } from '@/backend/types/pje-trt/types';
