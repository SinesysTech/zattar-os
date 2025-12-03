import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { finalizeSignature } from '@/backend/formsign-signature/services/signature.service';
import type { FinalizePayload } from '@/backend/types/formsign-signature/types';

const schema = z.object({
  cliente_id: z.number(),
  acao_id: z.number(),
  template_id: z.string().min(1),
  segmento_id: z.number(),
  segmento_nome: z.string().optional(),
  formulario_id: z.number(),
  assinatura_base64: z.string().min(1),
  foto_base64: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geolocation_accuracy: z.number().optional().nullable(),
  geolocation_timestamp: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  sessao_id: z.string().uuid().optional().nullable(),
});

/**
 * Endpoint PÚBLICO para finalizar assinatura de formulários.
 *
 * IMPORTANTE: Este endpoint NÃO requer autenticação pois é usado
 * por formulários públicos acessados por usuários finais.
 *
 * Segurança:
 * - Validação Zod de todos os campos
 * - Logs de IP/user-agent para auditoria
 * - UUID de sessão para rastreamento
 * - Rate limiting recomendado (TODO: implementar)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = schema.parse(body) as FinalizePayload;
    const result = await finalizeSignature(payload);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao finalizar assinatura';
    console.error('Erro em POST /assinatura-digital/signature/finalizar:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
