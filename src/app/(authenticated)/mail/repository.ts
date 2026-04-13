import 'server-only';

/**
 * MAIL MODULE — Repository
 *
 * CRUD de credenciais de e-mail na tabela `credenciais_email` do Supabase.
 * Também expõe helpers para converter credenciais em MailConfig e obter
 * a configuração de conexão pronta para uso pelos clientes IMAP/SMTP.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  EmailCredentials,
  MailConfig,
  SaveEmailCredentialsInput,
} from './domain';

// ---------------------------------------------------------------------------
// Defaults de infraestrutura (Cloudron self-hosted)
// ---------------------------------------------------------------------------

export const CLOUDRON_DEFAULTS = {
  imap_host: 'my.zattaradvogados.com',
  imap_port: 993,
  smtp_host: 'my.zattaradvogados.com',
  smtp_port: 587,
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Busca uma credencial específica por ID (sem filtro de usuário).
 * Use para lookups internos onde o usuário_id já foi validado upstream.
 */
export async function getEmailCredentialsById(
  credentialId: number
): Promise<EmailCredentials | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('credenciais_email')
    .select('*')
    .eq('id', credentialId)
    .single();

  if (error || !data) return null;
  return data as EmailCredentials;
}

/**
 * Busca a primeira credencial ativa do usuário (backward compat).
 * Se accountId é fornecido, busca a credencial específica daquele usuário.
 */
export async function getEmailCredentials(
  usuarioId: number,
  accountId?: number
): Promise<EmailCredentials | null> {
  const supabase = createServiceClient();

  if (accountId) {
    const { data, error } = await supabase
      .from('credenciais_email')
      .select('*')
      .eq('id', accountId)
      .eq('usuario_id', usuarioId)
      .eq('active', true)
      .single();

    if (error || !data) return null;
    return data as EmailCredentials;
  }

  const { data, error } = await supabase
    .from('credenciais_email')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as EmailCredentials;
}

/**
 * Lista todas as credenciais de e-mail do usuário (contas ativas e inativas).
 */
export async function getAllEmailCredentials(
  usuarioId: number
): Promise<EmailCredentials[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('credenciais_email')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as EmailCredentials[];
}

// ---------------------------------------------------------------------------
// Conversão credenciais → config de conexão
// ---------------------------------------------------------------------------

export function credentialsToMailConfig(creds: EmailCredentials): MailConfig {
  return {
    imap: {
      host: creds.imap_host,
      port: creds.imap_port,
      user: creds.imap_user,
      pass: creds.imap_pass,
    },
    smtp: {
      host: creds.smtp_host,
      port: creds.smtp_port,
      user: creds.smtp_user,
      pass: creds.smtp_pass,
    },
  };
}

/**
 * Retorna o MailConfig pronto para os clientes IMAP/SMTP.
 * Retorna null se o usuário não tiver credenciais configuradas.
 */
export async function getUserMailConfig(
  usuarioId: number,
  accountId?: number
): Promise<MailConfig | null> {
  const creds = await getEmailCredentials(usuarioId, accountId);
  if (!creds) return null;
  return credentialsToMailConfig(creds);
}

// ---------------------------------------------------------------------------
// Mutações
// ---------------------------------------------------------------------------

/**
 * Cria ou atualiza credenciais de e-mail do usuário.
 * Se input.id for fornecido, atualiza o registro existente; caso contrário insere.
 */
export async function saveEmailCredentials(
  usuarioId: number,
  input: SaveEmailCredentialsInput
): Promise<EmailCredentials> {
  const supabase = createServiceClient();

  const payload = {
    usuario_id: usuarioId,
    nome_conta: input.nome_conta || input.imap_user,
    imap_host: input.imap_host ?? CLOUDRON_DEFAULTS.imap_host,
    imap_port: input.imap_port ?? CLOUDRON_DEFAULTS.imap_port,
    imap_user: input.imap_user,
    imap_pass: input.imap_pass,
    smtp_host: input.smtp_host ?? CLOUDRON_DEFAULTS.smtp_host,
    smtp_port: input.smtp_port ?? CLOUDRON_DEFAULTS.smtp_port,
    smtp_user: input.smtp_user,
    smtp_pass: input.smtp_pass,
    active: true,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('credenciais_email')
      .update(payload)
      .eq('id', input.id)
      .eq('usuario_id', usuarioId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao salvar credenciais: ${error?.message}`);
    }
    return data as EmailCredentials;
  }

  const { data, error } = await supabase
    .from('credenciais_email')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Erro ao salvar credenciais: ${error?.message}`);
  }
  return data as EmailCredentials;
}

/**
 * Remove credenciais do usuário.
 * Se accountId for fornecido, remove apenas aquela conta; caso contrário remove todas.
 */
export async function deleteEmailCredentials(
  usuarioId: number,
  accountId?: number
): Promise<void> {
  const supabase = createServiceClient();
  const query = supabase
    .from('credenciais_email')
    .delete()
    .eq('usuario_id', usuarioId);

  if (accountId) {
    query.eq('id', accountId);
  }

  await query;
}
