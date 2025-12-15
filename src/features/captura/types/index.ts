/**
 * Barrel export para tipos da feature de captura
 */

export type {
  TipoCaptura,
  StatusCaptura,
  CapturaLog,
  ResultadoCapturaPartes,
  CriarCapturaLogParams,
  AtualizarCapturaLogParams,
  ListarCapturasLogParams,
  ListarCapturasLogResult,
} from './capturas-log-types';

export type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
  ListarAgendamentosParams,
} from './agendamentos-types';

export type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from './documento-types';

export type {
  Processo,
  Audiencia,
  Totalizador,
  PagedResponse,
} from './types';

export { AgrupamentoProcessoTarefa } from './types';

