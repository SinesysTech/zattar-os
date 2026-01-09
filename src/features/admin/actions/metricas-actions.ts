'use server';

import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import {
  withCache,
  generateCacheKey,
  CACHE_PREFIXES,
} from "@/lib/redis/cache-utils";
import {
  buscarBloatTabelas,
  buscarCacheHitRate,
  buscarQueriesLentas,
  buscarTabelasSequentialScan,
  buscarIndicesNaoUtilizados,
  type BloatTabela,
  type CacheHitRate,
  type QueryLenta,
  type TabelaSequentialScan,
  type IndiceNaoUtilizado,
} from "../repositories/metricas-db-repository";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MetricasDB {
  cacheHitRate: CacheHitRate[];
  queriesLentas: QueryLenta[];
  tabelasSeqScan: TabelaSequentialScan[];
  bloat: BloatTabela[];
  indicesNaoUtilizados: IndiceNaoUtilizado[];
  timestamp: string;
}

export async function actionObterMetricasDB(): Promise<ActionResult<MetricasDB>> {
  try {
    const { user } = await requireAuth([]);

    const supabase = await createClient();
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!usuario?.is_super_admin) {
      return { success: false, error: "Acesso negado. Apenas administradores." };
    }

    const cacheKey = generateCacheKey(CACHE_PREFIXES.admin, { action: "metricas_db" });

    const data = await withCache(
      cacheKey,
      async () => {
        const [cacheHitRate, queriesLentas, tabelasSeqScan, bloat, indicesNaoUtilizados] =
          await Promise.all([
            buscarCacheHitRate(),
            buscarQueriesLentas(20),
            buscarTabelasSequentialScan(20),
            buscarBloatTabelas(),
            buscarIndicesNaoUtilizados(),
          ]);

        return {
          cacheHitRate,
          queriesLentas,
          tabelasSeqScan,
          bloat,
          indicesNaoUtilizados,
          timestamp: new Date().toISOString(),
        } satisfies MetricasDB;
      },
      60
    );

    return { success: true, data };
  } catch (error) {
    console.error("[Metrica DB] erro ao obter metricas", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
