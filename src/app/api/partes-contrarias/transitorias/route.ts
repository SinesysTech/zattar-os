import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/shared/assinatura-digital/utils/rate-limit";
import { createTransitoria } from "@/shared/partes-contrarias-transitorias";

/**
 * Endpoint PÚBLICO: cria uma parte contrária transitória.
 *
 * Chamado pelo wizard de formulário público quando o cliente digita um nome
 * que não existe em `partes_contrarias` e opta por "Adicionar com cadastro
 * pendente". Somente `nome` é obrigatório no payload — os demais campos são
 * opcionais e podem ser completados pela firma posteriormente via promoção.
 *
 * Segurança:
 * - Rate limit: 10 req/min por IP (mesmo patamar de identificação/CPF)
 * - Valida criado_via com whitelist (apenas 'formulario_publico' é aceito)
 * - Sem necessidade de token de assinatura (esse fluxo ocorre antes do token)
 */
const schema = z.object({
  nome: z.string().trim().min(2).max(200),
  tipo_pessoa: z.enum(["pf", "pj"]).optional().nullable(),
  cpf_ou_cnpj: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  telefone: z.string().trim().optional().nullable(),
  observacoes: z.string().trim().max(2000).optional().nullable(),
  criado_em_contrato_id: z.number().int().positive().optional().nullable(),
  sessao_formulario_uuid: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimitResponse = await applyRateLimit(request, "identificacao");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const transitoria = await createTransitoria({
      nome: parsed.nome,
      tipo_pessoa: parsed.tipo_pessoa ?? null,
      cpf_ou_cnpj: parsed.cpf_ou_cnpj ?? null,
      email: parsed.email ?? null,
      telefone: parsed.telefone ?? null,
      observacoes: parsed.observacoes ?? null,
      criado_via: "formulario_publico",
      criado_em_contrato_id: parsed.criado_em_contrato_id ?? null,
      criado_por: null,
      sessao_formulario_uuid: parsed.sessao_formulario_uuid ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: transitoria.id,
          nome: transitoria.nome,
          status: transitoria.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao criar parte contrária transitória";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
