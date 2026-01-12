/**
 * API Route: Alertas de Disk IO Budget
 *
 * Verifica métricas de Disk IO Budget via RPC (placeholder)
 * e cria notificações para super_admins quando o budget estiver crítico (>90%).
 *
 * Autenticação: Requer CRON_SECRET via header Authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { requireCronAuth } from "@/lib/cron/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type DiskIOMetricsRow = {
  disk_io_budget_percent: number | null;
  disk_io_consumption_mbps: number | null;
  disk_io_limit_mbps: number | null;
  disk_iops_consumption: number | null;
  disk_iops_limit: number | null;
  compute_tier: string | null;
};

async function criarNotificacaoAdmin(
  supabase: ReturnType<typeof createServiceClient>,
  titulo: string,
  descricao: string,
  dados_adicionais: Record<string, unknown>
): Promise<void> {
  const { data: admins, error: adminError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("is_super_admin", true);

  if (adminError) {
    throw new Error(`Erro ao listar super_admins: ${adminError.message}`);
  }

  const usuarioIds = (admins || []).map((a) => a.id).filter(Boolean);
  if (usuarioIds.length === 0) return;

  const rows = usuarioIds.map((usuario_id) => ({
    usuario_id,
    tipo: "disk_io_alert",
    titulo,
    descricao,
    entidade_tipo: "processo",
    entidade_id: 1,
    dados_adicionais,
  }));

  const { error } = await supabase.from("notificacoes").insert(rows);
  if (error) {
    throw new Error(`Erro ao criar notificações: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authError = requireCronAuth(request, { logPrefix: "[Cron Disk IO]" });
    if (authError) return authError;

    const supabase = createServiceClient();

    const { data: diskIOData, error } = await supabase.rpc("obter_metricas_disk_io");
    if (error) {
      throw new Error(`Erro ao obter métricas de Disk IO: ${error.message}`);
    }

    const row = (diskIOData as DiskIOMetricsRow[] | null)?.[0];
    const diskIOBudget = Number(row?.disk_io_budget_percent ?? 0);

    if (diskIOBudget > 90) {
      await criarNotificacaoAdmin(
        supabase,
        "Disk IO Budget Crítico",
        `Disk IO Budget está em ${diskIOBudget.toFixed(0)}% (crítico >90%)`,
        { tipo: "disk_io_alert", metrica: "disk_io_budget", valor: diskIOBudget }
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Verificação de Disk IO concluída",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      disk_io_budget_percent: diskIOBudget,
      alerta_enviado: diskIOBudget > 90,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Disk IO] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
