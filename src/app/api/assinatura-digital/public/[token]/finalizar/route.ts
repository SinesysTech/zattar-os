import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { finalizePublicSigner } from "@/app/(dashboard)/assinatura-digital/feature/services/documentos.service";

const schema = z.object({
  selfie_base64: z.string().optional().nullable(),
  assinatura_base64: z.string().min(1),
  rubrica_base64: z.string().optional().nullable(),
  geolocation: z.record(z.unknown()).optional().nullable(),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
  termos_aceite: z.boolean().refine((v) => v === true, {
    message: "Aceite dos termos é obrigatório",
  }),
  termos_aceite_versao: z.string().min(1),
});

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

/**
 * Endpoint PÚBLICO: finaliza assinatura do assinante (token).
 *
 * - selfie opcional/obrigatória conforme documento
 * - assinatura obrigatória
 * - rubrica opcional (obrigatória se existirem âncoras de rubrica para o assinante)
 *   (na primeira versão, validamos no serviço pelo fato do rubrica_base64 vir ou não)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent");

    const result = await finalizePublicSigner({
      token,
      ip_address: ip,
      user_agent: userAgent,
      geolocation: parsed.geolocation ?? null,
      dispositivo_fingerprint_raw: parsed.dispositivo_fingerprint_raw ?? null,
      termos_aceite_versao: parsed.termos_aceite_versao,
      selfie_base64: parsed.selfie_base64 ?? null,
      assinatura_base64: parsed.assinatura_base64,
      rubrica_base64: parsed.rubrica_base64 ?? null,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Erro ao finalizar assinatura";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



