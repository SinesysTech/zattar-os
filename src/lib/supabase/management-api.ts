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

const CACHE_TTL_SECONDS = 300; // 5 minutos

type DiskIoCountersSample = {
  ts: number;
  readsCompleted: number;
  writesCompleted: number;
  readBytes: number;
  writtenBytes: number;
};

let lastInMemoryDiskIoSample: DiskIoCountersSample | null = null;

function getMetricsApiConfig(): {
  projectUrl: string | null;
  serviceRoleKey: string | null;
} {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  return { projectUrl, serviceRoleKey };
}

export function isDiskIOMetricsConfigured(): boolean {
  const { projectUrl, serviceRoleKey } = getMetricsApiConfig();
  return Boolean(projectUrl && serviceRoleKey);
}

function buildBasicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function parsePrometheusLabels(raw: string): Record<string, string> {
  // Format: key="value",key2="value2" (value may contain escaped chars)
  const labels: Record<string, string> = {};
  const parts = raw.trim();
  if (!parts) return labels;

  // Split on commas not inside quotes
  const pairs: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < parts.length; i += 1) {
    const ch = parts[i];
    if (ch === '"' && parts[i - 1] !== "\\") inQuotes = !inQuotes;
    if (ch === "," && !inQuotes) {
      pairs.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) pairs.push(current);

  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const key = pair.slice(0, idx).trim();
    let value = pair.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    value = value
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\")
      .replace(/\\\"/g, '"');
    labels[key] = value;
  }

  return labels;
}

type PromSample = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

function parsePrometheusText(text: string): PromSample[] {
  const lines = text.split(/\r?\n/);
  const samples: PromSample[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // name{labels} value [timestamp]
    const match = trimmed.match(
      /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+([-+]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][-+]?\d+)?)(?:\s+\d+)?$/
    );
    if (!match) continue;

    const name = match[1];
    const labelsRaw = match[3] ?? "";
    const value = Number(match[4]);
    if (!Number.isFinite(value)) continue;

    samples.push({
      name,
      labels: labelsRaw ? parsePrometheusLabels(labelsRaw) : {},
      value,
    });
  }

  return samples;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function extractDiskIoCounters(samples: PromSample[]): DiskIoCountersSample {
  // Sum across devices. We keep it simple and rely on rate calculation later.
  const sumByMetric = (metricName: string): number =>
    samples
      .filter((s) => s.name === metricName)
      .reduce((acc, s) => acc + s.value, 0);

  return {
    ts: Date.now(),
    readsCompleted: sumByMetric("node_disk_reads_completed_total"),
    writesCompleted: sumByMetric("node_disk_writes_completed_total"),
    readBytes: sumByMetric("node_disk_read_bytes_total"),
    writtenBytes: sumByMetric("node_disk_written_bytes_total"),
  };
}

async function getPreviousDiskIoSample(cacheKey: string): Promise<DiskIoCountersSample | null> {
  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get(cacheKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DiskIoCountersSample;
    } catch {
      return null;
    }
  }
  return lastInMemoryDiskIoSample;
}

async function setPreviousDiskIoSample(cacheKey: string, sample: DiskIoCountersSample): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    // Mantém por 15 min para cálculo de taxa mesmo com baixa frequência
    await redis.setex(cacheKey, 900, JSON.stringify(sample));
    return;
  }
  lastInMemoryDiskIoSample = sample;
}

function computePerSecondRate(current: number, previous: number, dtSeconds: number): number {
  if (dtSeconds <= 0) return 0;
  const diff = current - previous;
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return diff / dtSeconds;
}

function normalizeTierName(tier: string): string {
  return tier.trim().toLowerCase();
}

function getManagementApiConfig(): {
  projectRef: string | null;
  accessToken: string | null;
} {
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || null;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim() || null;
  return { projectRef, accessToken };
}

export function isManagementApiConfigured(): boolean {
  const { projectRef, accessToken } = getManagementApiConfig();
  return Boolean(projectRef && accessToken);
}

