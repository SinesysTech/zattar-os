/**
 * COMUNICA CNJ — Barrel Export (API Pública FSD)
 *
 * Módulo autocontido (Diário Oficial) dividido em 2 páginas:
 *  - `/comunica-cnj`            → Pesquisa (PesquisaClient)
 *  - `/comunica-cnj/capturadas` → Gestão (CapturadasClient)
 *
 * ⚠️ SERVER-ONLY: domain, service, repository, cnj-client são server-only.
 * Client Components devem importar apenas de `./components` ou actions via `./actions`.
 */

// =============================================================================
// Clients (pages)
// =============================================================================
export { PesquisaClient } from './pesquisa-client';
export { CapturadasClient } from './capturadas-client';

// =============================================================================
// Components + hooks
// =============================================================================
export * from './components';

// =============================================================================
// Actions (Server Actions)
// =============================================================================
export {
  actionConsultarComunicacoes,
  actionListarComunicacoesCapturadas,
  actionSincronizarComunicacoes,
  actionObterCertidao,
  actionVincularExpediente,
  actionListarTribunaisDisponiveis,
  actionObterMetricas,
  actionListarViews,
  actionListarSyncLogs,
  actionDispararSincronizacaoManualSafe,
  actionVincularExpedienteSafe,
  actionObterMetricasSafe,
  actionListarViewsSafe,
  actionSalvarViewSafe,
  actionDeletarViewSafe,
  actionListarSyncLogsSafe,
  actionObterResumoSafe,
  actionObterStatusRateLimitSafe,
  actionListarTribunaisSafe,
  actionConsultarComunicacoesSafe,
} from './actions';

// =============================================================================
// Types / Domain
// =============================================================================
export type {
  MeioComunicacao,
  GrauTribunal,
  StatusComunicacao,
  StatusVinculacao,
  ComunicacaoCNJ,
  ComunicacaoCNJEnriquecida,
  ComunicacaoItem,
  ComunicacaoItemRaw,
  ComunicacaoDestinatario,
  ComunicacaoDestinatarioAdvogado,
  ComunicacaoAPIParams,
  ComunicacaoAPIResponse,
  ComunicacaoAPIResponseRaw,
  ComunicacaoPaginationMetadata,
  ComunicacaoProcessual,
  ComunicacaoResumo,
  ConsultarComunicacoesParams,
  ConsultaResult,
  SincronizarParams,
  SincronizacaoResult,
  SincronizacaoStats,
  ListarComunicacoesParams,
  MatchParams,
  MatchSugestao,
  MatchCriterio,
  BatchResult,
  InserirComunicacaoParams,
  CadernoMetadata,
  CadernoMetadataAPI,
  RateLimitStatus,
  TribunalInfo,
  TribunalInstituicao,
  TribunalUFResponse,
  PartesExtraidas,
  CriarExpedienteFromCNJParams,
  GazetteMetrics,
  GazetteView,
  GazetteFilters,
  GazetteInsight,
  SyncLogEntry,
  SparklinePoint,
  SalvarViewInput,
  ComunicaCNJClientConfig,
} from './domain';

export {
  MEIO_COMUNICACAO_LABELS,
  GRAU_TRIBUNAL_LABELS,
  consultarComunicacoesSchema,
  sincronizarComunicacoesSchema,
  vincularExpedienteSchema,
  listarComunicacoesCapturadasSchema,
  salvarViewSchema,
  buscarMatchSchema,
  aceitarMatchBatchSchema,
} from './domain';
