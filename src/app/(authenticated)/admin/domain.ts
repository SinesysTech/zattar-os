/**
 * Admin Module — Domain Types
 *
 * Tipos de domínio para métricas de banco de dados e recomendações de upgrade.
 */

// =============================================================================
// Re-exports from repository (DB metric types)
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
} from './repository';

// =============================================================================
// Re-exports from actions (composite types)
// =============================================================================

export type { MetricasDB } from './actions';