/**
 * Obter métricas de Disk IO Budget via Management API
 * 
 * Graceful degradation: retorna null se API indisponível ou não configurada
 */
export async function obterMetricasDiskIO(): Promise<DiskIOMetrics | null> {
  const { projectUrl, serviceRoleKey } = getMetricsApiConfig();
  const { projectRef } = getManagementApiConfig();

  if (!projectUrl || !serviceRoleKey) {
    console.warn(
      "[Metrics API] Variáveis não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)"
    );
    return null;
  }

  try {
    // Tentar obter do cache Redis
    const redis = getRedisClient();
    const cacheNamespace = projectRef ?? projectUrl;
    const cacheKey = `supabase:metrics:disk_io:${cacheNamespace}`;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as DiskIOMetrics;
      }
    }

    // Buscar da Metrics API (Prometheus text)
    const url = `${projectUrl.replace(/\/$/, "")}/customer/v1/privileged/metrics`;
    const response = await fetch(url, {
      headers: {
        Authorization: buildBasicAuthHeader("service_role", serviceRoleKey),
      },
      // evita cache intermediário
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[Metrics API] Erro ${response.status}: ${response.statusText}`);
      return null;
    }

    const prometheusText = await response.text();
    const samples = parsePrometheusText(prometheusText);

    const currentCounters = extractDiskIoCounters(samples);
    const countersCacheKey = `supabase:metrics:disk_io_counters:${cacheNamespace}`;
    const previousCounters = await getPreviousDiskIoSample(countersCacheKey);

    await setPreviousDiskIoSample(countersCacheKey, currentCounters);

    if (!previousCounters) {
      // Precisamos de pelo menos 2 amostras para estimar taxa.
      return null;
    }

    const dtSeconds = (currentCounters.ts - previousCounters.ts) / 1000;

    // A Metrics API expõe counters; precisamos de um intervalo mínimo para estimar taxa.
    if (dtSeconds < 10) {
      return null;
    }
    const readIops = computePerSecondRate(
      currentCounters.readsCompleted,
      previousCounters.readsCompleted,
      dtSeconds
    );
    const writeIops = computePerSecondRate(
      currentCounters.writesCompleted,
      previousCounters.writesCompleted,
      dtSeconds
    );
    const readBytesPerSec = computePerSecondRate(
      currentCounters.readBytes,
      previousCounters.readBytes,
      dtSeconds
    );
    const writtenBytesPerSec = computePerSecondRate(
      currentCounters.writtenBytes,
      previousCounters.writtenBytes,
      dtSeconds
    );

    // Conversões
    const consumptionIops = readIops + writeIops;
    const consumptionMbPerSec = (readBytesPerSec + writtenBytesPerSec) / (1024 * 1024);

    // Compute tier (best-effort). Se Management API estiver configurada, usamos.
    const computeAtual = await obterComputeAtual();
    const computeTierName = computeAtual?.name ?? "unknown";
    const tiers = await listarComputeTiers();
    const tier = tiers.find((t) => normalizeTierName(t.name) === normalizeTierName(computeTierName));

    const diskIopsLimit = tier?.iops ?? 0;
    const diskIoLimitMbps = tier?.throughput_mbps ?? 0;

    const iopsPercent = diskIopsLimit > 0 ? (consumptionIops / diskIopsLimit) * 100 : 0;
    const throughputPercent = diskIoLimitMbps > 0 ? (consumptionMbPerSec / diskIoLimitMbps) * 100 : 0;
    const budgetPercent = clampPercent(Math.max(iopsPercent, throughputPercent));

    const metrics: DiskIOMetrics = {
      disk_io_budget_percent: budgetPercent,
      disk_io_consumption_mbps: consumptionMbPerSec,
      disk_io_limit_mbps: diskIoLimitMbps,
      disk_iops_consumption: consumptionIops,
      disk_iops_limit: diskIopsLimit,
      compute_tier: computeTierName,
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
  const { projectRef, accessToken } = getManagementApiConfig();

  if (!projectRef || !accessToken) {
    return null;
  }

  try {
    const url = `https://api.supabase.com/v1/projects/${projectRef}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
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
