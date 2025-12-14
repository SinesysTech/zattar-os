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
// NOTE:
// `comunica-cnj/*` and `actions/*` are server-only (depend on Node APIs / server actions).
// They must not be exported from this client-safe barrel.
// Import them from `@/features/captura/server` (server-side) or via direct paths if needed.
