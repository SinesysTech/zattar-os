/**
 * API Route: Indexar Documentos em Background
 *
 * Executa indexação de documentos pendentes de forma assíncrona.
 * Deve ser chamada periodicamente via cron job externo.
 *
 * Autenticação: Requer CRON_SECRET via header Authorization
 *
 * Exemplo:
 * curl -X POST https://seu-dominio.com/api/cron/indexar-documentos \
 *   -H "Authorization: Bearer SEU_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { indexarDocumento } from "@/lib/ai/indexing";
import type { DocumentoMetadata } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos

interface DocumentoPendente {
  id: number;
  tipo: "processo" | "audiencia" | "documento" | "contrato" | "outro";
  entity_id: number;
  texto: string;
  metadata: unknown; // jsonb from database, will be typed at call-site
  created_at: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (process.env.ENABLE_AI_INDEXING === "false") {
      console.log("[Cron Indexação] Indexação desabilitada via ENABLE_AI_INDEXING");
      return NextResponse.json({
        success: true,
        message: "Indexação desabilitada",
        processados: 0,
      });
    }

    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!expectedToken) {
      console.warn("[Cron Indexação] CRON_SECRET não configurado");
      return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[Cron Indexação] Tentativa de acesso não autorizado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Indexação] Iniciando processamento...");

    const supabase = createServiceClient();

    const { data: pendentes, error } = await supabase
      .from("documentos_pendentes_indexacao")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[Cron Indexação] Erro ao buscar pendentes:", error);
      throw error;
    }

    if (!pendentes || pendentes.length === 0) {
      console.log("[Cron Indexação] Nenhum documento pendente");
      return NextResponse.json({
        success: true,
        message: "Nenhum documento pendente",
        processados: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Cron Indexação] ${pendentes.length} documentos pendentes`);

    let processados = 0;
    let erros = 0;

    const CONCURRENCY_LIMIT = 10;
    for (let i = 0; i < pendentes.length; i += CONCURRENCY_LIMIT) {
      const batch = pendentes.slice(i, i + CONCURRENCY_LIMIT);

      await Promise.allSettled(
        batch.map(async (doc: DocumentoPendente) => {
          try {
            // Cast DB jsonb to DocumentoMetadata interface
            const metadata = doc.metadata as any as DocumentoMetadata;
            await indexarDocumento({
              texto: doc.texto,
              metadata,
            });

            await supabase
              .from("documentos_pendentes_indexacao")
              .delete()
              .eq("id", doc.id);

            processados++;
            console.log(`[Cron Indexação] Documento ${doc.id} indexado`);
          } catch (error) {
            erros++;
            console.error(`[Cron Indexação] Erro ao indexar ${doc.id}:`, error);

            await supabase
              .from("documentos_pendentes_indexacao")
              .update({
                // @ts-ignore - raw helper
                tentativas: (supabase as any).raw("tentativas + 1"),
                ultimo_erro: error instanceof Error ? error.message : "Erro desconhecido",
              })
              .eq("id", doc.id);
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Indexação] Concluído: ${processados} processados, ${erros} erros em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Indexação concluída",
      processados,
      erros,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Indexação] Erro:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar indexação",
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
