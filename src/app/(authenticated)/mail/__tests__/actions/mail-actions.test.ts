/**
 * Tests for Mail API Route Handlers (Actions Layer)
 *
 * The mail module uses API routes instead of Server Actions (authenticatedAction).
 * These tests validate the same concerns as action tests:
 * 1. Authentication via authenticateRequest / authenticateMailRequest
 * 2. Input validation (required fields, correct types)
 * 3. Delegation to service layer (imap-client, smtp-client, credentials)
 * 4. Error handling
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next/cache');
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        getAll: jest.fn(() => []),
    })),
}));

const mockMailConfig = {
    imap: { host: 'imap.test.com', port: 993, user: 'user@test.com', pass: 'pass' },
    smtp: { host: 'smtp.test.com', port: 587, user: 'user@test.com', pass: 'pass' },
};

// Mock authenticateMailRequest (used by most mail routes)
jest.mock('@/lib/mail/api-helpers', () => ({
    authenticateMailRequest: jest.fn(),
    errorResponse: jest.fn((message: string, status: number = 500) => {
        const { NextResponse } = require('next/server');
        return NextResponse.json({ error: message }, { status });
    }),
    handleMailError: jest.fn((err: unknown) => {
        const { NextResponse } = require('next/server');
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return NextResponse.json({ error: message }, { status: 500 });
    }),
}));

// Mock authenticateRequest (used by credentials route)
jest.mock('@/lib/auth/api-auth', () => ({
    authenticateRequest: jest.fn(),
}));

// Mock IMAP client
jest.mock('@/lib/mail/imap-client', () => ({
    listFolders: jest.fn(),
    listMessages: jest.fn(),
    getMessage: jest.fn(),
    moveMessage: jest.fn(),
    updateFlags: jest.fn(),
    searchMessages: jest.fn(),
}));

// Mock SMTP client
jest.mock('@/lib/mail/smtp-client', () => ({
    sendEmail: jest.fn(),
    replyToEmail: jest.fn(),
    forwardEmail: jest.fn(),
}));

// Mock credentials
jest.mock('@/lib/mail/credentials', () => ({
    getAllEmailCredentials: jest.fn(),
    saveEmailCredentials: jest.fn(),
    deleteEmailCredentials: jest.fn(),
    CLOUDRON_DEFAULTS: {
        imap_host: 'my.zattaradvogados.com',
        imap_port: 993,
        smtp_host: 'my.zattaradvogados.com',
        smtp_port: 587,
    },
}));

// Import mocked modules
import { authenticateMailRequest, errorResponse, handleMailError } from '@/lib/mail/api-helpers';
import { authenticateRequest } from '@/lib/auth/api-auth';
import * as imapClient from '@/lib/mail/imap-client';
import * as smtpClient from '@/lib/mail/smtp-client';
import * as credentials from '@/lib/mail/credentials';

// Import route handlers
import { GET as getFolders } from '../../../../api/mail/folders/route';
import { GET as getMessages } from '../../../../api/mail/messages/route';
import { POST as sendEmail } from '../../../../api/mail/messages/send/route';
import { POST as replyToEmail } from '../../../../api/mail/messages/reply/route';
import { POST as forwardEmail } from '../../../../api/mail/messages/forward/route';
import { GET as getCredentials, POST as saveCredentials, DELETE as deleteCredentials } from '../../../../api/mail/credentials/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createRequest(url: string, options: RequestInit = {}): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

function createJsonRequest(url: string, body: unknown, method = 'POST'): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const mockAuthResult = { usuarioId: 42, config: mockMailConfig };

const mockFolder = { name: 'INBOX', path: 'INBOX', total: 10, unread: 3 };

const mockMessagePreview = {
    uid: 1,
    messageId: '<msg-1@test.com>',
    from: { name: 'Sender', address: 'sender@test.com' },
    to: [{ name: 'Receiver', address: 'receiver@test.com' }],
    subject: 'Test Subject',
    preview: 'Preview text...',
    date: '2024-01-01T00:00:00Z',
    read: false,
    flagged: false,
    answered: false,
    folder: 'INBOX',
};

const mockFullMessage = {
    uid: 1,
    messageId: '<msg-1@test.com>',
    from: { name: 'Sender', address: 'sender@test.com' },
    to: [{ name: 'Receiver', address: 'receiver@test.com' }],
    cc: [],
    subject: 'Test Subject',
    text: 'Full message text',
    html: '<p>Full message</p>',
    date: '2024-01-01T00:00:00Z',
    flags: ['\\Seen'],
    folder: 'INBOX',
};

const mockCredential = {
    id: 1,
    usuario_id: 42,
    nome_conta: 'user@test.com',
    imap_host: 'imap.test.com',
    imap_port: 993,
    imap_user: 'user@test.com',
    imap_pass: 'secret',
    smtp_host: 'smtp.test.com',
    smtp_port: 587,
    smtp_user: 'user@test.com',
    smtp_pass: 'secret',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Mail API Route Handlers (Actions)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: authenticated with mail config
        (authenticateMailRequest as jest.Mock).mockResolvedValue(mockAuthResult);
        (authenticateRequest as jest.Mock).mockResolvedValue({
            authenticated: true,
            usuarioId: 42,
        });
    });

    // =========================================================================
    // GET /api/mail/folders
    // =========================================================================
    describe('GET /api/mail/folders', () => {
        it('deve listar pastas com sucesso', async () => {
            (imapClient.listFolders as jest.Mock).mockResolvedValue([mockFolder]);

            const req = createRequest('/api/mail/folders');
            const res = await getFolders(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.folders).toEqual([mockFolder]);
            expect(imapClient.listFolders).toHaveBeenCalledWith(mockMailConfig);
        });

        it('deve retornar erro quando não autenticado', async () => {
            const { NextResponse } = require('next/server');
            const unauthResponse = NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
            (authenticateMailRequest as jest.Mock).mockResolvedValue(unauthResponse);

            const req = createRequest('/api/mail/folders');
            const res = await getFolders(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.error).toBe('Não autenticado');
            expect(imapClient.listFolders).not.toHaveBeenCalled();
        });

        it('deve tratar erros do IMAP client', async () => {
            (imapClient.listFolders as jest.Mock).mockRejectedValue(new Error('IMAP connection failed'));

            const req = createRequest('/api/mail/folders');
            const res = await getFolders(req);

            expect(handleMailError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // GET /api/mail/messages
    // =========================================================================
    describe('GET /api/mail/messages', () => {
        it('deve listar mensagens com sucesso', async () => {
            const mockData = { data: [mockMessagePreview], total: 1, hasMore: false };
            (imapClient.listMessages as jest.Mock).mockResolvedValue(mockData);

            const req = createRequest('/api/mail/messages?folder=INBOX&page=1&limit=50');
            const res = await getMessages(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(imapClient.listMessages).toHaveBeenCalledWith(mockMailConfig, 'INBOX', 1, 50);
        });

        it('deve rejeitar request sem parâmetro folder (validação)', async () => {
            const req = createRequest('/api/mail/messages');
            const res = await getMessages(req);

            expect(errorResponse).toHaveBeenCalledWith("Parâmetro 'folder' é obrigatório", 400);
            expect(imapClient.listMessages).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            const { NextResponse } = require('next/server');
            (authenticateMailRequest as jest.Mock).mockResolvedValue(
                NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
            );

            const req = createRequest('/api/mail/messages?folder=INBOX');
            const res = await getMessages(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(imapClient.listMessages).not.toHaveBeenCalled();
        });

        it('deve usar valores padrão para page e limit', async () => {
            const mockData = { data: [], total: 0, hasMore: false };
            (imapClient.listMessages as jest.Mock).mockResolvedValue(mockData);

            const req = createRequest('/api/mail/messages?folder=INBOX');
            const res = await getMessages(req);

            expect(imapClient.listMessages).toHaveBeenCalledWith(mockMailConfig, 'INBOX', 1, 50);
        });
    });

    // =========================================================================
    // POST /api/mail/messages/send
    // =========================================================================
    describe('POST /api/mail/messages/send', () => {
        const validSendBody = {
            to: ['dest@test.com'],
            subject: 'Test Subject',
            text: 'Test body',
        };

        it('deve enviar email com sucesso', async () => {
            (smtpClient.sendEmail as jest.Mock).mockResolvedValue(undefined);

            const req = createJsonRequest('/api/mail/messages/send', validSendBody);
            const res = await sendEmail(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(smtpClient.sendEmail).toHaveBeenCalledWith(mockMailConfig, validSendBody);
        });

        it('deve rejeitar request sem campo to (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/send', {
                subject: 'Test',
                text: 'Body',
            });
            const res = await sendEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campo 'to' é obrigatório", 400);
            expect(smtpClient.sendEmail).not.toHaveBeenCalled();
        });

        it('deve rejeitar request com to vazio (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/send', {
                to: [],
                subject: 'Test',
                text: 'Body',
            });
            const res = await sendEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campo 'to' é obrigatório", 400);
            expect(smtpClient.sendEmail).not.toHaveBeenCalled();
        });

        it('deve rejeitar request sem subject (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/send', {
                to: ['dest@test.com'],
                text: 'Body',
            });
            const res = await sendEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campo 'subject' é obrigatório", 400);
            expect(smtpClient.sendEmail).not.toHaveBeenCalled();
        });

        it('deve rejeitar request sem text (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/send', {
                to: ['dest@test.com'],
                subject: 'Test',
            });
            const res = await sendEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campo 'text' é obrigatório", 400);
            expect(smtpClient.sendEmail).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            const { NextResponse } = require('next/server');
            (authenticateMailRequest as jest.Mock).mockResolvedValue(
                NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
            );

            const req = createJsonRequest('/api/mail/messages/send', validSendBody);
            const res = await sendEmail(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(smtpClient.sendEmail).not.toHaveBeenCalled();
        });

        it('deve tratar erros do SMTP client', async () => {
            (smtpClient.sendEmail as jest.Mock).mockRejectedValue(new Error('SMTP error'));

            const req = createJsonRequest('/api/mail/messages/send', validSendBody);
            const res = await sendEmail(req);

            expect(handleMailError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // =========================================================================
    // POST /api/mail/messages/reply
    // =========================================================================
    describe('POST /api/mail/messages/reply', () => {
        const validReplyBody = { uid: 1, folder: 'INBOX', text: 'Reply text', replyAll: false };

        it('deve responder email com sucesso', async () => {
            (imapClient.getMessage as jest.Mock).mockResolvedValue(mockFullMessage);
            (smtpClient.replyToEmail as jest.Mock).mockResolvedValue(undefined);

            const req = createJsonRequest('/api/mail/messages/reply', validReplyBody);
            const res = await replyToEmail(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(imapClient.getMessage).toHaveBeenCalledWith(mockMailConfig, 'INBOX', 1);
            expect(smtpClient.replyToEmail).toHaveBeenCalledWith(
                mockMailConfig, mockFullMessage, 'Reply text', false, undefined
            );
        });

        it('deve rejeitar request sem uid (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/reply', {
                folder: 'INBOX',
                text: 'Reply',
            });
            const res = await replyToEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campos 'uid', 'folder' e 'text' são obrigatórios", 400);
            expect(imapClient.getMessage).not.toHaveBeenCalled();
        });

        it('deve rejeitar request sem folder (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/reply', {
                uid: 1,
                text: 'Reply',
            });
            const res = await replyToEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campos 'uid', 'folder' e 'text' são obrigatórios", 400);
        });

        it('deve rejeitar request sem text (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/reply', {
                uid: 1,
                folder: 'INBOX',
            });
            const res = await replyToEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campos 'uid', 'folder' e 'text' são obrigatórios", 400);
        });

        it('deve retornar 404 quando mensagem original não encontrada', async () => {
            (imapClient.getMessage as jest.Mock).mockResolvedValue(null);

            const req = createJsonRequest('/api/mail/messages/reply', validReplyBody);
            const res = await replyToEmail(req);

            expect(errorResponse).toHaveBeenCalledWith('Mensagem original não encontrada', 404);
            expect(smtpClient.replyToEmail).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            const { NextResponse } = require('next/server');
            (authenticateMailRequest as jest.Mock).mockResolvedValue(
                NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
            );

            const req = createJsonRequest('/api/mail/messages/reply', validReplyBody);
            const res = await replyToEmail(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(imapClient.getMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // POST /api/mail/messages/forward
    // =========================================================================
    describe('POST /api/mail/messages/forward', () => {
        const validForwardBody = {
            uid: 1,
            folder: 'INBOX',
            to: ['forward@test.com'],
            text: 'Forward text',
        };

        it('deve encaminhar email com sucesso', async () => {
            (imapClient.getMessage as jest.Mock).mockResolvedValue(mockFullMessage);
            (smtpClient.forwardEmail as jest.Mock).mockResolvedValue(undefined);

            const req = createJsonRequest('/api/mail/messages/forward', validForwardBody);
            const res = await forwardEmail(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(imapClient.getMessage).toHaveBeenCalledWith(mockMailConfig, 'INBOX', 1);
            expect(smtpClient.forwardEmail).toHaveBeenCalledWith(
                mockMailConfig, mockFullMessage, ['forward@test.com'], 'Forward text', undefined
            );
        });

        it('deve rejeitar request sem uid (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/forward', {
                folder: 'INBOX',
                to: ['forward@test.com'],
            });
            const res = await forwardEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campos 'uid', 'folder' e 'to' são obrigatórios", 400);
            expect(imapClient.getMessage).not.toHaveBeenCalled();
        });

        it('deve rejeitar request com to vazio (validação)', async () => {
            const req = createJsonRequest('/api/mail/messages/forward', {
                uid: 1,
                folder: 'INBOX',
                to: [],
            });
            const res = await forwardEmail(req);

            expect(errorResponse).toHaveBeenCalledWith("Campos 'uid', 'folder' e 'to' são obrigatórios", 400);
        });

        it('deve retornar 404 quando mensagem original não encontrada', async () => {
            (imapClient.getMessage as jest.Mock).mockResolvedValue(null);

            const req = createJsonRequest('/api/mail/messages/forward', validForwardBody);
            const res = await forwardEmail(req);

            expect(errorResponse).toHaveBeenCalledWith('Mensagem original não encontrada', 404);
            expect(smtpClient.forwardEmail).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            const { NextResponse } = require('next/server');
            (authenticateMailRequest as jest.Mock).mockResolvedValue(
                NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
            );

            const req = createJsonRequest('/api/mail/messages/forward', validForwardBody);
            const res = await forwardEmail(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(imapClient.getMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // GET /api/mail/credentials
    // =========================================================================
    describe('GET /api/mail/credentials', () => {
        it('deve listar credenciais com senhas mascaradas', async () => {
            (credentials.getAllEmailCredentials as jest.Mock).mockResolvedValue([mockCredential]);

            const req = createRequest('/api/mail/credentials');
            const res = await getCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.configured).toBe(true);
            expect(data.accounts).toHaveLength(1);
            expect(data.accounts[0].imap_pass).toBe('••••••••');
            expect(data.accounts[0].smtp_pass).toBe('••••••••');
            expect(credentials.getAllEmailCredentials).toHaveBeenCalledWith(42);
        });

        it('deve retornar configured=false quando sem credenciais', async () => {
            (credentials.getAllEmailCredentials as jest.Mock).mockResolvedValue([]);

            const req = createRequest('/api/mail/credentials');
            const res = await getCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.configured).toBe(false);
            expect(data.accounts).toEqual([]);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue({
                authenticated: false,
                usuarioId: undefined,
            });

            const req = createRequest('/api/mail/credentials');
            const res = await getCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.error).toBe('Não autenticado');
            expect(credentials.getAllEmailCredentials).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // POST /api/mail/credentials
    // =========================================================================
    describe('POST /api/mail/credentials', () => {
        const validCredInput = {
            imap_user: 'user@test.com',
            imap_pass: 'pass123',
            smtp_user: 'user@test.com',
            smtp_pass: 'pass123',
        };

        it('deve salvar credenciais com sucesso', async () => {
            (credentials.saveEmailCredentials as jest.Mock).mockResolvedValue(mockCredential);

            const req = createJsonRequest('/api/mail/credentials', validCredInput);
            const res = await saveCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.account.imap_pass).toBe('••••••••');
            expect(credentials.saveEmailCredentials).toHaveBeenCalledWith(42, validCredInput);
        });

        it('deve rejeitar request sem campos obrigatórios (validação)', async () => {
            const req = createJsonRequest('/api/mail/credentials', {
                imap_user: 'user@test.com',
            });
            const res = await saveCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toContain('obrigatórios');
            expect(credentials.saveEmailCredentials).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue({
                authenticated: false,
                usuarioId: undefined,
            });

            const req = createJsonRequest('/api/mail/credentials', validCredInput);
            const res = await saveCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.error).toBe('Não autenticado');
            expect(credentials.saveEmailCredentials).not.toHaveBeenCalled();
        });

        it('deve tratar erros do service de credenciais', async () => {
            (credentials.saveEmailCredentials as jest.Mock).mockRejectedValue(
                new Error('Erro ao salvar credenciais')
            );

            const req = createJsonRequest('/api/mail/credentials', validCredInput);
            const res = await saveCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(500);
            expect(data.error).toBe('Erro ao salvar credenciais');
        });
    });

    // =========================================================================
    // DELETE /api/mail/credentials
    // =========================================================================
    describe('DELETE /api/mail/credentials', () => {
        it('deve deletar credenciais com sucesso', async () => {
            (credentials.deleteEmailCredentials as jest.Mock).mockResolvedValue(undefined);

            const req = createRequest('/api/mail/credentials?accountId=1', { method: 'DELETE' });
            const res = await deleteCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(credentials.deleteEmailCredentials).toHaveBeenCalledWith(42, 1);
        });

        it('deve deletar todas as credenciais quando sem accountId', async () => {
            (credentials.deleteEmailCredentials as jest.Mock).mockResolvedValue(undefined);

            const req = createRequest('/api/mail/credentials', { method: 'DELETE' });
            const res = await deleteCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(credentials.deleteEmailCredentials).toHaveBeenCalledWith(42, undefined);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue({
                authenticated: false,
                usuarioId: undefined,
            });

            const req = createRequest('/api/mail/credentials', { method: 'DELETE' });
            const res = await deleteCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(401);
            expect(data.error).toBe('Não autenticado');
            expect(credentials.deleteEmailCredentials).not.toHaveBeenCalled();
        });

        it('deve tratar erros do service de credenciais', async () => {
            (credentials.deleteEmailCredentials as jest.Mock).mockRejectedValue(
                new Error('Erro ao remover credenciais')
            );

            const req = createRequest('/api/mail/credentials?accountId=1', { method: 'DELETE' });
            const res = await deleteCredentials(req);
            const data = await res.json();

            expect(res.status).toBe(500);
            expect(data.error).toBe('Erro ao remover credenciais');
        });
    });
});
