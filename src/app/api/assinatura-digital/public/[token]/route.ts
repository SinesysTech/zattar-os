import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
  TABLE_DOCUMENTO_ANCORAS,
} from "@/features/assinatura-digital/services/constants";

/**
 * Endpoint PÚBLICO: retorna contexto do link do assinante.
 *
 * Segurança: token opaco (não enumerável) + bloqueio por status no fluxo.
 * Observação: este endpoint não autentica; deve retornar apenas o necessário
 * para a jornada pública do assinante.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const supabase = createServiceClient();

    const { data: signer, error: signerError } = await supabase
      .from(TABLE_DOCUMENTO_ASSINANTES)
      .select("*")
      .eq("token", token)
      .single();

    if (signerError) {
      return NextResponse.json(
        { success: false, error: "Link inválido." },
        { status: 404 }
      );
    }

    const { data: doc, error: docError } = await supabase
      .from(TABLE_DOCUMENTOS)
      .select("documento_uuid, titulo, status, selfie_habilitada, pdf_original_url, pdf_final_url")
      .eq("id", signer.documento_id)
      .single();

    if (docError) {
      return NextResponse.json(
        { success: false, error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const { data: anchors, error: anchorsError } = await supabase
      .from(TABLE_DOCUMENTO_ANCORAS)
      .select("tipo, pagina, x_norm, y_norm, w_norm, h_norm")
      .eq("documento_id", signer.documento_id)
      .eq("documento_assinante_id", signer.id);

    if (anchorsError) {
      return NextResponse.json(
        { success: false, error: "Erro ao carregar âncoras." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        documento: doc,
        assinante: {
          id: signer.id,
          status: signer.status,
          dados_snapshot: signer.dados_snapshot,
          dados_confirmados: signer.dados_confirmados,
        },
        anchors: anchors ?? [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



