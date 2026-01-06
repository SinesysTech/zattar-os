import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clienteSinesysToAssinaturaDigital } from "@/app/(dashboard)/assinatura-digital/feature";
import { applyRateLimit } from "@/app/(dashboard)/assinatura-digital/feature/utils/rate-limit";

const schema = z.object({ cpf: z.string().length(11) });

/**
 * Endpoint PÚBLICO: verifica CPF e retorna dados do cliente se existir.
 *
 * Segurança:
 * - Rate limiting: 10 requisições por minuto por IP
 */
export async function POST(request: NextRequest) {
  // Rate limiting: 10 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, "verificarCpf");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { cpf } = schema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*, enderecos(*)")
      .eq("cpf", cpf)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const cliente = data
      ? clienteSinesysToAssinaturaDigital(data, data.enderecos)
      : null;

    return NextResponse.json({
      exists: !!data,
      cliente,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
