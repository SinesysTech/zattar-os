import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function criarNotificacaoAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  titulo: string,
  descricao: string,
  dados: Record<string, unknown>
) {
  const { data: admins } = await supabase
    .from("usuarios")
    .select("id")
    .eq("is_super_admin", true);

  if (!admins || admins.length === 0) return;

  for (const admin of admins) {
    await supabase.rpc("criar_notificacao", {
      p_usuario_id: admin.id,
      p_tipo: "sistema",
      p_titulo: titulo,
      p_descricao: descricao,
      p_link: "/app/admin/metricas-db",
      p_dados_adicionais: dados,
    });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      console.warn("[Cron Disk IO] CRON_SECRET nao configurado");
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[Cron Disk IO] Tentativa de acesso nao autorizado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Disk IO] Verificando metricas...");

    const supabase = await createClient();

    const { data: cacheData } = await supabase.rpc("obter_cache_hit_rate");
    const { data: bloatData } = await supabase.rpc("diagnosticar_bloat_tabelas");

    const cacheHitRate = cacheData?.[0]?.ratio ?? 100;
    const tabelasCriticas = (bloatData as Array<{ tabela: string; bloat_percent: number }> | null)?.filter(
      (t) => t.bloat_percent > 50
    ) || [];

    if (cacheHitRate < 95) {
      await criarNotificacaoAdmin(
        supabase,
        "Cache Hit Rate Baixo",
        `Cache hit rate esta em ${cacheHitRate.toFixed(2)}% (esperado >99%)`,
        { tipo: "disk_io_alert", metrica: "cache_hit_rate", valor: cacheHitRate }
      );
    }

    if (tabelasCriticas.length > 0) {
      await criarNotificacaoAdmin(
        supabase,
        "Bloat Critico Detectado",
        `${tabelasCriticas.length} tabela(s) com bloat >50%`,
        { tipo: "disk_io_alert", metrica: "bloat", tabelas: tabelasCriticas }
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Verificacao de Disk IO concluida",
      duration_ms: duration,
      alertas: {
        cache_hit_rate_baixo: cacheHitRate < 95,
        bloat_critico: tabelasCriticas.length > 0,
      },
    });
  } catch (error) {
    console.error("[Cron Disk IO] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
