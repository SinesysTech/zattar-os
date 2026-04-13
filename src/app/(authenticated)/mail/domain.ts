/**
 * MAIL MODULE — Domain
 *
 * Fonte canônica de todos os tipos do módulo de e-mail.
 * Tipos de protocolo (MailAddress, MailMessage, etc.), configuração (MailConfig)
 * e credenciais (EmailCredentials, SaveEmailCredentialsInput) vivem aqui.
 *
 * Os clientes de protocolo em @/lib/mail/ consomem estes tipos via import direto.
 * Nenhum outro módulo deve importar tipos de @/lib/mail/types ou @/lib/mail/credentials.
 */

// ---------------------------------------------------------------------------
// Endereços e Mensagens
// ---------------------------------------------------------------------------

export type MailAddress = {
  name: string;
  address: string;
};

export type MailMessage = {
  uid: number;
  messageId: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  text: string;
  html?: string;
  date: string;
  flags: string[];
  folder: string;
};

export type MailMessagePreview = {
  uid: number;
  messageId: string;
  from: MailAddress;
  to: MailAddress[];
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  flagged: boolean;
  answered: boolean;
  folder: string;
};

export type MailFolder = {
  name: string;
  path: string;
  total: number;
  unread: number;
  specialUse?: string;
};

// ---------------------------------------------------------------------------
// Requisições de envio / operações
// ---------------------------------------------------------------------------

export type SendEmailRequest = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
};

export type ReplyRequest = {
  uid: number;
  folder: string;
  text: string;
  html?: string;
  replyAll: boolean;
};

export type ForwardRequest = {
  uid: number;
  folder: string;
  to: string[];
  text: string;
  html?: string;
};

export type FlagUpdateRequest = {
  folder: string;
  add?: string[];
  remove?: string[];
};

export type MoveRequest = {
  fromFolder: string;
  toFolder: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// ---------------------------------------------------------------------------
// Configuração de conexão (IMAP + SMTP)
// ---------------------------------------------------------------------------

export interface MailConfig {
  imap: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

// ---------------------------------------------------------------------------
// Credenciais persistidas (tabela credenciais_email)
// ---------------------------------------------------------------------------

export interface EmailCredentials {
  id: number;
  usuario_id: number;
  nome_conta: string;
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
  id?: number;
  nome_conta?: string;
  imap_host?: string;
  imap_port?: number;
  imap_user: string;
  imap_pass: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user: string;
  smtp_pass: string;
}

// ---------------------------------------------------------------------------
// Re-export de tipos locais do módulo
// ---------------------------------------------------------------------------

export type { MailAccount } from './hooks/use-mail';
