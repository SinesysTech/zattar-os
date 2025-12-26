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
} from "./capturas-log-types";

export type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
  ListarAgendamentosParams,
} from "./agendamentos-types";

export type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from "./documento-types";

export type { Processo, Audiencia, Totalizador, PagedResponse } from "./types";

export { AgrupamentoProcessoTarefa } from "./types";

// Tipos de API do domain.ts
export type {
  AcervoGeralResult,
  ArquivadosResult,
  AudienciasParams,
  BaseCapturaParams,
  CapturaApiResponse,
  CapturaPartesParams,
  CapturaPartesResult,
  CredenciaisApiResponse,
  ListarRecoveryLogsParams,
  ListarRecoveryLogsResponse,
  PendentesParams,
  PendentesResult,
  RecoveryAnaliseResponse,
  ReprocessarParams,
  ReprocessarResponse,
  StartCaptureData,
  TimelineParams,
  TimelineResult,
} from "../domain";

export type { Credencial } from "./credenciais";

export type {
  CodigoTRT,
  GrauTRT,
  TipoRotaTRT,
  TipoAcessoTribunal,
} from "./trt-types";
