/**
 * Envio de notificação de prestação de contas via WhatsApp (Chatwoot + Meta Cloud API).
 *
 * Usa o endpoint `POST /api/v1/accounts/{account_id}/conversations` do Chatwoot
 * com `message.template_params` — que encaminha para a Meta Cloud API usando
 * um template pré-aprovado pelo Meta Business Manager.
 *
 * Template que precisa estar cadastrado e aprovado pela Meta:
 *   Nome: prestacao_contas_link_utility  (ou override via env)
 *   Categoria: UTILITY
 *   Idioma: pt_BR
 *   Body com 4 variáveis {{1}}..{{4}} — ver docs/architecture/WHATSAPP_TEMPLATE_PRESTACAO_CONTAS.md
 */

import { getChatwootClient } from '@/lib/chatwoot/client';
import { createConversation } from '@/lib/chatwoot/conversations';
import {
  createContact,
  searchContacts,
} from '@/lib/chatwoot/contacts';
import { formatPhoneForSourceId } from '@/lib/chatwoot/conversations';
import { getChatwootConfigFromDatabase } from '@/lib/chatwoot/config';

export interface EnviarWhatsAppInput {
  telefoneE164: string; // formato +5511987654321
  clienteNome: string;
  escritorioNome: string;
  processoNumero: string;
  linkCompleto: string;
}

export interface EnviarWhatsAppOutput {
  conversaId: number;
  contatoId: number;
  inboxId: number;
}

async function resolverConfigTemplate(): Promise<{
  inboxId: number;
  templateName: string;
  language: string;
}> {
  const envInbox = process.env.CHATWOOT_WHATSAPP_INBOX_ID;
  const envTemplate = process.env.CHATWOOT_PRESTACAO_CONTAS_TEMPLATE_NAME;
  const envLang = process.env.CHATWOOT_PRESTACAO_CONTAS_TEMPLATE_LANGUAGE;

  let inboxId = envInbox ? Number(envInbox) : NaN;
  let templateName = envTemplate || 'prestacao_contas_link_utility';
  let language = envLang || 'pt_BR';

  if (!Number.isFinite(inboxId)) {
    const config = await getChatwootConfigFromDatabase();
    if (!config) {
      throw new Error(
        'Chatwoot não configurado. Configure na tabela integracoes ou defina CHATWOOT_WHATSAPP_INBOX_ID.',
      );
    }
    const extra = (await getExtraConfig()) ?? {};
    inboxId = Number(extra.whatsapp_inbox_id ?? config.defaultInboxId ?? NaN);
    templateName =
      (extra.prestacao_contas_template_name as string | undefined) ??
      templateName;
    language =
      (extra.prestacao_contas_template_language as string | undefined) ??
      language;
  }

  if (!Number.isFinite(inboxId)) {
    throw new Error(
      'WhatsApp inbox_id não configurado. Configure CHATWOOT_WHATSAPP_INBOX_ID ou whatsapp_inbox_id em integracoes.configuracao.',
    );
  }

  return { inboxId, templateName, language };
}

async function getExtraConfig(): Promise<Record<string, unknown> | null> {
  const { createDbClient } = await import('@/lib/supabase');
  const db = createDbClient();
  const { data } = await db
    .from('integracoes')
    .select('configuracao')
    .eq('tipo', 'chatwoot')
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();
  return (data?.configuracao as Record<string, unknown>) ?? null;
}

async function acharOuCriarContato(
  telefoneE164: string,
  nome: string,
  inboxId: number,
): Promise<{ id: number; source_id: string }> {
  const chatwoot = await getChatwootClient();
  const sourceId = formatPhoneForSourceId(telefoneE164);

  const busca = await searchContacts({ q: sourceId }, chatwoot);
  if (busca.success && busca.data.payload.length > 0) {
    const existente = busca.data.payload[0];
    return { id: existente.id, source_id: sourceId };
  }

  const criado = await createContact(
    {
      name: nome,
      phone_number: sourceId,
      identifier: sourceId,
      inbox_id: inboxId,
    },
    chatwoot,
  );

  if (!criado.success) {
    throw new Error(
      `Falha ao criar contato Chatwoot: ${criado.error.message}`,
    );
  }

  return { id: criado.data.id, source_id: sourceId };
}

function renderizarFallbackContent(input: EnviarWhatsAppInput): string {
  return [
    `Olá, ${input.clienteNome}! O escritório ${input.escritorioNome} disponibilizou a sua declaração de prestação de contas referente ao processo ${input.processoNumero}.`,
    '',
    'Para conferir os valores, informar seus dados bancários e assinar digitalmente, acesse o link seguro abaixo:',
    '',
    input.linkCompleto,
    '',
    'Este link é pessoal e expira em 30 dias. Em caso de dúvida, responda esta mensagem.',
  ].join('\n');
}

export async function enviarWhatsAppPrestacaoContas(
  input: EnviarWhatsAppInput,
): Promise<EnviarWhatsAppOutput> {
  const chatwoot = await getChatwootClient();
  const { inboxId, templateName, language } = await resolverConfigTemplate();

  const contato = await acharOuCriarContato(
    input.telefoneE164,
    input.clienteNome,
    inboxId,
  );

  const result = await createConversation(
    {
      source_id: contato.source_id,
      inbox_id: inboxId,
      contact_id: contato.id,
      message: {
        content: renderizarFallbackContent(input),
        template_params: {
          name: templateName,
          category: 'UTILITY',
          language,
          processed_params: {
            '1': input.clienteNome,
            '2': input.escritorioNome,
            '3': input.processoNumero,
            '4': input.linkCompleto,
          },
        },
      },
    },
    chatwoot,
  );

  if (!result.success) {
    throw new Error(
      `Falha ao criar conversa WhatsApp: ${result.error.message}`,
    );
  }

  return {
    conversaId: result.data.id,
    contatoId: contato.id,
    inboxId,
  };
}
