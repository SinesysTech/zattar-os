/**
 * Tests for Cargos Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, authorization, and cache revalidation.
 * Cargos actions use authenticateRequest from @/lib/auth and checkPermission from @/lib/auth/authorization
 * directly (not via authenticatedAction/safe-action).
 *
 * Each action:
 * 1. Calls authenticateRequest() for auth
 * 2. Calls checkPermission() for authorization
 * 3. Validates input with Zod schema (where applicable)
 * 4. Delegates to service layer
 * 5. Returns ActionResponse<T> ({ success, data?, error? })
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
    nomeCompleto: 'Teste Cargos',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock authorization
jest.mock('@/lib/auth/authorization', () => ({
    checkPermission: jest.fn(async () => true),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarCargos: jest.fn(),
    buscarCargo: jest.fn(),
    criarCargo: jest.fn(),
    atualizarCargo: jest.fn(),
    deletarCargo: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';

// Import REAL actions (after mocks)
import {
    actionListarCargos,
    actionBuscarCargo,
    actionCriarCargo,
    actionAtualizarCargo,
    actionDeletarCargo,
} from '../../actions/cargos-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockCargo = {
    id: 1,
    nome: 'Advogado Sênior',
    descricao: 'Cargo de advogado sênior',
    ativo: true,
    created_by: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
};

const mockListResult = {
    items: [mockCargo],
    paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
};

describe('Cargos Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (checkPermission as jest.Mock).mockResolvedValue(true);
    });

    // =========================================================================
    // actionListarCargos
    // =========================================================================
    describe('actionListarCargos', () => {
        it('deve listar cargos com sucesso', async () => {
            (mockService.listarCargos as jest.Mock).mockResolvedValue(mockListResult);

            const result = await actionListarCargos({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockListResult);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalled();
            expect(mockService.listarCargos).toHaveBeenCalledWith({});
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionListarCargos({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.listarCargos).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionListarCargos({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
            expect(mockService.listarCargos).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarCargos as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarCargos({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarCargo
    // =========================================================================
    describe('actionBuscarCargo', () => {
        it('deve buscar cargo por ID com sucesso', async () => {
            (mockService.buscarCargo as jest.Mock).mockResolvedValue(mockCargo);

            const result = await actionBuscarCargo(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCargo);
            expect(mockService.buscarCargo).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando cargo não encontrado', async () => {
            (mockService.buscarCargo as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarCargo(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cargo não encontrado');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.buscarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionBuscarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarCargo as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionBuscarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionCriarCargo
    // =========================================================================
    describe('actionCriarCargo', () => {
        const validInput = { nome: 'Novo Cargo', descricao: 'Descrição do cargo' };

        it('deve criar cargo com sucesso e revalidar cache', async () => {
            (mockService.criarCargo as jest.Mock).mockResolvedValue({ ...mockCargo, nome: 'Novo Cargo' });

            const result = await actionCriarCargo(validInput);

            expect(result.success).toBe(true);
            expect(mockService.criarCargo).toHaveBeenCalledWith(validInput, mockUser.id);
            expect(revalidatePath).toHaveBeenCalledWith('/app/usuarios/cargos');
            expect(revalidatePath).toHaveBeenCalledWith('/app/usuarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarCargo(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.criarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionCriarCargo(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve rejeitar input com nome curto (validação Zod)', async () => {
            const result = await actionCriarCargo({ nome: 'AB' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('mínimo 3 caracteres');
            expect(mockService.criarCargo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com nome vazio (validação Zod)', async () => {
            const result = await actionCriarCargo({ nome: '' });

            expect(result.success).toBe(false);
            expect(mockService.criarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarCargo as jest.Mock).mockRejectedValue(
                new Error('Cargo com nome "Novo Cargo" já existe.')
            );

            const result = await actionCriarCargo(validInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('já existe');
        });
    });

    // =========================================================================
    // actionAtualizarCargo
    // =========================================================================
    describe('actionAtualizarCargo', () => {
        const validUpdate = { nome: 'Cargo Atualizado' };

        it('deve atualizar cargo com sucesso e revalidar cache', async () => {
            (mockService.atualizarCargo as jest.Mock).mockResolvedValue({
                ...mockCargo,
                nome: 'Cargo Atualizado',
            });

            const result = await actionAtualizarCargo(1, validUpdate);

            expect(result.success).toBe(true);
            expect(mockService.atualizarCargo).toHaveBeenCalledWith(1, validUpdate);
            expect(revalidatePath).toHaveBeenCalledWith('/app/usuarios/cargos');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionAtualizarCargo(1, validUpdate);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.atualizarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionAtualizarCargo(1, validUpdate);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve aceitar atualização parcial (apenas ativo)', async () => {
            (mockService.atualizarCargo as jest.Mock).mockResolvedValue({
                ...mockCargo,
                ativo: false,
            });

            const result = await actionAtualizarCargo(1, { ativo: false });

            expect(result.success).toBe(true);
            expect(mockService.atualizarCargo).toHaveBeenCalledWith(1, { ativo: false });
        });

        it('deve rejeitar nome curto na atualização (validação Zod)', async () => {
            const result = await actionAtualizarCargo(1, { nome: 'AB' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('mínimo 3 caracteres');
            expect(mockService.atualizarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarCargo as jest.Mock).mockRejectedValue(
                new Error('Cargo não encontrado')
            );

            const result = await actionAtualizarCargo(999, validUpdate);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cargo não encontrado');
        });
    });

    // =========================================================================
    // actionDeletarCargo
    // =========================================================================
    describe('actionDeletarCargo', () => {
        it('deve deletar cargo com sucesso e revalidar cache', async () => {
            (mockService.deletarCargo as jest.Mock).mockResolvedValue(undefined);

            const result = await actionDeletarCargo(1);

            expect(result.success).toBe(true);
            expect(mockService.deletarCargo).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/usuarios/cargos');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionDeletarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.deletarCargo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionDeletarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletarCargo as jest.Mock).mockRejectedValue(
                new Error('Cargo não encontrado')
            );

            const result = await actionDeletarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cargo não encontrado');
        });

        it('deve tratar erro de cargo com usuários associados (JSON error)', async () => {
            const cargoComUsuariosError = {
                error: 'Não é possível excluir cargo com usuários associados',
                cargoId: 1,
                cargoNome: 'Advogado Sênior',
                totalUsuarios: 2,
                usuarios: [
                    { id: 10, nome_completo: 'João Silva', email_corporativo: 'joao@zattar.com' },
                    { id: 11, nome_completo: 'Maria Santos', email_corporativo: 'maria@zattar.com' },
                ],
            };
            (mockService.deletarCargo as jest.Mock).mockRejectedValue(
                new Error(JSON.stringify(cargoComUsuariosError))
            );

            const result = await actionDeletarCargo(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não é possível excluir cargo com usuários associados');
            expect(result.errorDetail).toEqual(cargoComUsuariosError);
        });
    });
});
