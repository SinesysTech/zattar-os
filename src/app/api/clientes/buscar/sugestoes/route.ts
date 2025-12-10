import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/backend/auth/api-auth";
import { obterClientes } from "@/backend/clientes/services/clientes/listar-clientes.service";

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || searchParams.get("search") || searchParams.get("busca") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

  try {
    const result = await obterClientes({ busca: search, limite: limit });
    const options = result.clientes.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.cpf || undefined,
      cnpj: c.cnpj || undefined,
    }));
    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar clientes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
