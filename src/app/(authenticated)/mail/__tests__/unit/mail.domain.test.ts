import { describe, it, expect } from '@jest/globals';
import type {
    MailMessagePreview,
    MailMessage,
    MailFolder,
    MailAddress,
} from '../../domain';
import {
    isSentMail,
    getMailPrimaryAddress,
    getMailPrimaryName,
    getMailParticipantLabel,
    getMailParticipantLine,
    formatMailAddressList,
    getMailListPreview,
} from '../../utils/display';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeAddress(overrides: Partial<MailAddress> = {}): MailAddress {
    return { name: 'João Silva', address: 'joao@example.com', ...overrides };
}

function makePreview(overrides: Partial<MailMessagePreview> = {}): MailMessagePreview {
    return {
        uid: 1,
        messageId: '<msg-1@example.com>',
        from: makeAddress(),
        to: [makeAddress({ name: 'Maria', address: 'maria@example.com' })],
        subject: 'Assunto teste',
        preview: 'Prévia do email',
        date: '2024-01-15T10:00:00Z',
        read: false,
        flagged: false,
        answered: false,
        folder: 'INBOX',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Domain Types — smoke check (types are re-exported, not schemas)
// ---------------------------------------------------------------------------

describe('Mail Domain Types', () => {
    it('deve permitir construir MailAddress com name e address', () => {
        const addr: MailAddress = { name: 'Test', address: 'test@mail.com' };
        expect(addr.name).toBe('Test');
        expect(addr.address).toBe('test@mail.com');
    });

    it('deve permitir construir MailFolder com campos obrigatórios', () => {
        const folder: MailFolder = { name: 'Inbox', path: 'INBOX', total: 10, unread: 3 };
        expect(folder.total).toBe(10);
        expect(folder.unread).toBe(3);
    });

    it('deve permitir construir MailFolder com specialUse opcional', () => {
        const folder: MailFolder = { name: 'Sent', path: 'Sent', total: 5, unread: 0, specialUse: '\\Sent' };
        expect(folder.specialUse).toBe('\\Sent');
    });

    it('deve permitir construir MailMessagePreview com todos os campos', () => {
        const preview = makePreview();
        expect(preview.uid).toBe(1);
        expect(preview.read).toBe(false);
        expect(preview.folder).toBe('INBOX');
    });

    it('deve permitir construir MailMessage com html opcional', () => {
        const msg: MailMessage = {
            uid: 1,
            messageId: '<msg@test.com>',
            from: makeAddress(),
            to: [makeAddress()],
            cc: [],
            subject: 'Test',
            text: 'Body text',
            date: '2024-01-01',
            flags: ['\\Seen'],
            folder: 'INBOX',
        };
        expect(msg.html).toBeUndefined();
        expect(msg.text).toBe('Body text');
    });
});

// ---------------------------------------------------------------------------
// Display Utils — isSentMail
// ---------------------------------------------------------------------------

describe('isSentMail', () => {
    it('deve retornar true para folder "Sent"', () => {
        expect(isSentMail({ folder: 'Sent' })).toBe(true);
    });

    it('deve retornar false para folder "INBOX"', () => {
        expect(isSentMail({ folder: 'INBOX' })).toBe(false);
    });

    it('deve retornar false para folder "Drafts"', () => {
        expect(isSentMail({ folder: 'Drafts' })).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Display Utils — getMailPrimaryAddress
// ---------------------------------------------------------------------------

describe('getMailPrimaryAddress', () => {
    it('deve retornar "from" para emails recebidos (INBOX)', () => {
        const mail = makePreview({ folder: 'INBOX' });
        const addr = getMailPrimaryAddress(mail);
        expect(addr).toEqual(mail.from);
    });

    it('deve retornar primeiro "to" para emails enviados (Sent)', () => {
        const toAddr = makeAddress({ name: 'Destinatário', address: 'dest@mail.com' });
        const mail = makePreview({ folder: 'Sent', to: [toAddr] });
        const addr = getMailPrimaryAddress(mail);
        expect(addr).toEqual(toAddr);
    });

    it('deve retornar "from" para Sent sem destinatários', () => {
        const mail = makePreview({ folder: 'Sent', to: [] });
        const addr = getMailPrimaryAddress(mail);
        expect(addr).toEqual(mail.from);
    });
});

// ---------------------------------------------------------------------------
// Display Utils — getMailPrimaryName
// ---------------------------------------------------------------------------

describe('getMailPrimaryName', () => {
    it('deve retornar nome do remetente para INBOX', () => {
        const mail = makePreview({ from: makeAddress({ name: 'Carlos', address: 'carlos@mail.com' }) });
        expect(getMailPrimaryName(mail)).toBe('Carlos');
    });

    it('deve retornar email quando nome está vazio', () => {
        const mail = makePreview({ from: makeAddress({ name: '', address: 'anon@mail.com' }) });
        expect(getMailPrimaryName(mail)).toBe('anon@mail.com');
    });

    it('deve retornar "Contato desconhecido" quando ambos estão vazios', () => {
        const mail = makePreview({ from: makeAddress({ name: '', address: '' }) });
        expect(getMailPrimaryName(mail)).toBe('Contato desconhecido');
    });

    it('deve retornar nome do destinatário para Sent', () => {
        const mail = makePreview({
            folder: 'Sent',
            to: [makeAddress({ name: 'Ana', address: 'ana@mail.com' })],
        });
        expect(getMailPrimaryName(mail)).toBe('Ana');
    });
});

// ---------------------------------------------------------------------------
// Display Utils — getMailParticipantLabel
// ---------------------------------------------------------------------------

describe('getMailParticipantLabel', () => {
    it('deve retornar "De" para emails recebidos', () => {
        expect(getMailParticipantLabel(makePreview({ folder: 'INBOX' }))).toBe('De');
    });

    it('deve retornar "Para" para emails enviados', () => {
        expect(getMailParticipantLabel(makePreview({ folder: 'Sent' }))).toBe('Para');
    });
});

// ---------------------------------------------------------------------------
// Display Utils — getMailParticipantLine
// ---------------------------------------------------------------------------

describe('getMailParticipantLine', () => {
    it('deve retornar "Nome <email>" para emails recebidos', () => {
        const mail = makePreview({ from: makeAddress({ name: 'Pedro', address: 'pedro@mail.com' }) });
        expect(getMailParticipantLine(mail)).toBe('Pedro <pedro@mail.com>');
    });

    it('deve retornar lista de destinatários para emails enviados', () => {
        const mail = makePreview({
            folder: 'Sent',
            to: [
                makeAddress({ name: 'Ana', address: 'ana@mail.com' }),
                makeAddress({ name: 'Bruno', address: 'bruno@mail.com' }),
            ],
        });
        const line = getMailParticipantLine(mail);
        expect(line).toContain('Ana');
        expect(line).toContain('Bruno');
    });

    it('deve retornar apenas email quando nome é igual ao email', () => {
        const mail = makePreview({
            from: makeAddress({ name: 'user@mail.com', address: 'user@mail.com' }),
        });
        expect(getMailParticipantLine(mail)).toBe('user@mail.com');
    });
});

// ---------------------------------------------------------------------------
// Display Utils — formatMailAddressList
// ---------------------------------------------------------------------------

describe('formatMailAddressList', () => {
    it('deve formatar lista com um endereço (summary)', () => {
        const result = formatMailAddressList([makeAddress({ name: 'João', address: 'j@m.com' })]);
        expect(result).toBe('João');
    });

    it('deve formatar lista com múltiplos endereços (summary)', () => {
        const result = formatMailAddressList([
            makeAddress({ name: 'A', address: 'a@m.com' }),
            makeAddress({ name: 'B', address: 'b@m.com' }),
        ]);
        expect(result).toBe('A, B');
    });

    it('deve formatar lista com formato "full"', () => {
        const result = formatMailAddressList(
            [makeAddress({ name: 'João', address: 'j@m.com' })],
            'full',
        );
        expect(result).toBe('João <j@m.com>');
    });

    it('deve retornar string vazia para lista vazia', () => {
        expect(formatMailAddressList([])).toBe('');
    });

    it('deve deduplicar endereços com mesmo resultado formatado', () => {
        const addr = makeAddress({ name: 'Dup', address: 'dup@m.com' });
        const result = formatMailAddressList([addr, addr]);
        expect(result).toBe('Dup');
    });

    it('deve ignorar endereços com nome e email vazios', () => {
        const result = formatMailAddressList([
            makeAddress({ name: '', address: '' }),
            makeAddress({ name: 'Valid', address: 'v@m.com' }),
        ]);
        expect(result).toBe('Valid');
    });
});

// ---------------------------------------------------------------------------
// Display Utils — getMailListPreview
// ---------------------------------------------------------------------------

describe('getMailListPreview', () => {
    it('deve retornar preview quando diferente do subject', () => {
        const mail = makePreview({ subject: 'Assunto', preview: 'Prévia diferente' });
        expect(getMailListPreview(mail)).toBe('Prévia diferente');
    });

    it('deve retornar string vazia quando preview é igual ao subject', () => {
        const mail = makePreview({ subject: 'Mesmo texto', preview: 'Mesmo texto' });
        expect(getMailListPreview(mail)).toBe('');
    });

    it('deve retornar "Para: destinatários" para Sent sem preview distinta', () => {
        const mail = makePreview({
            folder: 'Sent',
            subject: 'Assunto',
            preview: 'Assunto',
            to: [makeAddress({ name: 'Ana', address: 'ana@m.com' })],
        });
        expect(getMailListPreview(mail)).toBe('Para: Ana');
    });

    it('deve retornar string vazia para Sent sem preview e sem destinatários', () => {
        const mail = makePreview({
            folder: 'Sent',
            subject: 'X',
            preview: 'X',
            to: [],
        });
        expect(getMailListPreview(mail)).toBe('');
    });

    it('deve retornar preview quando presente mesmo para Sent', () => {
        const mail = makePreview({
            folder: 'Sent',
            subject: 'Assunto',
            preview: 'Prévia diferente do assunto',
        });
        expect(getMailListPreview(mail)).toBe('Prévia diferente do assunto');
    });

    it('deve tratar preview vazia retornando fallback', () => {
        const mail = makePreview({ preview: '', subject: 'Assunto' });
        // INBOX sem preview → retorna ""
        expect(getMailListPreview(mail)).toBe('');
    });
});
