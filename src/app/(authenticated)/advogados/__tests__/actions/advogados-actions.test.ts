/**
 * Tests for Advogados Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, authorization, and cache revalidation.
 * Advogados actions use authenticateRequest from @/lib/auth/session and checkPermission from @/lib/auth/authorization.
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
    id: 42,
    nomeCompleto: 'Teste Advogados',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock authorization
jest.mock('@/lib/auth/authorization', () => ({
    checkPermission: jest.fn(async () => true),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarAdvogados: jest.fn(),
    buscarAdvogado: jest.fn(),
    criarAdvogado: jest.fn(),
    atualizarAdvogado: jest.fn(),
    listarCredenciais: jest.fn(),
    buscarCredencial: jest.fn(),
    criarCredencial: jest.fn(),
    atualizarCredencial: jest.fn(),
    criarCredenciaisEmLote: jest.fn(),
    atualizarStatusCredenciaisEmLote: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';

// Import REAL actions (after mocks)
import {
    actionListarAdvogados,
    actionBuscarAdvogado,
    actionCriarAdvogado,
    actionAtualizarAdvogado,
} from '../../actions/advogados-actions';

import {
    actionListarCredenciais,
    actionBuscarCredencial,
    actionCriarCredencial,
    actionAtualizarCredencial,
    actionCriarCredenciaisEmLote,
    actionAtualizarStatusCredenciaisEmLote,
} from '../../actions/credenciais-actions';

// Import mocked service
import * as mockService from '../../service';


// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockAdvogado = {
    id: 1,
    nome_completo: 'João da Silva',
    cpf: '12345678901',
    oabs: [{ numero: '12345', uf: 'SP' }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

const mockAdvogadosList = {
    advogados: [mockAdvogado],
    total: 1,
    pagina: 1,
    limite: 20,
    totalPaginas: 1,
};

const mockCredencial = {
    id: 10,
    advogado_id: 1,
    tribunal: 'TRT1',
    grau: '1' as const,
    active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

const validCriarAdvogadoParams = {
    nome_completo: 'Maria Oliveira',
    cpf: '98765432100',
    oabs: [{ numero: '67890', uf: 'RJ' }],
};

const validCriarCredencialParams = {
    advogado_id: 1,
    tribunal: 'TRT1',
    grau: '1' as const,
    senha: 'senha123',
    active: true,
};

const validCriarEmLoteParams = {
    advogado_id: 1,
    tribunais: ['TRT1', 'TRT2'],
    graus: ['1' as const],
    senha: 'senha123',
    modo_duplicata: 'pular' as const,
};

const mockResumoLote = {
    total: 2,
    criadas: 2,
    atualizadas: 0,
    puladas: 0,
    erros: 0,
    detalhes: [
        { tribunal: 'TRT1', grau: '1', status: 'criada', credencial_id: 10 },
        { tribunal: 'TRT2', grau: '1', status: 'criada', credencial_id: 11 },
    ],
};

// ===========================================================================
// Tests
// ===========================================================================

describe('Advogados Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (checkPermission as jest.Mock).mockResolvedValue(true);
    });

    // =========================================================================
    // actionListarAdvogados
    // =========================================================================
    describe('actionListarAdvogados', () => {
        it('deve listar advogados com sucesso', async () => {
            (mockService.listarAdvogados as jest.Mock).mockResolvedValue(mockAdvogadosList);

            const result = await actionListarAdvogados({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockAdvogadosList);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'advogados', 'visualizar');
            expect(mockService.listarAdvogados).toHaveBeenCalledWith({});
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionListarAdvogados({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.listarAdvogados).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionListarAdvogados({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
            expect(mockService.listarAdvogados).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarAdvogados as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarAdvogados({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarAdvogado
    // =========================================================================
    describe('actionBuscarAdvogado', () => {
        it('deve buscar advogado por ID com sucesso', async () => {
            (mockService.buscarAdvogado as jest.Mock).mockResolvedValue(mockAdvogado);

            const result = await actionBuscarAdvogado(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockAdvogado);
            expect(mockService.buscarAdvogado).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando advogado não encontrado', async () => {
            (mockService.buscarAdvogado as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarAdvogado(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Advogado não encontrado');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarAdvogado(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.buscarAdvogado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionBuscarAdvogado(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarAdvogado as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionBuscarAdvogado(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionCriarAdvogado
    // =========================================================================
    describe('actionCriarAdvogado', () => {
        it('deve criar advogado com sucesso e revalidar cache', async () => {
            (mockService.criarAdvogado as jest.Mock).mockResolvedValue(mockAdvogado);

            const result = await actionCriarAdvogado(validCriarAdvogadoParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockAdvogado);
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'advogados', 'editar');
            expect(mockService.criarAdvogado).toHaveBeenCalledWith(validCriarAdvogadoParams);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — nome curto', async () => {
            const result = await actionCriarAdvogado({
                nome_completo: 'AB',
                cpf: '12345678901',
                oabs: [{ numero: '12345', uf: 'SP' }],
            });

            expect(result.success).toBe(false);
            expect(mockService.criarAdvogado).not.toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — sem OABs', async () => {
            const result = await actionCriarAdvogado({
                nome_completo: 'Maria Oliveira',
                cpf: '12345678901',
                oabs: [],
            });

            expect(result.success).toBe(false);
            expect(mockService.criarAdvogado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarAdvogado(validCriarAdvogadoParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.criarAdvogado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionCriarAdvogado(validCriarAdvogadoParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarAdvogado as jest.Mock).mockRejectedValue(new Error('CPF duplicado'));

            const result = await actionCriarAdvogado(validCriarAdvogadoParams);

            expect(result.success).toBe(false);
            expect(result.error).toContain('CPF duplicado');
        });
    });

    // =========================================================================
    // actionAtualizarAdvogado
    // =========================================================================
    describe('actionAtualizarAdvogado', () => {
        it('deve atualizar advogado com sucesso e revalidar cache', async () => {
            const updateParams = { nome_completo: 'João Atualizado' };
            (mockService.atualizarAdvogado as jest.Mock).mockResolvedValue({ ...mockAdvogado, ...updateParams });

            const result = await actionAtualizarAdvogado(1, updateParams);

            expect(result.success).toBe(true);
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'advogados', 'editar');
            expect(mockService.atualizarAdvogado).toHaveBeenCalledWith(1, updateParams);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — nome curto', async () => {
            const result = await actionAtualizarAdvogado(1, { nome_completo: 'AB' });

            expect(result.success).toBe(false);
            expect(mockService.atualizarAdvogado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionAtualizarAdvogado(1, { nome_completo: 'Novo Nome' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.atualizarAdvogado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionAtualizarAdvogado(1, { nome_completo: 'Novo Nome' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarAdvogado as jest.Mock).mockRejectedValue(new Error('Not found'));

            const result = await actionAtualizarAdvogado(1, { nome_completo: 'Novo Nome' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not found');
        });
    });


    // =========================================================================
    // actionListarCredenciais
    // =========================================================================
    describe('actionListarCredenciais', () => {
        it('deve listar credenciais com sucesso', async () => {
            (mockService.listarCredenciais as jest.Mock).mockResolvedValue([mockCredencial]);

            const result = await actionListarCredenciais({ advogado_id: 1 });

            expect(result.success).toBe(true);
            expect(result.data).toEqual([mockCredencial]);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'credenciais', 'visualizar');
            expect(mockService.listarCredenciais).toHaveBeenCalledWith({ advogado_id: 1 });
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionListarCredenciais({ advogado_id: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.listarCredenciais).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionListarCredenciais({ advogado_id: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarCredenciais as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarCredenciais({ advogado_id: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarCredencial
    // =========================================================================
    describe('actionBuscarCredencial', () => {
        it('deve buscar credencial por ID com sucesso', async () => {
            (mockService.buscarCredencial as jest.Mock).mockResolvedValue(mockCredencial);

            const result = await actionBuscarCredencial(10);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCredencial);
            expect(mockService.buscarCredencial).toHaveBeenCalledWith(10);
        });

        it('deve retornar erro quando credencial não encontrada', async () => {
            (mockService.buscarCredencial as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarCredencial(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Credencial não encontrada');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarCredencial(10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.buscarCredencial).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionBuscarCredencial(10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarCredencial as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionBuscarCredencial(10);

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionCriarCredencial
    // =========================================================================
    describe('actionCriarCredencial', () => {
        it('deve criar credencial com sucesso e revalidar cache', async () => {
            (mockService.criarCredencial as jest.Mock).mockResolvedValue(mockCredencial);

            const result = await actionCriarCredencial(validCriarCredencialParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCredencial);
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'credenciais', 'editar');
            expect(mockService.criarCredencial).toHaveBeenCalledWith(validCriarCredencialParams);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — senha vazia', async () => {
            const result = await actionCriarCredencial({
                ...validCriarCredencialParams,
                senha: '',
            });

            expect(result.success).toBe(false);
            expect(mockService.criarCredencial).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarCredencial(validCriarCredencialParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.criarCredencial).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionCriarCredencial(validCriarCredencialParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarCredencial as jest.Mock).mockRejectedValue(new Error('Tribunal inválido'));

            const result = await actionCriarCredencial(validCriarCredencialParams);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Tribunal inválido');
        });
    });

    // =========================================================================
    // actionAtualizarCredencial
    // =========================================================================
    describe('actionAtualizarCredencial', () => {
        it('deve atualizar credencial com sucesso e revalidar cache', async () => {
            const updateParams = { senha: 'novaSenha123' };
            (mockService.atualizarCredencial as jest.Mock).mockResolvedValue({ ...mockCredencial, ...updateParams });

            const result = await actionAtualizarCredencial(10, updateParams);

            expect(result.success).toBe(true);
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'credenciais', 'editar');
            expect(mockService.atualizarCredencial).toHaveBeenCalledWith(10, updateParams);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionAtualizarCredencial(10, { senha: 'nova' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.atualizarCredencial).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionAtualizarCredencial(10, { senha: 'nova' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarCredencial as jest.Mock).mockRejectedValue(new Error('Not found'));

            const result = await actionAtualizarCredencial(10, { senha: 'nova' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not found');
        });
    });

    // =========================================================================
    // actionCriarCredenciaisEmLote
    // =========================================================================
    describe('actionCriarCredenciaisEmLote', () => {
        it('deve criar credenciais em lote com sucesso e revalidar cache', async () => {
            (mockService.criarCredenciaisEmLote as jest.Mock).mockResolvedValue(mockResumoLote);

            const result = await actionCriarCredenciaisEmLote(validCriarEmLoteParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockResumoLote);
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'credenciais', 'editar');
            expect(mockService.criarCredenciaisEmLote).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — tribunais vazio', async () => {
            const result = await actionCriarCredenciaisEmLote({
                ...validCriarEmLoteParams,
                tribunais: [],
            });

            expect(result.success).toBe(false);
            expect(mockService.criarCredenciaisEmLote).not.toHaveBeenCalled();
        });

        it('deve rejeitar input inválido (Zod) — senha vazia', async () => {
            const result = await actionCriarCredenciaisEmLote({
                ...validCriarEmLoteParams,
                senha: '',
            });

            expect(result.success).toBe(false);
            expect(mockService.criarCredenciaisEmLote).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarCredenciaisEmLote(validCriarEmLoteParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.criarCredenciaisEmLote).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionCriarCredenciaisEmLote(validCriarEmLoteParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarCredenciaisEmLote as jest.Mock).mockRejectedValue(new Error('Advogado não encontrado'));

            const result = await actionCriarCredenciaisEmLote(validCriarEmLoteParams);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Advogado não encontrado');
        });
    });

    // =========================================================================
    // actionAtualizarStatusCredenciaisEmLote
    // =========================================================================
    describe('actionAtualizarStatusCredenciaisEmLote', () => {
        it('deve atualizar status em lote com sucesso e revalidar cache', async () => {
            (mockService.atualizarStatusCredenciaisEmLote as jest.Mock).mockResolvedValue(3);

            const result = await actionAtualizarStatusCredenciaisEmLote([1, 2, 3], true);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ atualizadas: 3 });
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'credenciais', 'editar');
            expect(mockService.atualizarStatusCredenciaisEmLote).toHaveBeenCalledWith([1, 2, 3], true);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('deve rejeitar ids vazio', async () => {
            const result = await actionAtualizarStatusCredenciaisEmLote([], true);

            expect(result.success).toBe(false);
            expect(mockService.atualizarStatusCredenciaisEmLote).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionAtualizarStatusCredenciaisEmLote([1], true);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.atualizarStatusCredenciaisEmLote).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionAtualizarStatusCredenciaisEmLote([1], true);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarStatusCredenciaisEmLote as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionAtualizarStatusCredenciaisEmLote([1], true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });
});
