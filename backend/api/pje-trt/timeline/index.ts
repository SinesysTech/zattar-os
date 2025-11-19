/**
 * Arquivo: timeline/index.ts
 * 
 * PROPÓSITO:
 * Re-exporta todas as funções do domínio Timeline.
 * Facilita imports externos mantendo a organização interna.
 */

export { obterTimeline } from './obter-timeline';
export type { TimelineResponse, ObterTimelineOptions } from './obter-timeline';
