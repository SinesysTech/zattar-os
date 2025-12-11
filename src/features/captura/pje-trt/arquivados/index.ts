/**
 * Arquivo: arquivados/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Arquivados.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterProcessosArquivados } from './obter-processos';
export { obterTodosProcessosArquivados } from './obter-todos-processos';

// Re-exportar tipos para facilitar imports
export { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
export type { Processo } from '@/backend/types/pje-trt/types';
