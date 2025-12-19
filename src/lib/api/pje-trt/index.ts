/**
 * API do PJE-TRT
 * 
 * Serviços e tipos relacionados à integração com PJE/TRT.
 * Consolida funcionalidades de captura, timeline e tipos.
 */

// Exportar tipos de types.ts (sem duplicação)
export type {
  TimelineItem,
  ProcessoAudiencia,
  TipoAudiencia,
  PoloAudiencia,
  PautaAudienciaHorario,
  AudienciaPJE,
} from './types';
export { AgrupamentoProcessoTarefa } from './types';

// Exportar timeline
export * from './timeline';

// Exportar funções dos módulos (sem re-exportar tipos duplicados)
export {
  obterProcessosAcervoGeral,
  obterTodosProcessosAcervoGeral,
  obterTotalizadoresAcervoGeral,
} from './acervo-geral';
export {
  obterProcessosPendentesManifestacao,
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
} from './expedientes';
export {
  obterPautaAudiencias,
  obterTodasAudiencias,
} from './audiencias';
export {
  obterProcessosArquivados,
  obterTodosProcessosArquivados,
} from './arquivados';

// Exportar shared
export * from './shared/fetch';

