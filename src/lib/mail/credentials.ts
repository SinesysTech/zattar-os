import { createServiceClient } from "@/lib/supabase/service-client";
import type { MailConfig } from "./config";

export interface EmailCredentials {
  id: number;
  usuario_id: number;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_pass: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveEmailCredentialsInput {
  imap_host?: string;
  imap_port?: number;
  imap_user: string;
  imap_pass: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user: string;
  smtp_pass: string;
}

export const CLOUDRON_DEFAULTS = {
  imap_host: "my.zattaradvogados.com",
  imap_port: 993,
  smtp_host: "my.zattaradvogados.com",
  smtp_port: 587,
} as const;

export async function getEmailCredentials(
  usuarioId: number
): Promise<EmailCredentials | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("credenciais_email")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return data as EmailCredentials;
}

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

export async function getUserMailConfig(
  usuarioId: number
): Promise<MailConfig | null> {
  const creds = await getEmailCredentials(usuarioId);
  if (!creds) return null;
  return credentialsToMailConfig(creds);
}

export async function saveEmailCredentials(
  usuarioId: number,
  input: SaveEmailCredentialsInput
): Promise<EmailCredentials> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("credenciais_email")
    .upsert(
      {
        usuario_id: usuarioId,
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
      },
      { onConflict: "usuario_id" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Erro ao salvar credenciais: ${error?.message}`);
  }
  return data as EmailCredentials;
}

export async function deleteEmailCredentials(
  usuarioId: number
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("credenciais_email")
    .delete()
    .eq("usuario_id", usuarioId);
}
