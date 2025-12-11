/**
 * Arquivo: pendentes-manifestacao/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Pendentes de Manifestação.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterProcessosPendentesManifestacao } from './obter-processos';
export { obterTodosProcessosPendentesManifestacao } from './obter-todos-processos';
export { obterTotalizadoresPendentesManifestacao } from './obter-totalizadores';

// Re-exportar tipos para facilitar imports
export { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
export type { Processo } from '@/backend/types/pje-trt/types';
