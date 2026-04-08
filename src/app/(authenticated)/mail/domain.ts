/**
 * MAIL MODULE — Domain
 *
 * Tipos, schemas e regras de estado puro do módulo de e-mail.
 * Tipos de domínio compartilhados vivem em @/lib/mail/types.
 */

// Re-export dos tipos centrais de mail para conveniência do módulo
export type {
    MailMessagePreview,
    MailMessage,
    MailFolder,
    MailAddress,
} from '@/lib/mail/types';

// Tipos locais do módulo
export type { MailAccount } from './hooks/use-mail';
