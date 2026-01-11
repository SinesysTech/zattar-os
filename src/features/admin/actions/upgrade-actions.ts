'use server';

import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { avaliarNecessidadeUpgrade } from "../services/upgrade-advisor";
import { obterMetricasDiskIO, obterComputeAtual } from "@/lib/supabase/management-api";
import { buscarCacheHitRate } from "../repositories/metricas-db-repository";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UpgradeRecommendation {
  should_upgrade: boolean;
  recommended_tier: 'small' | 'medium' | 'large' | null;
  reasons: string[];
  estimated_cost_increase: number;
  estimated_downtime_minutes: number;
}

/**
 * Avaliar necessidade de upgrade de compute
 */
export async function actionAvaliarUpgrade(): Promise<ActionResult<UpgradeRecommendation>> {
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

    // Buscar métricas atuais
    const [cacheHitRateData, diskIOData, computeData] = await Promise.all([
      buscarCacheHitRate(),
      obterMetricasDiskIO(),
      obterComputeAtual(),
    ]);

    // Calcular cache hit rate médio
    const cacheHitRate = cacheHitRateData.length > 0
      ? cacheHitRateData.reduce((acc, curr) => acc + curr.ratio, 0) / cacheHitRateData.length
      : 0;

    const diskIOBudgetPercent = diskIOData?.disk_io_budget_percent ?? 0;
    const computeAtual = computeData?.name ?? diskIOData?.compute_tier ?? "unknown";

    // Avaliar necessidade de upgrade
    const recommendation = avaliarNecessidadeUpgrade(
      cacheHitRate,
      diskIOBudgetPercent,
      computeAtual
    );

    return { success: true, data: recommendation };
  } catch (error) {
    console.error("[Upgrade] Erro ao avaliar upgrade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface MetricasDecisao {
  cache_hit_rate_antes: number;
  cache_hit_rate_depois: number;
  disk_io_antes: number;
  disk_io_depois: number;
  queries_lentas_antes: number;
  queries_lentas_depois: number;
}

/**
 * Documentar decisão de upgrade em DISK_IO_OPTIMIZATION.md
 */
export async function actionDocumentarDecisao(
  decisao: 'manter' | 'upgrade_small' | 'upgrade_medium' | 'upgrade_large',
  metricas: MetricasDecisao,
  justificativa: string
): Promise<ActionResult<void>> {
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

    // Ler arquivo atual
    const filePath = join(process.cwd(), "DISK_IO_OPTIMIZATION.md");
    let content = await readFile(filePath, "utf-8");

    // Atualizar seção "Métricas Pós-Otimização"
    const melhoriaCache = metricas.cache_hit_rate_depois - metricas.cache_hit_rate_antes;
    const melhoriaDisk = metricas.disk_io_antes - metricas.disk_io_depois;
    const melhoriaQueries =
      metricas.queries_lentas_antes > 0
        ? `${((1 - metricas.queries_lentas_depois / metricas.queries_lentas_antes) * 100).toFixed(0)}%`
        : "N/D";

    const metricasPosSection = `## 📈 Métricas Pós-Otimização

> **Instruções**: Preencher valores via dashboard \`/app/admin/metricas-db\` ou página de avaliação \`/app/admin/metricas-db/avaliar-upgrade\`

### Cache Hit Rate
- **Antes**: ${metricas.cache_hit_rate_antes.toFixed(2)}%
- **Depois**: ${metricas.cache_hit_rate_depois.toFixed(2)}%
- **Melhoria**: ${melhoriaCache.toFixed(2)}%

### Disk IO Budget
- **Antes**: ${metricas.disk_io_antes.toFixed(0)}% consumido
- **Depois**: ${metricas.disk_io_depois.toFixed(0)}% consumido
- **Melhoria**: ${melhoriaDisk.toFixed(0)}%

### Queries Lentas (>1s)
- **Antes**: ${metricas.queries_lentas_antes} queries
- **Depois**: ${metricas.queries_lentas_depois} queries
- **Melhoria**: ${melhoriaQueries}
`;

    content = content.replace(
      /## 📈 Métricas Pós-Otimização[\s\S]*?(?=\n---\n)/,
      metricasPosSection
    );

    // Atualizar seção "Decisão de Upgrade de Compute"
    const decisaoMap = {
      manter: "Manter compute atual",
      upgrade_small: "Upgrade para Small",
      upgrade_medium: "Upgrade para Medium",
      upgrade_large: "Upgrade para Large",
    };

    const decisaoSection = `## 🔄 Decisão de Upgrade de Compute

  ### Recomendação Final
  - **Decisão**: ${decisaoMap[decisao]}
  - **Data da avaliação**: ${new Date().toLocaleDateString("pt-BR")}

  ### Justificativa
  ${justificativa}

  ### Métricas Registradas
  - Cache hit rate (depois): ${metricas.cache_hit_rate_depois.toFixed(2)}%
  - Disk IO Budget (depois): ${metricas.disk_io_depois.toFixed(0)}%
  - Queries lentas (depois): ${metricas.queries_lentas_depois}
  `;

    content = content.replace(
      /## 🔄 Decisão de Upgrade de Compute[\s\S]*?(?=\n---\n)/,
      decisaoSection
    );

    // Adicionar ao histórico
    const hoje = new Date().toLocaleDateString("pt-BR");
    const historicoEntry = `| ${hoje} | Decisão | ${decisaoMap[decisao]} | ${metricas.disk_io_depois.toFixed(0)}% Disk IO |`;

    if (content.includes("## 📝 Histórico de Mudanças")) {
      content = content.replace(
        /(## 📝 Histórico de Mudanças[\s\S]*?\n\|------\|------\|-----------\|---------\|\n)/,
        `$1${historicoEntry}\n`
      );
    }

    // Escrever arquivo atualizado
    await writeFile(filePath, content, "utf-8");

    return { success: true };
  } catch (error) {
    console.error("[Upgrade] Erro ao documentar decisão:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
