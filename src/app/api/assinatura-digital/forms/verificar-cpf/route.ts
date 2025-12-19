import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/server";
import { clienteSinesysToAssinaturaDigital } from "@/features/assinatura-digital";

const schema = z.object({ cpf: z.string().length(11) });

export async function POST(request: NextRequest) {
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
