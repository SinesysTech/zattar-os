/**
 * Arquivo: pericias/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Perícias
 */

export { obterPericias } from './obter-pericias';

// Re-exportar tipos para facilitar imports
export type { Pericia, SituacaoPericia, PermissoesPericia } from '../../types';

