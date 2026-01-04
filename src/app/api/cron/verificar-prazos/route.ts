/**
 * API Route: Verificar Prazos de Expedientes
 * 
 * Esta rota executa a função de verificação de prazos vencendo/vencidos
 * e cria notificações para os responsáveis.
 * 
 * Deve ser chamada periodicamente via cron job (ex: Vercel Cron, GitHub Actions, etc.)
 * 
 * Autenticação: Requer secret token via header Authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via secret token
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      console.warn(
        "[Cron] CRON_SECRET não configurado. Configure a variável de ambiente."
      );
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Executar função de verificação de prazos
    // Usar service client para bypass RLS e executar função
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("verificar_e_notificar_prazos");

    if (error) {
      console.error("[Cron] Erro ao verificar prazos:", error);
      return NextResponse.json(
        {
          error: "Erro ao verificar prazos",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const resultado = Array.isArray(data) && data.length > 0 ? data[0] : data;

    return NextResponse.json({
      success: true,
      resultado: {
        notificacoes_criadas: resultado?.notificacoes_criadas || 0,
        prazos_vencendo: resultado?.prazos_vencendo || 0,
        prazos_vencidos: resultado?.prazos_vencidos || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Erro inesperado ao verificar prazos:", error);
    return NextResponse.json(
      {
        error: "Erro inesperado",
        message:
          error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Permitir GET para facilitar testes (mesma autenticação)
export async function GET(request: NextRequest) {
  return POST(request);
}

