/**
 * Arquivo: timeline/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Timeline.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterTimeline } from './obter-timeline';
export { obterDocumento } from './obter-documento';
export { baixarDocumento } from './baixar-documento';
export type { TimelineResponse, ObterTimelineOptions, DocumentoDetalhes, ObterDocumentoOptions, BaixarDocumentoOptions } from '@/backend/types/pje-trt/timeline';
