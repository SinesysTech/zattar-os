import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NACIONALIDADES } from "@/app/app/assinatura-digital/feature/constants/nacionalidades";
import { applyRateLimit } from "@/app/app/assinatura-digital/feature/utils/rate-limit";

const schema = z.object({ cpf: z.string().length(11) });

// ---------------------------------------------------------------------------
// Parsing: DB values → form select codes
// ---------------------------------------------------------------------------
const ENUM_TO_ESTADO_CIVIL: Record<string, string> = {
  solteiro: "1",
  casado: "2",
  divorciado: "4",
  viuvo: "5",
};

const ENUM_TO_GENERO: Record<string, string> = {
  masculino: "1",
  feminino: "2",
  outro: "3",
  prefiro_nao_informar: "4",
};

const NACIONALIDADE_TO_CODE: Record<string, string> = {};
for (const [code, text] of Object.entries(NACIONALIDADES)) {
  NACIONALIDADE_TO_CODE[text] = String(code);
}

function extractEmail(emails: unknown): string | null {
  if (!Array.isArray(emails) || emails.length === 0) return null;
  const first = emails[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null && "email" in first) {
    return typeof first.email === "string" ? first.email : null;
  }
  return null;
}

function combinePhone(ddd: string | null, numero: string | null): string | null {
  if (ddd && numero) return `${ddd}${numero}`;
  if (numero) return numero;
  return null;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
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

    if (!data) {
      return NextResponse.json({ exists: false, cliente: null });
    }

    const endereco = Array.isArray(data.enderecos) ? data.enderecos[0] : null;

    const cliente = {
      id: data.id,
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg ?? null,
      data_nascimento: data.data_nascimento ?? null,
      estado_civil: data.estado_civil ? ENUM_TO_ESTADO_CIVIL[data.estado_civil] ?? null : null,
      genero: data.genero ? ENUM_TO_GENERO[data.genero] ?? null : null,
      nacionalidade: data.nacionalidade ? NACIONALIDADE_TO_CODE[data.nacionalidade] ?? null : null,
      email: extractEmail(data.emails),
      celular: combinePhone(data.ddd_celular, data.numero_celular),
      telefone: combinePhone(data.ddd_residencial, data.numero_residencial),
      cep: endereco?.cep ?? null,
      logradouro: endereco?.logradouro ?? null,
      numero: endereco?.numero ?? null,
      complemento: endereco?.complemento ?? null,
      bairro: endereco?.bairro ?? null,
      cidade: endereco?.municipio ?? null,
      uf: endereco?.estado_sigla ?? null,
    };

    return NextResponse.json({ exists: true, cliente });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
