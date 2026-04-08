/**
 * MAIL MODULE — Barrel Export (API Pública)
 *
 * Re-exporta tipos, hooks, componentes e utils do módulo de e-mail.
 * Este arquivo é o ponto de entrada para consumidores externos.
 */

// =============================================================================
// Components
// =============================================================================

export { Mail } from './components/mail';

// =============================================================================
// Hooks
// =============================================================================

export { useMailStore } from './hooks/use-mail';
export type { MailAccount } from './hooks/use-mail';
export { useMailFolders, useMailMessages, useMailActions } from './hooks/use-mail-api';
export { useMailDisplay } from './hooks/use-mail-display';

// =============================================================================
// Types / Domain
// =============================================================================

export type {
    MailMessagePreview,
    MailMessage,
    MailFolder,
    MailAddress,
} from './domain';

// =============================================================================
// Utils
// =============================================================================

export {
    FOLDER_ICONS,
    FOLDER_LABELS,
    DEFAULT_FOLDER_LINKS,
    buildFolderLinks,
} from './utils/constants';

export {
    isSentMail,
    getMailPrimaryAddress,
    getMailPrimaryName,
    getMailParticipantLabel,
    getMailParticipantLine,
    formatMailAddressList,
    getMailListPreview,
} from './utils/display';
