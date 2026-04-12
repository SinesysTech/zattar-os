/**
 * Tests for Calendar Server Actions
 *
 * Tests real exported actions with mocked service layer, auth session, and cache revalidation.
 * All calendar actions use `authenticatedAction` from @/lib/safe-action which:
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
    nomeCompleto: 'Teste Calendar',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarEventosPorPeriodo: jest.fn(),
}));

// Mock briefing-helpers
jest.mock('../../briefing-helpers', () => ({
    getDaySummary: jest.fn(),
    generateWeekPulse: jest.fn(),
}));

import { authenticateRequest } from '@/lib/auth/session';

// Import REAL actions (after mocks)
import { actionListarEventosCalendar } from '../../actions/calendar-actions';
import { actionListarBriefingData } from '../../actions/briefing-actions';

// Import mocked service and helpers
import * as mockService from '../../service';
import { getDaySummary, generateWeekPulse } from '../../briefing-helpers';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockEvents = [
    {
        id: 'audiencias:1',
        title: 'Audiência TRT1',
        startAt: '2025-02-01T10:00:00Z',
        endAt: '2025-02-01T11:00:00Z',
        allDay: false,
        source: 'audiencias' as const,
        sourceEntityId: '1',
        url: '/audiencias/1',
        responsavelId: null,
        color: null,
        metadata: null,
    },
    {
        id: 'expedientes:2',
        title: 'Prazo recursal',
        startAt: '2025-02-03T00:00:00Z',
        endAt: '2025-02-03T23:59:59Z',
        allDay: true,
        source: 'expedientes' as const,
        sourceEntityId: '2',
        url: '/expedientes/2',
        responsavelId: null,
        color: null,
        metadata: null,
    },
];

const mockSummary = {
    total: 2,
    audiencias: 1,
    horasOcupado: '1h',
    horasFoco: '8h',
    alertas: 0,
};

const mockWeekPulse = [
    { date: new Date('2025-01-26'), dia: 'Dom', eventos: 0, horas: 0, hoje: false },
    { date: new Date('2025-01-27'), dia: 'Seg', eventos: 1, horas: 1, hoje: false },
];

describe('Calendar Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionListarEventosCalendar
    // =========================================================================
    describe('actionListarEventosCalendar', () => {
        const validInput = {
            startAt: '2025-02-01T00:00:00Z',
            endAt: '2025-02-28T23:59:59Z',
        };

        it('deve listar eventos com sucesso', async () => {
            (mockService.listarEventosPorPeriodo as jest.Mock).mockResolvedValue(mockEvents);

            const result = await actionListarEventosCalendar(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockEvents);
            }
            expect(mockService.listarEventosPorPeriodo).toHaveBeenCalledWith(validInput);
        });

        it('deve listar eventos com filtro de sources', async () => {
            (mockService.listarEventosPorPeriodo as jest.Mock).mockResolvedValue([mockEvents[0]]);

            const inputWithSources = {
                ...validInput,
                sources: ['audiencias' as const],
            };
            const result = await actionListarEventosCalendar(inputWithSources);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual([mockEvents[0]]);
            }
            expect(mockService.listarEventosPorPeriodo).toHaveBeenCalledWith(inputWithSources);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarEventosCalendar(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com startAt vazio (validação Zod)', async () => {
            const result = await actionListarEventosCalendar({
                startAt: '',
                endAt: '2025-02-28T23:59:59Z',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com endAt vazio (validação Zod)', async () => {
            const result = await actionListarEventosCalendar({
                startAt: '2025-02-01T00:00:00Z',
                endAt: '',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com endAt anterior a startAt (validação Zod refine)', async () => {
            const result = await actionListarEventosCalendar({
                startAt: '2025-02-28T00:00:00Z',
                endAt: '2025-02-01T00:00:00Z',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com source inválido (validação Zod)', async () => {
            const result = await actionListarEventosCalendar({
                ...validInput,
                sources: ['invalido' as any],
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service lança exceção', async () => {
            (mockService.listarEventosPorPeriodo as jest.Mock).mockRejectedValue(
                new Error('Erro ao buscar eventos')
            );

            const result = await actionListarEventosCalendar(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao buscar eventos');
            }
        });
    });

    // =========================================================================
    // actionListarBriefingData
    // =========================================================================
    describe('actionListarBriefingData', () => {
        const validInput = { date: '2025-02-01' };

        it('deve retornar briefing data com sucesso', async () => {
            (mockService.listarEventosPorPeriodo as jest.Mock).mockResolvedValue(mockEvents);
            (getDaySummary as jest.Mock).mockReturnValue(mockSummary);
            (generateWeekPulse as jest.Mock).mockReturnValue(mockWeekPulse);

            const result = await actionListarBriefingData(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('events');
                expect(result.data).toHaveProperty('summary');
                expect(result.data).toHaveProperty('weekPulse');
                expect(result.data.events).toEqual(mockEvents);
                expect(result.data.summary).toEqual(mockSummary);
                expect(result.data.weekPulse).toEqual(mockWeekPulse);
            }
            expect(mockService.listarEventosPorPeriodo).toHaveBeenCalled();
            expect(getDaySummary).toHaveBeenCalled();
            expect(generateWeekPulse).toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarBriefingData(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com date vazio (validação Zod)', async () => {
            const result = await actionListarBriefingData({ date: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.listarEventosPorPeriodo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service lança exceção', async () => {
            (mockService.listarEventosPorPeriodo as jest.Mock).mockRejectedValue(
                new Error('Erro ao buscar eventos do briefing')
            );

            const result = await actionListarBriefingData(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao buscar eventos do briefing');
            }
        });
    });
});
