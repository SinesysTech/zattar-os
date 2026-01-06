import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { finalizeSignature } from '@/app/(dashboard)/assinatura-digital/feature/services/signature.service';
import type { FinalizePayload } from '@/app/(dashboard)/assinatura-digital/feature';

/**
 * Schema de validação para payload de finalização de assinatura.
 *
 * NOTA: A obrigatoriedade de `foto_base64` é condicional e depende da configuração
 * `formulario.foto_necessaria` no banco de dados. A validação é feita no serviço
 * `finalizeSignature()`, não no schema Zod. Se o formulário exigir foto e ela não
 * for fornecida, o serviço retornará erro de regra de negócio (400).
 */
const schema = z.object({
  // IDs obrigatórios com mensagens descritivas
  cliente_id: z.number({
    required_error: 'ID do cliente é obrigatório',
    invalid_type_error: 'ID do cliente deve ser um número',
  }),
  acao_id: z.number({
    required_error: 'ID da ação é obrigatório',
    invalid_type_error: 'ID da ação deve ser um número',
  }),
  template_id: z.string({
    required_error: 'ID do template é obrigatório',
  }).min(1, 'ID do template não pode estar vazio'),
  segmento_id: z.number({
    required_error: 'ID do segmento é obrigatório',
    invalid_type_error: 'ID do segmento deve ser um número',
  }),
  segmento_nome: z.string().optional(),
  formulario_id: z.number({
    required_error: 'ID do formulário é obrigatório',
    invalid_type_error: 'ID do formulário deve ser um número',
  }),

  // Cliente (opcional, mas validado se presente)
  cliente_dados: z.object({
    id: z.number(),
    nome: z.string(),
    cpf: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    endereco: z.string().optional(),
  }).optional(),

  // Dados de assinatura
  assinatura_base64: z.string({
    required_error: 'Assinatura é obrigatória',
  }).min(1, 'Assinatura não pode estar vazia'),

  // Foto - opcional no schema, validação condicional no serviço baseada em formulario.foto_necessaria
  foto_base64: z.string().optional().nullable(),

  // Geolocalização (opcional)
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geolocation_accuracy: z.number().optional().nullable(),
  geolocation_timestamp: z.string().optional().nullable(),

  // Metadados de segurança
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  sessao_id: z.string().uuid().optional().nullable(),

  // Conformidade legal MP 2.200-2
  termos_aceite: z.boolean({
    required_error: 'Aceite dos termos é obrigatório',
    invalid_type_error: 'Aceite dos termos deve ser um valor booleano',
  }).refine((val) => val === true, {
    message: 'Aceite dos termos é obrigatório para finalizar a assinatura',
  }),
  termos_aceite_versao: z.string({
    required_error: 'Versão dos termos é obrigatória',
  }).min(1, 'Versão dos termos não pode estar vazia'),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
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
 * - Validação Zod de todos os campos obrigatórios
 * - IP e user-agent extraídos do request e mesclados ao payload
 * - UUID de sessão para rastreamento
 * - Rate limiting recomendado (TODO: implementar)
 *
 * Campos obrigatórios:
 * - `cliente_id`, `acao_id`, `template_id`, `segmento_id`, `formulario_id`
 * - `assinatura_base64` - Data URL da assinatura manuscrita
 * - `termos_aceite` - Deve ser `true` (conformidade legal MP 2.200-2)
 * - `termos_aceite_versao` - Versão dos termos aceitos (ex: "v1.0-MP2200-2")
 *
 * Campos condicionais:
 * - `foto_base64` - Obrigatório se `formulario.foto_necessaria = true` (validado no serviço)
 *
 * @returns {Promise<NextResponse>} 201 Created com dados da assinatura ou erro apropriado
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
      // Retornar mensagem descritiva com detalhes dos campos inválidos
      return NextResponse.json({
        error: 'Dados de assinatura inválidos',
        message: 'Verifique os campos obrigatórios e tente novamente',
        details: error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao finalizar assinatura';
    console.error('Erro em POST /assinatura-digital/signature/finalizar:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
