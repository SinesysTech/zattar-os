/**
 * API Route: Refresh Materialized View de Chat
 *
 * Atualiza a materialized view mensagens_chat_com_usuario a cada 5 minutos.
 * Reduz necessidade de queries com join em tempo real.
 *
 * Autenticação: Requer CRON_SECRET via header Authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 1 minuto

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autenticação
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Chat View] Iniciando refresh da materialized view...");

    const supabase = await createClient();
    
    // Executar função de refresh
    const { error } = await supabase.rpc('refresh_mensagens_chat_com_usuario');

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Chat View] Refresh concluído em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Materialized view atualizada com sucesso",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Chat View] Erro ao atualizar view:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar materialized view",
        message: error instanceof Error ? error.message : "Erro desconhecido",
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
