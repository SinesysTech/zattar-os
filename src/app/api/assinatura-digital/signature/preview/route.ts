import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import { generatePreview } from '@/shared/assinatura-digital/services/signature.service';
import type { PreviewPayload } from '@/shared/assinatura-digital';

const schema = z.object({
  cliente_id: z.number(),
  contrato_id: z.number().optional().nullable(),
  template_id: z.string().min(1),
  foto_base64: z.string().optional().nullable(),
  parte_contraria_dados: z.array(z.object({
    id: z.number(),
    nome: z.string(),
    cpf: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    tipo_pessoa: z.string().optional().nullable(),
    telefone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    endereco: z
      .object({
        cep: z.string().optional().nullable(),
        logradouro: z.string().optional().nullable(),
        numero: z.string().optional().nullable(),
        complemento: z.string().optional().nullable(),
        bairro: z.string().optional().nullable(),
        municipio: z.string().optional().nullable(),
        estado_sigla: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = schema.parse(body) as PreviewPayload;
    const result = await generatePreview(payload);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao gerar preview';
    console.error('Erro em POST /assinatura-digital/signature/preview:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
