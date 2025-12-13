// Domain (tipos e interfaces)
export type {
  Credencial,
  ConfigTribunal,
  ProcessoCapturado,
  MovimentacaoCapturada,
  ResultadoCaptura,
  TipoCaptura,
  PeriodoAudiencias,
  BuscarProcessosParams,
  SistemaJudicialSuportado,
} from "./domain";

export {
  mapearTipoAcessoParaGrau,
  mapearTipoCapturaParaOrigem,
} from "./domain";

// Types (tipos específicos de API/UI)
export type {
  CapturaLog,
  StatusCaptura,
  CredencialDisponivel,
  AcervoGeralResult,
  ArquivadosResult,
  AudienciasResult,
  PendentesResult,
  CapturaPartesResult,
  TimelineResult,
} from "./domain";

// PJE Documento Types
export type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from "./types/documento-types";

// TRT Types (exportados de types.ts que re-exporta de trt-types.ts)
export type { CodigoTRT, GrauTRT, FiltroPrazoPendentes } from "./domain";

// TRT Types diretos (incluindo ConfigTRT que não está em types.ts)
export type {
  TipoRotaTRT,
  TipoAcessoTribunal,
  BaseCapturaTRTParams,
  CredenciaisTRT,
  CustomTimeouts,
  TribunalConfigDb,
  ConfigTRT,
} from "./types/trt-types";

// Constants
export {
  TRT_CODIGOS,
  GRAUS,
  FILTROS_PRAZO,
  STATUS_AUDIENCIA_OPTIONS,
} from "./constants";

// API Client (para uso em componentes)
export * from "./services/api-client";

// Hooks
export { useCapturasLog } from "./hooks/use-capturas-log";

// Components (re-export principais)
export { CapturaList } from "./components/captura-list";
export { CapturaDialog } from "./components/captura-dialog";
export {
  CapturaResult,
  type CapturaResultData,
} from "./components/captura-result";

// Comunica CNJ
export * from "./comunica-cnj/domain";
export * from "./comunica-cnj/cnj-client";
export * from "./comunica-cnj/repository";
export * from "./comunica-cnj/service";

// Actions
export * from "./actions/comunica-cnj-actions";
export * from "./actions/timeline-actions";

// Comunica CNJ Components
export * from "./components/comunica-cnj";
