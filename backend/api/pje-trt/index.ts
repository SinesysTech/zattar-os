/**
 * Arquivo: index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as APIs do PJE-TRT de forma centralizada.
 * Permite imports diretos do módulo principal: import { obterTodosProcessosAcervoGeral } from '@/backend/api/pje-trt'
 */

// Acervo Geral
export {
  obterProcessosAcervoGeral,
  obterTodosProcessosAcervoGeral,
  obterTotalizadoresAcervoGeral,
} from './acervo-geral';

// Pendentes de Manifestação
export {
  obterProcessosPendentesManifestacao,
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
} from './pendentes-manifestacao';

// Audiências
export {
  obterPautaAudiencias,
  obterTodasAudiencias,
} from './audiencias';

// Arquivados
export {
  obterProcessosArquivados,
  obterTodosProcessosArquivados,
} from './arquivados';

// Timeline
export {
  obterTimeline,
} from './timeline';
export type { TimelineResponse, ObterTimelineOptions } from './timeline';

// Shared
export { fetchPJEAPI } from './shared/fetch';

// Re-exportar tipos compartilhados
export { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
export type { Processo, Audiencia, Totalizador, PagedResponse } from '@/backend/types/pje-trt/types';
