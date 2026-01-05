import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/require-permission";
import { createServiceClient } from "@/lib/supabase/service-client";

const schema = z.object({
  tipo: z.enum([
    "cliente",
    "parte_contraria",
    "representante",
    "terceiro",
    "usuario",
  ]),
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(
    request,
    "assinatura_digital",
    "visualizar"
  );
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const url = new URL(request.url);
    const parsed = schema.parse({
      tipo: url.searchParams.get("tipo"),
      q: url.searchParams.get("q"),
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const supabase = createServiceClient();
    const term = parsed.q.trim();

    if (parsed.tipo === "cliente") {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, cpf, cnpj")
        .eq("ativo", true)
        .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`)
        .limit(parsed.limit);
      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    if (parsed.tipo === "parte_contraria") {
      const { data, error } = await supabase
        .from("partes_contrarias")
        .select("id, nome, cpf, cnpj")
        .eq("ativo", true)
        .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`)
        .limit(parsed.limit);
      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    if (parsed.tipo === "representante") {
      const { data, error } = await supabase
        .from("representantes")
        .select("id, nome, cpf, email")
        .eq("ativo", true)
        .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(parsed.limit);
      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    if (parsed.tipo === "terceiro") {
      const { data, error } = await supabase
        .from("terceiros")
        .select("id, nome, cpf, cnpj")
        .eq("ativo", true)
        .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`)
        .limit(parsed.limit);
      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    if (parsed.tipo === "usuario") {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo, cpf, email_corporativo")
        .eq("ativo", true)
        .or(
          `nome_completo.ilike.%${term}%,cpf.ilike.%${term}%,email_corporativo.ilike.%${term}%`
        )
        .limit(parsed.limit);
      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao buscar assinantes";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



