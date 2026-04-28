import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import type { EmailCredentials } from '../../domain';

// Helper to create a fresh chainable mock for each test
function createChainableMock(terminalResult: { data?: unknown; error: unknown | null }) {
    const chain: Record<string, jest.Mock> = {};
    const returnChain = () => chain;

    chain.from = jest.fn(returnChain);
    chain.select = jest.fn(returnChain);
    chain.insert = jest.fn(returnChain);
    chain.update = jest.fn(returnChain);
    chain.delete = jest.fn(returnChain);
    chain.eq = jest.fn(returnChain);
    chain.order = jest.fn(returnChain);
    chain.limit = jest.fn(returnChain);
    chain.single = jest.fn().mockResolvedValue(terminalResult);

    // Make the chain itself thenable so `await chain` resolves
    chain.then = jest.fn((resolve: (v: unknown) => void) => {
        return Promise.resolve(terminalResult).then(resolve);
    });

    return chain;
}

let mockDb: ReturnType<typeof createChainableMock>;

jest.mock('@/lib/supabase/service-client', () => ({
    createServiceClient: jest.fn(() => mockDb),
}));

const USUARIO_ID = 42;
const MOCK_CRED: EmailCredentials = {
    id: 1,
    usuario_id: USUARIO_ID,
    nome_conta: 'Test Account',
    imap_host: 'imap.test.com',
    imap_port: 993,
    imap_user: 'user@test.com',
    imap_pass: 'pass123',
    smtp_host: 'smtp.test.com',
    smtp_port: 587,
    smtp_user: 'user@test.com',
    smtp_pass: 'pass123',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
};

