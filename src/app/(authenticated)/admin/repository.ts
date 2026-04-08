/**
 * Admin Module — Repository (re-exports)
 *
 * Consolida queries de banco de dados do módulo admin.
 */

export {
    buscarCacheHitRate,
    buscarQueriesLentas,
    buscarTabelasSequentialScan,
    buscarBloatTabelas,
    buscarIndicesNaoUtilizados,
    buscarMetricasDiskIO,
} from './repositories/metricas-db-repository';

export type {
    CacheHitRate,
    QueryLenta,
    TabelaSequentialScan,
    BloatTabela,
    IndiceNaoUtilizado,
    MetricasDiskIO,
    DiskIOStatus,
    DiskIOResultWithTimestamp,
} from './repositories/metricas-db-repository';
