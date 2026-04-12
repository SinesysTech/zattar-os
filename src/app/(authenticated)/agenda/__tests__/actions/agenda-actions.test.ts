/**
 * Tests for Agenda Server Actions
 *
 * Tests real exported actions with mocked service layer, auth session, and cache revalidation.
 * All agenda actions use `authenticatedAction` from @/lib/safe-action which:
 * 1. Calls authenticateRequest() for auth
 * 2. Validates input with Zod schema
 * 3. Executes handler with validated data + user context
 * 4. Returns ActionResult<T> ({ success, data/error, message })
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

// Mock auth session — authenticatedAction calls authenticateRequest internally
const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Agenda',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    criarEvento: jest.fn(),
    atualizarEvento: jest.fn(),
    deletarEvento: jest.fn(),
}));

import { authenticateRequest } from '@/lib/auth/session';

// Import REAL actions (after mocks)
import {
    actionCriarAgendaEvento,
    actionAtualizarAgendaEvento,
    actionDeletarAgendaEvento,
} from '../../actions/agenda-eventos-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockEvento = {
    id: 1,
    titulo: 'Reunião com cliente',
    descricao: 'Discussão sobre contrato',
    dataInicio: '2025-02-01T10:00:00Z',
    dataFim: '2025-02-01T11:00:00Z',
    diaInteiro: false,
    local: 'Sala 3',
    cor: '#3b82f6',
    responsavelId: null,
    criadoPor: 42,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
};

const validCriarInput = {
    titulo: 'Reunião com cliente',
    descricao: 'Discussão sobre contrato',
    dataInicio: '2025-02-01T10:00:00Z',
    dataFim: '2025-02-01T11:00:00Z',
    diaInteiro: false,
    local: 'Sala 3',
    cor: '#3b82f6',
};

describe('Agenda Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionCriarAgendaEvento
    // =========================================================================
    describe('actionCriarAgendaEvento', () => {
        it('deve criar evento com sucesso', async () => {
            (mockService.criarEvento as jest.Mock).mockResolvedValue({
                success: true,
                data: mockEvento,
            });

            const result = await actionCriarAgendaEvento(validCriarInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockEvento);
            }
            expect(mockService.criarEvento).toHaveBeenCalledWith(validCriarInput, mockUser.id);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarAgendaEvento(validCriarInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.criarEvento).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarAgendaEvento({
                ...validCriarInput,
                titulo: '',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarEvento).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com dataFim anterior a dataInicio (validação Zod)', async () => {
            const result = await actionCriarAgendaEvento({
                ...validCriarInput,
                dataInicio: '2025-02-01T12:00:00Z',
                dataFim: '2025-02-01T10:00:00Z',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarEvento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarEvento as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro ao criar evento' },
            });

            const result = await actionCriarAgendaEvento(validCriarInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao criar evento');
            }
        });
    });

    // =========================================================================
    // actionAtualizarAgendaEvento
    // =========================================================================
    describe('actionAtualizarAgendaEvento', () => {
        it('deve atualizar evento com sucesso', async () => {
            const updated = { ...mockEvento, titulo: 'Reunião atualizada' };
            (mockService.atualizarEvento as jest.Mock).mockResolvedValue({
                success: true,
                data: updated,
            });

            const input = { id: 1, titulo: 'Reunião atualizada' };
            const result = await actionAtualizarAgendaEvento(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(updated);
            }
            expect(mockService.atualizarEvento).toHaveBeenCalledWith(input);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionAtualizarAgendaEvento({ id: 1, titulo: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.atualizarEvento).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionAtualizarAgendaEvento({ id: -1, titulo: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarEvento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarEvento as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Evento não encontrado' },
            });

            const result = await actionAtualizarAgendaEvento({ id: 999, titulo: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Evento não encontrado');
            }
        });
    });

    // =========================================================================
    // actionDeletarAgendaEvento
    // =========================================================================
    describe('actionDeletarAgendaEvento', () => {
        it('deve deletar evento com sucesso', async () => {
            (mockService.deletarEvento as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            const result = await actionDeletarAgendaEvento({ id: 1 });

            expect(result.success).toBe(true);
            expect(mockService.deletarEvento).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionDeletarAgendaEvento({ id: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.deletarEvento).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionDeletarAgendaEvento({ id: -1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.deletarEvento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletarEvento as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Evento não encontrado' },
            });

            const result = await actionDeletarAgendaEvento({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Evento não encontrado');
            }
        });
    });
});
