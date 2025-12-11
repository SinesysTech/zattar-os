/**
 * Arquivo: acervo-geral/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Acervo Geral.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterProcessosAcervoGeral } from './obter-processos';
export { obterTodosProcessosAcervoGeral } from './obter-todos-processos';
export { obterTotalizadoresAcervoGeral } from './obter-totalizadores';

// Re-exportar tipos para facilitar imports
export { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
export type { Processo } from '@/backend/types/pje-trt/types';
