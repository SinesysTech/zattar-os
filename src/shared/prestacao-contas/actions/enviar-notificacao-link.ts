'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { authenticatedAction } from '@/lib/safe-action';
import { enviarNotificacaoLink } from '../services/notificacoes';

const schema = z.object({
  token: z.string().uuid(),
  canal: z.enum(['email', 'whatsapp', 'ambos']),
});

async function resolverBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : 'https://app.zattar.com.br';
}

export const actionEnviarNotificacaoLink = authenticatedAction(
  schema,
  async ({ token, canal }) => {
    const baseUrl = await resolverBaseUrl();
    const result = await enviarNotificacaoLink({ token, canal, baseUrl });

    const sucessoEmail = !!result.email;
    const sucessoWhats = !!result.whatsapp;
    const totalErros = result.erros.length;

    return {
      sucessoEmail,
      sucessoWhats,
      erros: result.erros,
      mensagem:
        totalErros === 0
          ? 'Enviado com sucesso'
          : `Enviado com ${totalErros} erro(s): ${result.erros.map((e) => `${e.canal}: ${e.mensagem}`).join(' · ')}`,
    };
  },
);
