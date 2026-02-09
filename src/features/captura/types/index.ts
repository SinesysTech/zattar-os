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

export type {
  Pericia,
  SituacaoPericia,
  PermissoesPericia,
} from "./pericias-types";

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
  FiltroDocumentosTimeline,
  ListarRecoveryLogsParams,
  ListarRecoveryLogsResponse,
  PendentesParams,
  PendentesResult,
  PericiasParams,
  RecoveryAnaliseResponse,
  ReprocessarParams,
  ReprocessarResponse,
  StartCaptureData,
  TimelineParams,
  TimelineResult,
} from "../domain";

export type { Credencial } from "./credenciais";

export type {
  CapturaRawLog,
  CapturaRawLogCreate,
  StatusCapturaRaw,
} from "./captura-raw-log";

export type { Paginacao } from "./paginacao";

export type {
  CodigoTRT,
  GrauTRT,
  TipoRotaTRT,
  TipoAcessoTribunal,
  FiltroPrazoPendentes,
} from "./trt-types";

/**
 * Interface para expor métodos do formulário de captura ao componente pai
 * Usado com forwardRef + useImperativeHandle
 */
export interface CapturaFormHandle {
  /** Executa a ação de captura */
  submit: () => Promise<void>;
  /** Indica se está em processo de captura */
  isLoading: boolean;
}
