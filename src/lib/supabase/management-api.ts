/**
 * Cliente da Supabase Management API
 * 
 * Fornece acesso a métricas de infraestrutura como Disk IO Budget
 * e informações sobre compute tiers disponíveis.
 * 
 * @see https://supabase.com/docs/reference/api/introduction
 */

import { getRedisClient } from "@/lib/redis/client";

interface DiskIOMetrics {
  disk_io_budget_percent: number;
  disk_io_consumption_mbps: number;
  disk_io_limit_mbps: number;
  disk_iops_consumption: number;
  disk_iops_limit: number;
  compute_tier: string;
}

interface ComputeTier {
  name: string;
  ram_gb: number;
  iops: number;
  throughput_mbps: number;
  monthly_cost_usd: number;
}

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const CACHE_TTL_SECONDS = 300; // 5 minutos

/**
 * Obter métricas de Disk IO Budget via Management API
 * 
 * Graceful degradation: retorna null se API indisponível ou não configurada
 */
export async function obterMetricasDiskIO(): Promise<DiskIOMetrics | null> {
  if (!SUPABASE_PROJECT_REF || !SUPABASE_ACCESS_TOKEN) {
    console.warn("[Management API] Variáveis não configuradas (SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN)");
    return null;
  }

  try {
    // Tentar obter do cache Redis
    const redis = getRedisClient();
    const cacheKey = `supabase:metrics:disk_io:${SUPABASE_PROJECT_REF}`;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as DiskIOMetrics;
      }
    }

    // Buscar da API
    const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/metrics`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Management API] Erro ${response.status}: ${response.statusText}`);
      return null;
    }

    const data: Record<string, unknown> = await response.json();
    
    // Extrair métricas relevantes (adaptar conforme estrutura real da API)
    const metrics: DiskIOMetrics = {
      disk_io_budget_percent: Number(data.disk_io_budget_percent ?? 0),
      disk_io_consumption_mbps: Number(data.disk_io_consumption_mbps ?? 0),
      disk_io_limit_mbps: Number(data.disk_io_limit_mbps ?? 0),
      disk_iops_consumption: Number(data.disk_iops_consumption ?? 0),
      disk_iops_limit: Number(data.disk_iops_limit ?? 0),
      compute_tier: String(data.compute_tier ?? "unknown"),
    };

    // Armazenar no cache
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(metrics));
    }

    return metrics;
  } catch (error) {
    console.error("[Management API] Erro ao obter métricas de Disk IO:", error);
    return null;
  }
}

/**
 * Obter informações do compute tier atual
 */
export async function obterComputeAtual(): Promise<ComputeTier | null> {
  if (!SUPABASE_PROJECT_REF || !SUPABASE_ACCESS_TOKEN) {
    return null;
  }

  try {
    const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Management API] Erro ${response.status}: ${response.statusText}`);
      return null;
    }

    const data: Record<string, unknown> = await response.json();
    
    // Adaptar conforme estrutura real da API
    return {
      name: String(data.tier ?? "unknown"),
      ram_gb: Number(data.ram_gb ?? 0),
      iops: Number(data.iops ?? 0),
      throughput_mbps: Number(data.throughput_mbps ?? 0),
      monthly_cost_usd: Number(data.monthly_cost_usd ?? 0),
    };
  } catch (error) {
    console.error("[Management API] Erro ao obter compute atual:", error);
    return null;
  }
}

/**
 * Listar compute tiers disponíveis
 * 
 * Valores baseados na documentação oficial do Supabase (2026)
 */
export async function listarComputeTiers(): Promise<ComputeTier[]> {
  return [
    {
      name: "Micro",
      ram_gb: 1,
      iops: 2085,
      throughput_mbps: 87,
      monthly_cost_usd: 0, // Free tier
    },
    {
      name: "Small",
      ram_gb: 2,
      iops: 2085,
      throughput_mbps: 87,
      monthly_cost_usd: 10,
    },
    {
      name: "Medium",
      ram_gb: 4,
      iops: 2085,
      throughput_mbps: 87,
      monthly_cost_usd: 50,
    },
    {
      name: "Large",
      ram_gb: 8,
      iops: 2085,
      throughput_mbps: 87,
      monthly_cost_usd: 100,
    },
    {
      name: "XL",
      ram_gb: 16,
      iops: 3000,
      throughput_mbps: 125,
      monthly_cost_usd: 200,
    },
    {
      name: "2XL",
      ram_gb: 32,
      iops: 3000,
      throughput_mbps: 125,
      monthly_cost_usd: 400,
    },
  ];
}
