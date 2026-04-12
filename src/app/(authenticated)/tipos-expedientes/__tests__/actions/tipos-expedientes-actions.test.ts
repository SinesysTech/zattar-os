/**
 * Tests for Tipos-Expedientes Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, and cache revalidation.
 * Tipos-expedientes actions use authenticateRequest from @/lib/auth directly.
 *
 * Actions:
 * - actionListarTiposExpedientes: no auth required, delegates to service.listar
 * - actionBuscarTipoExpediente: no auth required, delegates to service.buscar
 * - actionCriarTipoExpediente: auth required, FormData input, delegates to service.criar
 * - actionAtualizarTipoExpediente: auth required, id + FormData, delegates to service.atualizar
 * - actionDeletarTipoExpediente: auth required, id, delegates to service.deletar
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
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
    nomeCompleto: 'Teste Tipos Expedientes',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listar: jest.fn(),
    buscar: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';

// Import REAL actions (after mocks)
import {
    actionListarTiposExpedientes,
    actionBuscarTipoExpediente,
    actionCriarTipoExpediente,
    actionAtualizarTipoExpediente,
    actionDeletarTipoExpediente,
} from '../../actions/tipos-expedientes-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockTipoExpediente = {
    id: 1,
    tipoExpediente: 'Citação',
    createdBy: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const mockListResult = {
    data: [mockTipoExpediente],
    meta: { total: 1, pagina: 1, limite: 50, totalPaginas: 1 },
};

function createFormData(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        fd.set(key, value);
    }
    return fd;
}

describe('Tipos-Expedientes Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionListarTiposExpedientes
    // =========================================================================
    describe('actionListarTiposExpedientes', () => {
        it('deve listar tipos de expedientes com sucesso', async () => {
            (mockService.listar as jest.Mock).mockResolvedValue(mockListResult);

            const result = await actionListarTiposExpedientes({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockListResult);
            expect(mockService.listar).toHaveBeenCalledWith({});
        });

        it('deve listar sem parâmetros', async () => {
            (mockService.listar as jest.Mock).mockResolvedValue(mockListResult);

            const result = await actionListarTiposExpedientes();

            expect(result.success).toBe(true);
            expect(mockService.listar).toHaveBeenCalledWith(undefined);
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listar as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarTiposExpedientes({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });

        it('deve retornar mensagem genérica para erros não-Error', async () => {
            (mockService.listar as jest.Mock).mockRejectedValue('unknown');

            const result = await actionListarTiposExpedientes({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao listar tipos de expedientes');
        });
    });

    // =========================================================================
    // actionBuscarTipoExpediente
    // =========================================================================
    describe('actionBuscarTipoExpediente', () => {
        it('deve buscar tipo de expediente por ID com sucesso', async () => {
            (mockService.buscar as jest.Mock).mockResolvedValue(mockTipoExpediente);

            const result = await actionBuscarTipoExpediente(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTipoExpediente);
            expect(mockService.buscar).toHaveBeenCalledWith(1);
        });

        it('deve retornar null quando não encontrado', async () => {
            (mockService.buscar as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarTipoExpediente(999);

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscar as jest.Mock).mockRejectedValue(new Error('ID inválido fornecido'));

            const result = await actionBuscarTipoExpediente(-1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('ID inválido');
        });

        it('deve retornar mensagem genérica para erros não-Error', async () => {
            (mockService.buscar as jest.Mock).mockRejectedValue('unknown');

            const result = await actionBuscarTipoExpediente(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao buscar tipo de expediente');
        });
    });

    // =========================================================================
    // actionCriarTipoExpediente
    // =========================================================================
    describe('actionCriarTipoExpediente', () => {
        it('deve criar tipo de expediente com sucesso e revalidar cache', async () => {
            (mockService.criar as jest.Mock).mockResolvedValue(mockTipoExpediente);

            const fd = createFormData({ tipoExpediente: 'Citação' });
            const result = await actionCriarTipoExpediente(fd);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTipoExpediente);
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.criar).toHaveBeenCalledWith(
                { tipoExpediente: 'Citação' },
                mockUser.id,
            );
            expect(revalidatePath).toHaveBeenCalledWith('/app/tipos-expedientes');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const fd = createFormData({ tipoExpediente: 'Citação' });
            const result = await actionCriarTipoExpediente(fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Usuário não autenticado');
            expect(mockService.criar).not.toHaveBeenCalled();
        });

        it('deve rejeitar FormData sem tipoExpediente', async () => {
            const fd = new FormData();
            const result = await actionCriarTipoExpediente(fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nome do tipo de expediente é obrigatório');
            expect(mockService.criar).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criar as jest.Mock).mockRejectedValue(
                new Error('Tipo de expediente já cadastrado'),
            );

            const fd = createFormData({ tipoExpediente: 'Citação' });
            const result = await actionCriarTipoExpediente(fd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('já cadastrado');
        });

        it('deve retornar mensagem genérica para erros não-Error', async () => {
            (mockService.criar as jest.Mock).mockRejectedValue('unknown');

            const fd = createFormData({ tipoExpediente: 'Citação' });
            const result = await actionCriarTipoExpediente(fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao criar tipo de expediente');
        });
    });

    // =========================================================================
    // actionAtualizarTipoExpediente
    // =========================================================================
    describe('actionAtualizarTipoExpediente', () => {
        it('deve atualizar tipo de expediente com sucesso e revalidar cache', async () => {
            const updated = { ...mockTipoExpediente, tipoExpediente: 'Intimação' };
            (mockService.atualizar as jest.Mock).mockResolvedValue(updated);

            const fd = createFormData({ tipoExpediente: 'Intimação' });
            const result = await actionAtualizarTipoExpediente(1, fd);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(updated);
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.atualizar).toHaveBeenCalledWith(1, { tipoExpediente: 'Intimação' });
            expect(revalidatePath).toHaveBeenCalledWith('/app/tipos-expedientes');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const fd = createFormData({ tipoExpediente: 'Intimação' });
            const result = await actionAtualizarTipoExpediente(1, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Usuário não autenticado');
            expect(mockService.atualizar).not.toHaveBeenCalled();
        });

        it('deve rejeitar FormData sem tipoExpediente', async () => {
            const fd = new FormData();
            const result = await actionAtualizarTipoExpediente(1, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nome do tipo de expediente é obrigatório');
            expect(mockService.atualizar).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizar as jest.Mock).mockRejectedValue(
                new Error('Tipo de expediente não encontrado'),
            );

            const fd = createFormData({ tipoExpediente: 'Intimação' });
            const result = await actionAtualizarTipoExpediente(999, fd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('não encontrado');
        });

        it('deve retornar mensagem genérica para erros não-Error', async () => {
            (mockService.atualizar as jest.Mock).mockRejectedValue('unknown');

            const fd = createFormData({ tipoExpediente: 'Intimação' });
            const result = await actionAtualizarTipoExpediente(1, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao atualizar tipo de expediente');
        });
    });

    // =========================================================================
    // actionDeletarTipoExpediente
    // =========================================================================
    describe('actionDeletarTipoExpediente', () => {
        it('deve deletar tipo de expediente com sucesso e revalidar cache', async () => {
            (mockService.deletar as jest.Mock).mockResolvedValue(undefined);

            const result = await actionDeletarTipoExpediente(1);

            expect(result.success).toBe(true);
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.deletar).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tipos-expedientes');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionDeletarTipoExpediente(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Usuário não autenticado');
            expect(mockService.deletar).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletar as jest.Mock).mockRejectedValue(
                new Error('Tipo de expediente está em uso e não pode ser excluído'),
            );

            const result = await actionDeletarTipoExpediente(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('está em uso');
        });

        it('deve retornar mensagem genérica para erros não-Error', async () => {
            (mockService.deletar as jest.Mock).mockRejectedValue('unknown');

            const result = await actionDeletarTipoExpediente(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao deletar tipo de expediente');
        });
    });
});
