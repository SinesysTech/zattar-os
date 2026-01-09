import { createClient } from "@/lib/supabase/server";

export interface CacheHitRate {
  name: string;
  ratio: number;
}

export interface QueryLenta {
  rolname: string;
  query: string;
  calls: number;
  total_time: number;
  max_time: number;
}

export interface TabelaSequentialScan {
  relname: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  avg_seq_tup: number;
  n_live_tup: number;
}

export interface BloatTabela {
  tabela: string;
  tamanho_total: string;
  dead_tuples: number;
  live_tuples: number;
  bloat_percent: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
}

export interface IndiceNaoUtilizado {
  relname: string;
  indexrelname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

export async function buscarCacheHitRate(): Promise<CacheHitRate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("obter_cache_hit_rate");

    if (error || !data) return [];
    return data as CacheHitRate[];
  } catch (error) {
    console.error("[MetricasDB] erro em buscarCacheHitRate", error);
    return [];
  }
}

export async function buscarQueriesLentas(limite: number = 20): Promise<QueryLenta[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("obter_queries_lentas", { p_limite: limite });

    if (error || !data) return [];
    return data as QueryLenta[];
  } catch (error) {
    console.error("[MetricasDB] erro em buscarQueriesLentas", error);
    return [];
  }
}

export async function buscarTabelasSequentialScan(limite: number = 20): Promise<TabelaSequentialScan[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("obter_tabelas_sequential_scan", { p_limite: limite });

    if (error || !data) return [];
    return data as TabelaSequentialScan[];
  } catch (error) {
    console.error("[MetricasDB] erro em buscarTabelasSequentialScan", error);
    return [];
  }
}

export async function buscarBloatTabelas(): Promise<BloatTabela[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("diagnosticar_bloat_tabelas");

    if (error || !data) return [];
    return data as BloatTabela[];
  } catch (error) {
    console.error("[MetricasDB] erro em buscarBloatTabelas", error);
    return [];
  }
}

export async function buscarIndicesNaoUtilizados(): Promise<IndiceNaoUtilizado[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("obter_indices_nao_utilizados");

    if (error || !data) return [];
    return data as IndiceNaoUtilizado[];
  } catch (error) {
    console.error("[MetricasDB] erro em buscarIndicesNaoUtilizados", error);
    return [];
  }
}
