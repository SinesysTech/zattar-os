/**
 * Tests for Peças Jurídicas Server Actions
 *
 * Tests real exported actions with mocked service layer, DB client, auth, and cache revalidation.
 *
 * The pecas-juridicas module has two action files:
 * 1. pecas-modelos-actions.ts — CRUD actions for peça modelos using service layer
 *    Uses authenticateRequest for auth on create action.
 * 2. gerar-peca-actions.ts — Actions for generating peças from contratos
 *    Uses authenticateRequest for auth and createDbClient for context queries.
 *
 * Each action:
 * 1. Optionally calls authenticateRequest() for auth
 * 2. Delegates to service layer (or queries DB directly for context)
 * 3. Returns ActionResult<T> ({ success, data, message } | { success, error, message })
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
jest.mock('next/cache');
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Mock auth
const mockUser = {
    id: 1,
    nomeCompleto: 'Teste Pecas',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    buscarPecaModelo: jest.fn(),
    listarPecasModelos: jest.fn(),
    criarPecaModelo: jest.fn(),
    atualizarPecaModelo: jest.fn(),
    deletarPecaModelo: jest.fn(),
    gerarPecaDeContrato: jest.fn(),
    previewGeracaoPeca: jest.fn(),
    listarDocumentosDoContrato: jest.fn(),
    desvincularDocumentoDoContrato: jest.fn(),
    vincularDocumentoAoContrato: jest.fn(),
    desvincularItemDoContrato: jest.fn(),
}));

// Mock Supabase client (used by actionBuscarContextoContrato)
const mockSingle = jest.fn();
const _mockMaybeSingle = jest.fn();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn(() => ({
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    single: mockSingle,
}));

// Chain returns for fluent API
mockSelect.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle });
mockEq.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle, in: mockIn });

jest.mock('@/lib/supabase', () => ({
    createDbClient: jest.fn(() => ({ from: mockFrom })),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';

// Import REAL actions (after mocks)
import {
    actionBuscarPecaModelo,
    actionListarPecasModelos,
    actionCriarPecaModelo,
    actionAtualizarPecaModelo,
    actionDeletarPecaModelo,
    actionGetTiposPecaOptions,
} from '../../actions/pecas-modelos-actions';

import {
    actionBuscarContextoContrato,
    actionListarDocumentosDoContrato,
    actionDesvincularDocumentoDoContrato,
    actionVincularArquivoAoContrato,
    actionDesvincularItemDoContrato,
    actionGerarPecaDeContrato,
} from '../../actions/gerar-peca-actions';

// Import mocked service
import * as mockService from '../../service';


// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockPecaModelo = {
    id: 1,
    titulo: 'Petição Inicial Trabalhista',
    descricao: 'Modelo padrão de petição inicial',
    tipoPeca: 'peticao_inicial' as const,
    conteudo: [{ type: 'paragraph', children: [{ text: 'Conteúdo' }] }],
    placeholdersDefinidos: ['{{AUTOR_NOME}}'],
    visibilidade: 'privado' as const,
    segmentoId: null,
    criadoPor: 1,
    ativo: true,
    usoCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const mockPaginatedModelos = {
    data: [mockPecaModelo],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
};

const mockContratoDocumento = {
    id: 1,
    contratoId: 10,
    documentoId: 100,
    arquivoId: null,
    geradoDeModeloId: 1,
    tipoPeca: 'peticao_inicial' as const,
    observacoes: null,
    createdBy: 1,
    createdAt: '2025-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests — Peças Modelos Actions
// ---------------------------------------------------------------------------
describe('Peças Modelos Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionBuscarPecaModelo
    // =========================================================================
    describe('actionBuscarPecaModelo', () => {
        it('deve buscar modelo por ID com sucesso', async () => {
            (mockService.buscarPecaModelo as jest.Mock).mockResolvedValue({
                success: true,
                data: mockPecaModelo,
            });

            const result = await actionBuscarPecaModelo(1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockPecaModelo);
            }
            expect(mockService.buscarPecaModelo).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.buscarPecaModelo as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'ID do modelo inválido' },
            });

            const result = await actionBuscarPecaModelo(-1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('VALIDATION_ERROR');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.buscarPecaModelo as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionBuscarPecaModelo(1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionListarPecasModelos
    // =========================================================================
    describe('actionListarPecasModelos', () => {
        it('deve listar modelos com sucesso', async () => {
            (mockService.listarPecasModelos as jest.Mock).mockResolvedValue({
                success: true,
                data: mockPaginatedModelos,
            });

            const params = { page: 1, pageSize: 10 };
            const result = await actionListarPecasModelos(params);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockPaginatedModelos);
            }
            expect(mockService.listarPecasModelos).toHaveBeenCalledWith(params);
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarPecasModelos as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Erro no banco' },
            });

            const result = await actionListarPecasModelos({});

            expect(result.success).toBe(false);
        });

        it('deve tratar exceção do service', async () => {
            (mockService.listarPecasModelos as jest.Mock).mockRejectedValue(
                new Error('Connection refused')
            );

            const result = await actionListarPecasModelos({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Connection refused');
            }
        });
    });

    // =========================================================================
    // actionCriarPecaModelo
    // =========================================================================
    describe('actionCriarPecaModelo', () => {
        const validInput = {
            titulo: 'Novo Modelo',
            tipoPeca: 'contestacao' as const,
            conteudo: [{ type: 'paragraph', children: [{ text: 'Texto' }] }],
        };

        it('deve criar modelo com sucesso e revalidar cache', async () => {
            (mockService.criarPecaModelo as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockPecaModelo, titulo: 'Novo Modelo' },
            });

            const result = await actionCriarPecaModelo(validInput);

            expect(result.success).toBe(true);
            expect(mockService.criarPecaModelo).toHaveBeenCalledWith(validInput, mockUser.id);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/pecas-juridicas');
        });

        it('deve retornar erro quando service retorna validação inválida', async () => {
            (mockService.criarPecaModelo as jest.Mock).mockResolvedValue({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Dados inválidos',
                    details: { errors: { titulo: ['Título é obrigatório'] } },
                },
            });

            const result = await actionCriarPecaModelo({ titulo: '' } as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('VALIDATION_ERROR');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.criarPecaModelo as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionCriarPecaModelo(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionAtualizarPecaModelo
    // =========================================================================
    describe('actionAtualizarPecaModelo', () => {
        const validUpdate = { titulo: 'Modelo Atualizado' };

        it('deve atualizar modelo com sucesso e revalidar cache', async () => {
            (mockService.atualizarPecaModelo as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockPecaModelo, titulo: 'Modelo Atualizado' },
            });

            const result = await actionAtualizarPecaModelo(1, validUpdate);

            expect(result.success).toBe(true);
            expect(mockService.atualizarPecaModelo).toHaveBeenCalledWith(1, validUpdate);
            expect(revalidatePath).toHaveBeenCalledWith('/app/pecas-juridicas');
            expect(revalidatePath).toHaveBeenCalledWith('/app/pecas-juridicas/1');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarPecaModelo as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Modelo não encontrado' },
            });

            const result = await actionAtualizarPecaModelo(999, validUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('NOT_FOUND');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.atualizarPecaModelo as jest.Mock).mockRejectedValue(
                new Error('Timeout')
            );

            const result = await actionAtualizarPecaModelo(1, validUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Timeout');
            }
        });
    });

    // =========================================================================
    // actionDeletarPecaModelo
    // =========================================================================
    describe('actionDeletarPecaModelo', () => {
        it('deve deletar modelo com sucesso e revalidar cache', async () => {
            (mockService.deletarPecaModelo as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            const result = await actionDeletarPecaModelo(1);

            expect(result.success).toBe(true);
            expect(mockService.deletarPecaModelo).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/pecas-juridicas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletarPecaModelo as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Modelo não encontrado' },
            });

            const result = await actionDeletarPecaModelo(999);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('NOT_FOUND');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.deletarPecaModelo as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionDeletarPecaModelo(1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionGetTiposPecaOptions
    // =========================================================================
    describe('actionGetTiposPecaOptions', () => {
        it('deve retornar opções de tipos de peça', async () => {
            const result = await actionGetTiposPecaOptions();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBeGreaterThan(0);
                expect(result.data[0]).toHaveProperty('value');
                expect(result.data[0]).toHaveProperty('label');
                // Verify known types are present
                const values = result.data.map((o) => o.value);
                expect(values).toContain('peticao_inicial');
                expect(values).toContain('contestacao');
                expect(values).toContain('outro');
            }
        });
    });
});


// ---------------------------------------------------------------------------
// Tests — Gerar Peça Actions
// ---------------------------------------------------------------------------
describe('Gerar Peça Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionBuscarContextoContrato
    // =========================================================================
    describe('actionBuscarContextoContrato', () => {
        it('deve retornar erro quando contrato não é encontrado', async () => {
            mockEq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            });

            const result = await actionBuscarContextoContrato(999);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('NOT_FOUND');
            }
        });

        it('deve tratar exceção inesperada', async () => {
            mockFrom.mockImplementationOnce(() => {
                throw new Error('Connection error');
            });

            const result = await actionBuscarContextoContrato(1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Connection error');
            }
        });
    });

    // =========================================================================
    // actionListarDocumentosDoContrato
    // =========================================================================
    describe('actionListarDocumentosDoContrato', () => {
        it('deve listar documentos com sucesso', async () => {
            const mockPaginated = {
                data: [mockContratoDocumento],
                total: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
            };
            (mockService.listarDocumentosDoContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: mockPaginated,
            });

            const params = { contratoId: 10, page: 1, pageSize: 10 };
            const result = await actionListarDocumentosDoContrato(params);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockPaginated);
            }
            expect(mockService.listarDocumentosDoContrato).toHaveBeenCalledWith(params);
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarDocumentosDoContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'ID do contrato inválido' },
            });

            const result = await actionListarDocumentosDoContrato({ contratoId: -1 });

            expect(result.success).toBe(false);
        });

        it('deve tratar exceção do service', async () => {
            (mockService.listarDocumentosDoContrato as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionListarDocumentosDoContrato({ contratoId: 10 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionDesvincularDocumentoDoContrato
    // =========================================================================
    describe('actionDesvincularDocumentoDoContrato', () => {
        it('deve desvincular documento com sucesso e revalidar cache', async () => {
            (mockService.desvincularDocumentoDoContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            const result = await actionDesvincularDocumentoDoContrato(10, 100);

            expect(result.success).toBe(true);
            expect(mockService.desvincularDocumentoDoContrato).toHaveBeenCalledWith(10, 100);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.desvincularDocumentoDoContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'ID do contrato inválido' },
            });

            const result = await actionDesvincularDocumentoDoContrato(-1, 100);

            expect(result.success).toBe(false);
        });

        it('deve tratar exceção do service', async () => {
            (mockService.desvincularDocumentoDoContrato as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionDesvincularDocumentoDoContrato(10, 100);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionVincularArquivoAoContrato
    // =========================================================================
    describe('actionVincularArquivoAoContrato', () => {
        it('deve vincular arquivo com sucesso e revalidar cache', async () => {
            (mockService.vincularDocumentoAoContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: mockContratoDocumento,
            });

            const result = await actionVincularArquivoAoContrato({
                contratoId: 10,
                arquivoId: 50,
                tipoPeca: 'peticao_inicial',
            });

            expect(result.success).toBe(true);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(mockService.vincularDocumentoAoContrato).toHaveBeenCalledWith(
                { contratoId: 10, arquivoId: 50, tipoPeca: 'peticao_inicial' },
                mockUser.id
            );
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
            expect(revalidatePath).toHaveBeenCalledWith('/app/documentos');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionVincularArquivoAoContrato({
                contratoId: 10,
                arquivoId: 50,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('AUTH_ERROR');
            }
            expect(mockService.vincularDocumentoAoContrato).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.vincularDocumentoAoContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos' },
            });

            const result = await actionVincularArquivoAoContrato({
                contratoId: 10,
                arquivoId: 50,
            });

            expect(result.success).toBe(false);
        });

        it('deve tratar exceção do service', async () => {
            (mockService.vincularDocumentoAoContrato as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionVincularArquivoAoContrato({
                contratoId: 10,
                arquivoId: 50,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionDesvincularItemDoContrato
    // =========================================================================
    describe('actionDesvincularItemDoContrato', () => {
        it('deve desvincular item com sucesso e revalidar cache', async () => {
            (mockService.desvincularItemDoContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            const result = await actionDesvincularItemDoContrato(1, 10);

            expect(result.success).toBe(true);
            expect(mockService.desvincularItemDoContrato).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.desvincularItemDoContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'ID do vínculo inválido' },
            });

            const result = await actionDesvincularItemDoContrato(-1, 10);

            expect(result.success).toBe(false);
        });

        it('deve tratar exceção do service', async () => {
            (mockService.desvincularItemDoContrato as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionDesvincularItemDoContrato(1, 10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('DB error');
            }
        });
    });

    // =========================================================================
    // actionGerarPecaDeContrato
    // =========================================================================
    describe('actionGerarPecaDeContrato', () => {
        const validInput = {
            contratoId: 10,
            modeloId: 1,
            titulo: 'Petição Gerada',
        };

        it('deve tratar exceção inesperada', async () => {
            // Make actionBuscarContextoContrato throw
            mockFrom.mockImplementationOnce(() => {
                throw new Error('Connection error');
            });

            const result = await actionGerarPecaDeContrato(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Connection error');
            }
        });

        it('deve retornar erro quando contexto do contrato falha', async () => {
            // Simulate contrato not found
            mockEq.mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            });

            const result = await actionGerarPecaDeContrato(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('NOT_FOUND');
            }
        });
    });
});