describe('Mail Repository', () => {
    describe('deve exportar as funções e constantes esperadas do repositório', () => {
        it('verifica exports', () => {
            const businessKeys = Object.keys(repository).filter(
                (k) => !['__esModule', 'default'].includes(k),
            );
            expect(businessKeys).toEqual(
                expect.arrayContaining([
                    'CLOUDRON_DEFAULTS',
                    'getEmailCredentialsById',
                    'getEmailCredentials',
                    'getAllEmailCredentials',
                    'credentialsToMailConfig',
                    'getUserMailConfig',
                    'saveEmailCredentials',
                    'deleteEmailCredentials',
                ]),
            );
            expect(businessKeys).toHaveLength(8);
        });
    });

    // We'll fill in the rest of the tests here
});

    describe('getEmailCredentialsById', () => {
        it('deve retornar a credencial se existir', async () => {
            mockDb = createChainableMock({ data: MOCK_CRED, error: null });

            const result = await repository.getEmailCredentialsById(1);

            expect(result).toEqual(MOCK_CRED);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.select).toHaveBeenCalledWith('*');
            expect(mockDb.eq).toHaveBeenCalledWith('id', 1);
            expect(mockDb.single).toHaveBeenCalled();
        });

        it('deve retornar null se ocorrer erro ou não encontrar', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Not found' } });

            const result = await repository.getEmailCredentialsById(999);

            expect(result).toBeNull();
        });
    });

    describe('getEmailCredentials', () => {
        it('deve retornar a credencial específica com accountId', async () => {
            mockDb = createChainableMock({ data: MOCK_CRED, error: null });

            const result = await repository.getEmailCredentials(USUARIO_ID, 1);

            expect(result).toEqual(MOCK_CRED);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.eq).toHaveBeenCalledWith('id', 1);
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
            expect(mockDb.eq).toHaveBeenCalledWith('active', true);
        });

        it('deve retornar a primeira credencial ativa sem accountId', async () => {
            mockDb = createChainableMock({ data: MOCK_CRED, error: null });

            const result = await repository.getEmailCredentials(USUARIO_ID);

            expect(result).toEqual(MOCK_CRED);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
            expect(mockDb.eq).toHaveBeenCalledWith('active', true);
            expect(mockDb.order).toHaveBeenCalledWith('created_at', { ascending: true });
            expect(mockDb.limit).toHaveBeenCalledWith(1);
        });

        it('deve retornar null se ocorrer erro', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Error' } });

            const result = await repository.getEmailCredentials(USUARIO_ID);

            expect(result).toBeNull();
        });
    });

    describe('getAllEmailCredentials', () => {
        it('deve listar as credenciais do usuário', async () => {
            mockDb = createChainableMock({ data: [MOCK_CRED], error: null });

            const result = await repository.getAllEmailCredentials(USUARIO_ID);

            expect(result).toEqual([MOCK_CRED]);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
            expect(mockDb.order).toHaveBeenCalledWith('created_at', { ascending: true });
        });

        it('deve retornar array vazio se ocorrer erro ou não houver credenciais', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Error' } });

            const result = await repository.getAllEmailCredentials(USUARIO_ID);

            expect(result).toEqual([]);
        });
    });

    describe('credentialsToMailConfig', () => {
        it('deve converter EmailCredentials para MailConfig', () => {
            const config = repository.credentialsToMailConfig(MOCK_CRED);

            expect(config).toEqual({
                imap: {
                    host: MOCK_CRED.imap_host,
                    port: MOCK_CRED.imap_port,
                    user: MOCK_CRED.imap_user,
                    pass: MOCK_CRED.imap_pass,
                },
                smtp: {
                    host: MOCK_CRED.smtp_host,
                    port: MOCK_CRED.smtp_port,
                    user: MOCK_CRED.smtp_user,
                    pass: MOCK_CRED.smtp_pass,
                },
            });
        });
    });

    describe('getUserMailConfig', () => {
        it('deve retornar a configuração de email do usuário', async () => {
            mockDb = createChainableMock({ data: MOCK_CRED, error: null });

            const config = await repository.getUserMailConfig(USUARIO_ID);

            expect(config).not.toBeNull();
            expect(config?.imap.host).toBe(MOCK_CRED.imap_host);
        });

        it('deve retornar null se usuário não tiver credenciais', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Not found' } });

            const config = await repository.getUserMailConfig(USUARIO_ID);

            expect(config).toBeNull();
        });
    });

    describe('saveEmailCredentials', () => {
        const insertInput = {
            imap_user: 'new@test.com',
            imap_pass: 'pass123',
            smtp_user: 'new@test.com',
            smtp_pass: 'pass123',
        };

        const updateInput = {
            id: 1,
            nome_conta: 'Updated Account',
            ...insertInput
        };

        it('deve inserir nova credencial se id não for fornecido', async () => {
            const savedCred = { ...MOCK_CRED, ...insertInput, id: 2 };
            mockDb = createChainableMock({ data: savedCred, error: null });

            const result = await repository.saveEmailCredentials(USUARIO_ID, insertInput);

            expect(result).toEqual(savedCred);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    usuario_id: USUARIO_ID,
                    nome_conta: 'new@test.com', // fallback from imap_user
                    imap_user: 'new@test.com',
                    imap_host: repository.CLOUDRON_DEFAULTS.imap_host, // used default
                })
            );
        });

        it('deve atualizar credencial existente se id for fornecido', async () => {
            const updatedCred = { ...MOCK_CRED, nome_conta: 'Updated Account' };
            mockDb = createChainableMock({ data: updatedCred, error: null });

            const result = await repository.saveEmailCredentials(USUARIO_ID, updateInput);

            expect(result).toEqual(updatedCred);
            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.update).toHaveBeenCalledWith(
                expect.objectContaining({ nome_conta: 'Updated Account' })
            );
            expect(mockDb.eq).toHaveBeenCalledWith('id', 1);
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
        });

        it('deve lançar erro se insert/update falhar', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Database error' } });

            await expect(
                repository.saveEmailCredentials(USUARIO_ID, insertInput)
            ).rejects.toThrow('Erro ao salvar credenciais: Database error');
        });
    });

    describe('deleteEmailCredentials', () => {
        it('deve deletar todas as credenciais do usuário se accountId não for fornecido', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            await repository.deleteEmailCredentials(USUARIO_ID);

            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.delete).toHaveBeenCalled();
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
            // Verify it was only called once with usuario_id
            expect(mockDb.eq.mock.calls.length).toBe(1);
        });

        it('deve deletar credencial específica se accountId for fornecido', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            await repository.deleteEmailCredentials(USUARIO_ID, 1);

            expect(mockDb.from).toHaveBeenCalledWith('credenciais_email');
            expect(mockDb.delete).toHaveBeenCalled();
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
            expect(mockDb.eq).toHaveBeenCalledWith('id', 1);
            expect(mockDb.eq.mock.calls.length).toBe(2);
        });
    });
