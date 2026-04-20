/**
 * Comunica CNJ — Barrel de Server Actions
 *
 * Expõe duas famílias de actions:
 * - Actions com `requireAuth` custom (comunica-cnj-actions.ts) — legacy
 * - Actions com `authenticatedAction` via safe-action (safe-actions.ts) — recomendadas
 */

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
} from './comunica-cnj-actions';

export {
  actionConsultarComunicacoesSafe,
  actionListarTribunaisSafe,
  actionObterStatusRateLimitSafe,
  actionDispararSincronizacaoManualSafe,
  actionVincularExpedienteSafe,
  actionObterMetricasSafe,
  actionListarSyncLogsSafe,
  actionSalvarViewSafe,
  actionListarViewsSafe,
  actionDeletarViewSafe,
  actionObterResumoSafe,
  type ActionResult,
} from './safe-actions';

export { requireAuth } from './utils';
