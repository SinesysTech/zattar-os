import { describe, it, expect } from '@jest/globals';
import {
    buildFolderLinks,
    FOLDER_ICONS,
    FOLDER_LABELS,
    DEFAULT_FOLDER_LINKS,
} from '../../utils/constants';
import type { MailFolder } from '@/lib/mail/types';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeFolder(overrides: Partial<MailFolder> = {}): MailFolder {
    return {
        name: 'Inbox',
        path: 'INBOX',
        total: 50,
        unread: 5,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// FOLDER_ICONS
// ---------------------------------------------------------------------------

describe('FOLDER_ICONS', () => {
    it('deve conter ícones para todas as pastas padrão', () => {
        expect(FOLDER_ICONS).toHaveProperty('INBOX');
        expect(FOLDER_ICONS).toHaveProperty('Drafts');
        expect(FOLDER_ICONS).toHaveProperty('Sent');
        expect(FOLDER_ICONS).toHaveProperty('Junk');
        expect(FOLDER_ICONS).toHaveProperty('Trash');
        expect(FOLDER_ICONS).toHaveProperty('Archive');
    });

    it('deve ter exatamente 6 ícones mapeados', () => {
        expect(Object.keys(FOLDER_ICONS)).toHaveLength(6);
    });
});

// ---------------------------------------------------------------------------
// FOLDER_LABELS
// ---------------------------------------------------------------------------

describe('FOLDER_LABELS', () => {
    it('deve conter labels em português para todas as pastas padrão', () => {
        expect(FOLDER_LABELS.INBOX).toBe('Caixa de Entrada');
        expect(FOLDER_LABELS.Drafts).toBe('Rascunhos');
        expect(FOLDER_LABELS.Sent).toBe('Enviados');
        expect(FOLDER_LABELS.Junk).toBe('Lixo eletrônico');
        expect(FOLDER_LABELS.Trash).toBe('Lixeira');
        expect(FOLDER_LABELS.Archive).toBe('Arquivo');
    });

    it('deve ter exatamente 6 labels mapeados', () => {
        expect(Object.keys(FOLDER_LABELS)).toHaveLength(6);
    });
});

// ---------------------------------------------------------------------------
// DEFAULT_FOLDER_LINKS
// ---------------------------------------------------------------------------

describe('DEFAULT_FOLDER_LINKS', () => {
    it('deve conter 6 links padrão', () => {
        expect(DEFAULT_FOLDER_LINKS).toHaveLength(6);
    });

    it('deve ter INBOX como primeiro link com variant "default"', () => {
        const inbox = DEFAULT_FOLDER_LINKS[0];
        expect(inbox.folder).toBe('INBOX');
        expect(inbox.variant).toBe('default');
        expect(inbox.title).toBe('Caixa de Entrada');
    });

    it('deve ter demais links com variant "ghost"', () => {
        const rest = DEFAULT_FOLDER_LINKS.slice(1);
        for (const link of rest) {
            expect(link.variant).toBe('ghost');
        }
    });

    it('cada link deve ter title, icon e folder definidos', () => {
        for (const link of DEFAULT_FOLDER_LINKS) {
            expect(link.title).toBeTruthy();
            expect(link.icon).toBeDefined();
            expect(link.folder).toBeTruthy();
        }
    });
});

// ---------------------------------------------------------------------------
// buildFolderLinks
// ---------------------------------------------------------------------------

describe('buildFolderLinks', () => {
    it('deve retornar DEFAULT_FOLDER_LINKS quando folders está vazio', () => {
        const result = buildFolderLinks([], 'INBOX');
        expect(result).toEqual(DEFAULT_FOLDER_LINKS);
    });

    it('deve mapear folders com labels em português', () => {
        const folders: MailFolder[] = [
            makeFolder({ name: 'Inbox', path: 'INBOX', unread: 3 }),
            makeFolder({ name: 'Sent', path: 'Sent', unread: 0 }),
        ];

        const result = buildFolderLinks(folders, 'INBOX');

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('Caixa de Entrada');
        expect(result[1].title).toBe('Enviados');
    });

    it('deve marcar folder selecionado com variant "default"', () => {
        const folders: MailFolder[] = [
            makeFolder({ path: 'INBOX' }),
            makeFolder({ path: 'Sent', name: 'Sent' }),
        ];

        const result = buildFolderLinks(folders, 'Sent');

        expect(result[0].variant).toBe('ghost');
        expect(result[1].variant).toBe('default');
    });

    it('deve exibir contagem de não lidos como label', () => {
        const folders: MailFolder[] = [
            makeFolder({ path: 'INBOX', unread: 12 }),
            makeFolder({ path: 'Sent', name: 'Sent', unread: 0 }),
        ];

        const result = buildFolderLinks(folders, 'INBOX');

        expect(result[0].label).toBe('12');
        expect(result[1].label).toBe('');
    });

    it('deve usar nome original quando path não tem label mapeado', () => {
        const folders: MailFolder[] = [
            makeFolder({ name: 'Custom Folder', path: 'CustomPath', unread: 0 }),
        ];

        const result = buildFolderLinks(folders, 'INBOX');

        expect(result[0].title).toBe('Custom Folder');
    });

    it('deve usar ícone Inbox como fallback para paths desconhecidos', () => {
        const folders: MailFolder[] = [
            makeFolder({ name: 'Unknown', path: 'UnknownPath' }),
        ];

        const result = buildFolderLinks(folders, 'INBOX');

        // Fallback icon is Inbox
        expect(result[0].icon).toBeDefined();
    });

    it('deve usar ícone correto para cada pasta conhecida', () => {
        const folders: MailFolder[] = [
            makeFolder({ path: 'INBOX', name: 'Inbox' }),
            makeFolder({ path: 'Trash', name: 'Trash' }),
        ];

        const result = buildFolderLinks(folders, 'INBOX');

        expect(result[0].icon).toBe(FOLDER_ICONS.INBOX);
        expect(result[1].icon).toBe(FOLDER_ICONS.Trash);
    });
});
