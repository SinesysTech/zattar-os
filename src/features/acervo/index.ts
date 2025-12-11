/**
 * Acervo Feature - Barrel Exports
 * Public API for the acervo feature
 */

// Types
export type {
  Acervo,
  OrigemAcervo,
  GrauAcervo,
  ProcessoInstancia,
  ProcessoUnificado,
  AgrupamentoAcervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
  OrdenarPorAcervo,
  AgruparPorAcervo,
  OrdemAcervo,
  ProcessoClienteCpfRow,
  ClienteRespostaIA,
  ResumoProcessosIA,
  InstanciaProcessoIA,
  TimelineItemIA,
  UltimaMovimentacaoIA,
  TimelineStatus,
  ProcessoRespostaIA,
  ProcessosClienteCpfResponse,
} from './types';

// Domain
export {
  mapearStatusProcesso,
  converterParaAcervo,
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  CLASSE_JUDICIAL_NOMES,
} from './domain';

// Utils
export {
  formatarCpf,
  formatarData,
  formatarDataHora,
  traduzirTrt,
  traduzirTipoParte,
  traduzirClasseJudicial,
  formatarItemTimeline,
  formatarTimeline,
  extrairUltimaMovimentacao,
  agruparProcessosPorNumero,
  formatarInstancia,
  formatarProcessoParaIA,
  type ProcessoAgrupado,
  type FormatarProcessoOpcoes,
} from './utils';

// Actions
export {
  actionListarAcervo,
  actionBuscarProcesso,
  actionAtribuirResponsavel,
  actionBuscarProcessosClientePorCpf,
  actionExportarAcervoCSV,
  actionObterTimelinePorId,
} from './actions/acervo-actions';

// Service (Exported for API Routes usage mainly)
export {
  buscarProcessosClientePorCpf,
  obterAcervoPaginado,
  obterAcervoUnificado,
  obterAcervoAgrupado,
} from './service';

// Timeline Unificada
export {
  obterTimelineUnificada,
  obterTimelineUnificadaPorId,
  gerarHashDeduplicacao,
  deduplicarTimeline,
  type TimelineItemUnificado,
  type TimelineUnificada,
} from './timeline-unificada';

// Hooks
export {
  useAcervo,
  useProcesso,
  useAtribuirResponsavel,
  useProcessosClienteCpf,
  useAcervoFilters,
} from './hooks/use-acervo';

// Components
export { AcervoTable } from './components/list/acervo-table';
export { AcervoFilters } from './components/list/acervo-filters';
