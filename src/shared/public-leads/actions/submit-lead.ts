/**
 * Server Action: Submissão de lead do formulário público.
 * ============================================================================
 * Wrapper em publicFormAction (compatível com useActionState do React 19) que
 * chama o service submitLead. Captura IP e user-agent via headers do Next.
 *
 * Consumido por: src/app/website/contato/_components/contact-form.tsx
 * ============================================================================
 */

'use server';

import { headers } from 'next/headers';

import { publicFormAction } from '@/lib/safe-action';

import { PublicLeadInputSchema } from '../domain';
import { submitLead } from '../service';

async function extractMetadata() {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  const realIp = h.get('x-real-ip');
  const cfIp = h.get('cf-connecting-ip');

  // Primeiro valor de x-forwarded-for é o IP do cliente original
  const ip = cfIp ?? realIp ?? xff?.split(',')[0]?.trim() ?? null;
  const userAgent = h.get('user-agent') ?? null;

  return { ip, userAgent };
}

export const submitLeadAction = publicFormAction(
  PublicLeadInputSchema,
  async (input) => {
    const metadata = await extractMetadata();
    const result = await submitLead(input, metadata);

    if (result.kind === 'honeypot') {
      // Resposta de sucesso fake pra bot não saber que foi detectado
      return { success: true as const };
    }

    return { success: true as const, leadId: result.lead.id };
  },
);
