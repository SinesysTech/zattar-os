import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { finalizeSignature } from '@/backend/assinatura-digital/services/signature.service';
import type { FinalizePayload } from '@/backend/types/assinatura-digital/types';

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
 * Extrai IP do cliente a partir dos headers da requisição.
 * Verifica x-forwarded-for (proxies/load balancers) e x-real-ip.
 */
function getClientIp(request: NextRequest): string | null {
  // x-forwarded-for pode conter múltiplos IPs: "client, proxy1, proxy2"
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Fallback para x-real-ip (usado por alguns proxies)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return null;
}

/**
 * Endpoint PÚBLICO para finalizar assinatura de formulários.
 *
 * IMPORTANTE: Este endpoint NÃO requer autenticação pois é usado
 * por formulários públicos acessados por usuários finais.
 *
 * Segurança:
 * - Validação Zod de todos os campos
 * - IP e user-agent extraídos do request e mesclados ao payload
 * - UUID de sessão para rastreamento
 * - Rate limiting recomendado (TODO: implementar)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extrair IP e user-agent do request para garantir auditoria
    const serverIp = getClientIp(request);
    const serverUserAgent = request.headers.get('user-agent');

    // Mesclar valores do servidor se não fornecidos pelo cliente (ou vazios)
    const enrichedBody = {
      ...body,
      ip_address: body.ip_address || serverIp || null,
      user_agent: body.user_agent || serverUserAgent || null,
    };

    const payload = schema.parse(enrichedBody) as FinalizePayload;
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
