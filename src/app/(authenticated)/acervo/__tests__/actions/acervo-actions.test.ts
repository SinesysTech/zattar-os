/**
 * Tests for Acervo Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, authorization, and cache revalidation.
 * Acervo actions use authenticateRequest from @/lib/auth and checkPermission from @/lib/auth/authorization
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

// Mock date-utils
jest.mock('@/lib/date-utils', () => ({
    todayDateString: jest.fn(() => '2025-01-15'),
}));

// Mock auth
const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Acervo',
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
    obterAcervoPaginado: jest.fn(),
    obterAcervoUnificado: jest.fn(),
    buscarProcessoPorId: jest.fn(),
    atribuirResponsavel: jest.fn(),
    buscarProcessosClientePorCpf: jest.fn(),
    recapturarTimelineUnificada: jest.fn(),
}));

// Mock timeline-unificada
jest.mock('../../timeline-unificada', () => ({
    obterTimelineUnificadaPorId: jest.fn(),
}));

// Mock dynamic imports used in actionObterTimelinePorId
const mockBuscarProcessoUnificado = jest.fn();
const mockBuscarAcervoPorId = jest.fn();

jest.mock('@/app/(authenticated)/processos', () => ({
    buscarProcessoUnificado: (...args: unknown[]) => mockBuscarProcessoUnificado(...args),
}));

jest.mock('../../repository', () => ({
    buscarAcervoPorId: (...args: unknown[]) => mockBuscarAcervoPorId(...args),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';

// Import REAL actions (after mocks)
import {
    actionListarAcervoPaginado,
    actionListarAcervoUnificado,
    actionBuscarProcesso,
    actionAtribuirResponsavel,
    actionBuscarProcessosClientePorCpf,
    actionObterTimelinePorId,
    actionExportarAcervoCSV,
    actionRecapturarTimeline,
} from '../../actions/acervo-actions';

// Import mocked service
import * as mockService from '../../service';
import * as mockTimeline from '../../timeline-unificada';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockProcessosList = {
    processos: [
        {
            id: 1,
            numero_processo: '0001234-56.2024.5.01.0001',
            trt: 'TRT1',
            grau: 'primeiro_grau',
            origem: 'acervo_geral',
            classe_judicial: 'Ação Trabalhista',
            nome_parte_autora: 'João Silva',
            nome_parte_re: 'Empresa ABC',
            descricao_orgao_julgador: '1ª Vara do Trabalho',
            data_autuacao: '2024-01-15',
            status: 'ATIVO',
            responsavel_id: null,
        },
    ],
    total: 1,
};

const mockProcesso = {
    id: 1,
    numero_processo: '0001234-56.2024.5.01.0001',
    trt: 'TRT1',
    grau: 'primeiro_grau',
};

describe('Acervo Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (checkPermission as jest.Mock).mockResolvedValue(true);
    });

    // =========================================================================
    // actionListarAcervoPaginado
    // =========================================================================
    describe('actionListarAcervoPaginado', () => {
        it('deve listar acervo paginado com sucesso', async () => {
            (mockService.obterAcervoPaginado as jest.Mock).mockResolvedValue(mockProcessosList);

            const result = await actionListarAcervoPaginado({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProcessosList);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'acervo', 'visualizar');
            expect(mockService.obterAcervoPaginado).toHaveBeenCalledWith(
                expect.objectContaining({ unified: false, agrupar_por: undefined })
            );
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionListarAcervoPaginado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.obterAcervoPaginado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionListarAcervoPaginado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
            expect(mockService.obterAcervoPaginado).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.obterAcervoPaginado as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarAcervoPaginado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });

        it('deve rejeitar params inválidos (validação Zod)', async () => {
            const result = await actionListarAcervoPaginado({ limite: -1 } as any);

            expect(result.success).toBe(false);
            expect(mockService.obterAcervoPaginado).not.toHaveBeenCalled();
        });

        it('deve passar filtros validados ao service', async () => {
            (mockService.obterAcervoPaginado as jest.Mock).mockResolvedValue(mockProcessosList);

            await actionListarAcervoPaginado({ pagina: 2, limite: 50, trt: 'TRT1' });

            expect(mockService.obterAcervoPaginado).toHaveBeenCalledWith(
                expect.objectContaining({
                    pagina: 2,
                    limite: 50,
                    trt: 'TRT1',
                    unified: false,
                    agrupar_por: undefined,
                })
            );
        });
    });

    // =========================================================================
    // actionListarAcervoUnificado
    // =========================================================================
    describe('actionListarAcervoUnificado', () => {
        it('deve listar acervo unificado com sucesso', async () => {
            (mockService.obterAcervoUnificado as jest.Mock).mockResolvedValue(mockProcessosList);

            const result = await actionListarAcervoUnificado({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProcessosList);
            expect(mockService.obterAcervoUnificado).toHaveBeenCalledWith(
                expect.objectContaining({ unified: true, agrupar_por: undefined })
            );
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionListarAcervoUnificado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionListarAcervoUnificado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.obterAcervoUnificado as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await actionListarAcervoUnificado({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Timeout');
        });
    });

    // =========================================================================
    // actionBuscarProcesso
    // =========================================================================
    describe('actionBuscarProcesso', () => {
        it('deve buscar processo por ID com sucesso', async () => {
            (mockService.buscarProcessoPorId as jest.Mock).mockResolvedValue(mockProcesso);

            const result = await actionBuscarProcesso(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockProcesso);
            expect(mockService.buscarProcessoPorId).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando processo não encontrado', async () => {
            (mockService.buscarProcessoPorId as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarProcesso(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Processo não encontrado');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarProcesso(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.buscarProcessoPorId).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionBuscarProcesso(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarProcessoPorId as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionBuscarProcesso(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });
    });

    // =========================================================================
    // actionAtribuirResponsavel
    // =========================================================================
    describe('actionAtribuirResponsavel', () => {
        it('deve atribuir responsável com sucesso e revalidar cache', async () => {
            (mockService.atribuirResponsavel as jest.Mock).mockResolvedValue({ success: true });

            const result = await actionAtribuirResponsavel([1, 2], 10);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ message: 'Responsável atribuído com sucesso' });
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'acervo', 'editar');
            expect(mockService.atribuirResponsavel).toHaveBeenCalledWith([1, 2], 10, mockUser.id);
            expect(revalidatePath).toHaveBeenCalledWith('/app/processos');
        });

        it('deve permitir responsavelId null (remover responsável)', async () => {
            (mockService.atribuirResponsavel as jest.Mock).mockResolvedValue({ success: true });

            const result = await actionAtribuirResponsavel([1], null);

            expect(result.success).toBe(true);
            expect(mockService.atribuirResponsavel).toHaveBeenCalledWith([1], null, mockUser.id);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionAtribuirResponsavel([1], 10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.atribuirResponsavel).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão de edição', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionAtribuirResponsavel([1], 10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para editar acervo');
        });

        it('deve rejeitar processoIds vazio (validação Zod)', async () => {
            const result = await actionAtribuirResponsavel([], 10);

            expect(result.success).toBe(false);
            expect(mockService.atribuirResponsavel).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.atribuirResponsavel as jest.Mock).mockResolvedValue({
                success: false,
                error: 'Processo não encontrado',
            });

            const result = await actionAtribuirResponsavel([999], 10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Processo não encontrado');
        });
    });

    // =========================================================================
    // actionBuscarProcessosClientePorCpf
    // =========================================================================
    describe('actionBuscarProcessosClientePorCpf', () => {
        it('deve buscar processos por CPF com sucesso', async () => {
            const mockCpfResult = { success: true, data: { processos: [] } };
            (mockService.buscarProcessosClientePorCpf as jest.Mock).mockResolvedValue(mockCpfResult);

            const result = await actionBuscarProcessosClientePorCpf('12345678901');

            expect(result).toEqual(mockCpfResult);
            expect(mockService.buscarProcessosClientePorCpf).toHaveBeenCalledWith('12345678901');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarProcessosClientePorCpf('12345678901');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionBuscarProcessosClientePorCpf('12345678901');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarProcessosClientePorCpf as jest.Mock).mockRejectedValue(
                new Error('CPF inválido')
            );

            const result = await actionBuscarProcessosClientePorCpf('invalid');

            expect(result.success).toBe(false);
            expect(result.error).toBe('CPF inválido');
        });
    });

    // =========================================================================
    // actionObterTimelinePorId
    // =========================================================================
    describe('actionObterTimelinePorId', () => {
        const mockProcessoUnificado = {
            id: 1,
            numero_processo: '0001234-56.2024.5.01.0001',
        };

        it('deve obter timeline individual com sucesso', async () => {
            mockBuscarProcessoUnificado.mockResolvedValue({
                success: true,
                data: mockProcessoUnificado,
            });
            mockBuscarAcervoPorId.mockResolvedValue({
                timeline_jsonb: {
                    timeline: [{ data: '2024-01-15', descricao: 'Movimentação' }],
                    metadata: { total: 1 },
                },
            });

            const result = await actionObterTimelinePorId(1, false);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                processo: mockProcessoUnificado,
                timeline: {
                    timeline: [{ data: '2024-01-15', descricao: 'Movimentação' }],
                    metadata: { total: 1 },
                    unified: false,
                },
            });
        });

        it('deve obter timeline unificada com sucesso', async () => {
            mockBuscarProcessoUnificado.mockResolvedValue({
                success: true,
                data: mockProcessoUnificado,
            });
            (mockTimeline.obterTimelineUnificadaPorId as jest.Mock).mockResolvedValue({
                timeline: [{ data: '2024-01-15', descricao: 'Movimentação unificada' }],
                metadata: { total: 2 },
            });

            const result = await actionObterTimelinePorId(1, true);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                processo: mockProcessoUnificado,
                timeline: {
                    timeline: [{ data: '2024-01-15', descricao: 'Movimentação unificada' }],
                    metadata: { total: 2 },
                    unified: true,
                },
            });
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionObterTimelinePorId(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionObterTimelinePorId(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
        });

        it('deve retornar erro para ID inválido', async () => {
            const result = await actionObterTimelinePorId(NaN);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID do acervo inválido');
        });

        it('deve retornar erro quando processo não encontrado', async () => {
            mockBuscarProcessoUnificado.mockResolvedValue({
                success: false,
                error: { message: 'Processo não encontrado' },
            });

            const result = await actionObterTimelinePorId(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Processo não encontrado');
        });
    });

    // =========================================================================
    // actionExportarAcervoCSV
    // =========================================================================
    describe('actionExportarAcervoCSV', () => {
        it('deve exportar acervo em CSV com sucesso', async () => {
            (mockService.obterAcervoPaginado as jest.Mock).mockResolvedValue(mockProcessosList);

            const result = await actionExportarAcervoCSV({});

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('csv');
            expect(result.data).toHaveProperty('filename');
            expect((result.data as any).filename).toContain('acervo_');
            expect((result.data as any).csv).toContain('Número do Processo');
            expect(mockService.obterAcervoPaginado).toHaveBeenCalledWith(
                expect.objectContaining({
                    limite: 10000,
                    unified: false,
                    agrupar_por: undefined,
                })
            );
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionExportarAcervoCSV({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionExportarAcervoCSV({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para exportar acervo');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.obterAcervoPaginado as jest.Mock).mockRejectedValue(new Error('Export failed'));

            const result = await actionExportarAcervoCSV({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Export failed');
        });
    });

    // =========================================================================
    // actionRecapturarTimeline
    // =========================================================================
    describe('actionRecapturarTimeline', () => {
        it('deve recapturar timeline com sucesso e revalidar cache', async () => {
            const mockRecaptureResult = { success: true, message: 'Timeline recapturada' };
            (mockService.recapturarTimelineUnificada as jest.Mock).mockResolvedValue(mockRecaptureResult);

            const result = await actionRecapturarTimeline(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockRecaptureResult);
            expect(mockService.recapturarTimelineUnificada).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/processos/1/timeline');
            expect(revalidatePath).toHaveBeenCalledWith('/app/processos/1');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionRecapturarTimeline(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(mockService.recapturarTimelineUnificada).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionRecapturarTimeline(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para visualizar acervo');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.recapturarTimelineUnificada as jest.Mock).mockRejectedValue(
                new Error('Recapture failed')
            );

            const result = await actionRecapturarTimeline(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Recapture failed');
        });
    });
});
