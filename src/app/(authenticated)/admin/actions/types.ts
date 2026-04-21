/**
 * Admin Actions — Tipos compartilhados (sem "use server").
 */

import type {
  BloatTabela,
  CacheHitRate,
  QueryLenta,
  TabelaSequentialScan,
  IndiceNaoUtilizado,
  MetricasDiskIO,
  DiskIOStatus,
} from "../repositories/metricas-db-repository";

export interface MetricasDB {
  cacheHitRate: CacheHitRate[];
  queriesLentas: QueryLenta[];
  tabelasSeqScan: TabelaSequentialScan[];
  bloat: BloatTabela[];
  indicesNaoUtilizados: IndiceNaoUtilizado[];
  diskIO: MetricasDiskIO | null;
  diskIOStatus: DiskIOStatus;
  diskIOMessage?: string;
  timestamp: string;
}
