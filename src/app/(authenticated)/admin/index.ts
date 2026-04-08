/**
 * ADMIN MODULE — Barrel Export (API Pública)
 *
 * Módulo administrativo com sub-rotas (metricas-db, security, assistentes-tipos).
 * Observabilidade do banco de dados e gestão de infraestrutura.
 */

// =============================================================================
// Types / Domain
// =============================================================================

export type {
  CacheHitRate,
  QueryLenta,
  TabelaSequentialScan,
  BloatTabela,
  IndiceNaoUtilizado,
  MetricasDiskIO,
  DiskIOStatus,
  DiskIOResultWithTimestamp,
  MetricasDB,
} from './domain';

// =============================================================================
// Service
// =============================================================================

export { avaliarNecessidadeUpgrade } from './service';

// =============================================================================
// Actions
// =============================================================================

export {
  actionObterMetricasDB,
  actionAvaliarUpgrade,
  actionDocumentarDecisao,
} from './actions';
