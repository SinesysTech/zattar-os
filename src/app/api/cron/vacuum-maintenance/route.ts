/**
 * API Route: Monitoramento de Bloat e VACUUM
 *
 * Executa diagnóstico de bloat em tabelas críticas e loga resultados.
 * Envia alerta se bloat >50% em qualquer tabela.
 *
 * NÃO executa VACUUM automaticamente (requer execução manual via SQL Editor).
 *
 * Autenticação: Requer CRON_SECRET via header Authorization
 *
 * Exemplo de chamada:
 * curl -X POST https://seu-dominio.com/api/cron/vacuum-maintenance \
 *   -H "Authorization: Bearer SEU_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 1 minuto

interface BloatDiagnostic {
  tabela: string;
  tamanho_total: string;
  dead_tuples: number;
  live_tuples: number;
  bloat_percent: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  requer_vacuum: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autenticação
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      console.warn("[Cron VACUUM] CRON_SECRET não configurado");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[Cron VACUUM] Tentativa de acesso não autorizado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron VACUUM] Iniciando diagnóstico de bloat...");

    const supabase = await createClient();

    // Executar função de diagnóstico
    const { data, error } = await supabase.rpc("diagnosticar_bloat_tabelas");

    if (error) {
      throw error;
    }

    const diagnostics = data as BloatDiagnostic[];

    // Filtrar tabelas que requerem atenção
    const tabelasComBloat = diagnostics.filter((d) => d.requer_vacuum);
    const tabelasCriticas = diagnostics.filter((d) => d.bloat_percent > 50);

    // Log estruturado
    console.log("[Cron VACUUM] Diagnóstico concluído:");
    console.log(`  - Total de tabelas analisadas: ${diagnostics.length}`);
    console.log(`  - Tabelas com bloat >20%: ${tabelasComBloat.length}`);
    console.log(`  - Tabelas com bloat >50% (CRÍTICO): ${tabelasCriticas.length}`);

    if (tabelasCriticas.length > 0) {
      console.warn("[Cron VACUUM] ⚠️ ALERTA: Tabelas críticas detectadas:");
      tabelasCriticas.forEach((t) => {
        console.warn(
          `  - ${t.tabela}: ${t.bloat_percent}% bloat (${t.dead_tuples} dead tuples)`
        );
      });
      console.warn(
        "[Cron VACUUM] Ação recomendada: Executar VACUUM FULL em horário de baixo tráfego"
      );
    }

    if (tabelasComBloat.length > 0 && tabelasCriticas.length === 0) {
      console.log("[Cron VACUUM] ℹ️ Tabelas com bloat moderado (20-50%):");
      tabelasComBloat.forEach((t) => {
        console.log(
          `  - ${t.tabela}: ${t.bloat_percent}% bloat (${t.dead_tuples} dead tuples)`
        );
      });
      console.log(
        "[Cron VACUUM] Ação recomendada: Executar VACUUM ANALYZE via SQL Editor"
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Diagnóstico de bloat concluído",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      summary: {
        total_tabelas: diagnostics.length,
        tabelas_com_bloat: tabelasComBloat.length,
        tabelas_criticas: tabelasCriticas.length,
      },
      diagnostics: diagnostics,
      alertas:
        tabelasCriticas.length > 0
          ? tabelasCriticas.map((t) => ({
              tabela: t.tabela,
              bloat_percent: t.bloat_percent,
              acao: "VACUUM FULL recomendado",
            }))
          : [],
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron VACUUM] Erro ao executar diagnóstico:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao executar diagnóstico de bloat",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Permitir GET para health checks
export async function GET(request: NextRequest) {
  return POST(request);
}
