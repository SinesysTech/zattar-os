/**
 * COMUNICA CNJ — Barrel Export (API Pública FSD)
 *
 * Módulo autocontido responsável por:
 * - Consulta da API pública do Comunica CNJ (Conselho Nacional de Justiça)
 * - Persistência e listagem de comunicações capturadas
 * - Sincronização manual + vinculação a expedientes
 * - Views salvas, métricas (Gazette Fusion) e resumos por IA
 *
 * **Nota arquitetural:**
 * Este módulo era um proxy para `captura/` até a migração em 2026-04-20.
 * A pasta `captura/agendamentos/` continua sendo responsável por
 * agendar execuções automáticas (inclusive de sincronização CNJ) — é
 * área genérica usada por todos os tipos de captura.
 *
 * ⚠️ SERVER-ONLY: domain, service, repository, cnj-client são server-only
 * (usam `server-only`, Supabase service client, axios). Client Components
 * devem importar apenas de `./components` ou das actions via `./actions`.
 */

// =============================================================================
// Components (client-safe)
// =============================================================================
export {
  ComunicaCNJTabsContent,
  ComunicaCNJResultsTable,
  GazettePage,
} from './components';

// =============================================================================
// Actions (Server Actions)
// =============================================================================
// Server actions com 'use server' são seguras em barrels acessíveis pelo client
// (Next.js faz a serialização no build).
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
