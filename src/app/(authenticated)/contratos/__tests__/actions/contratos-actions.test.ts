/**
 * Tests for Contratos Server Actions
 *
 * Tests real exported actions with mocked service layer, DB client, and cache revalidation.
 *
 * The contratos module has two action files:
 * 1. contratos-actions.ts — CRUD actions using service layer + Zod validation (FormData-based)
 *    Also includes bulk operations that use createDbClient directly.
 * 2. segmentos-actions.ts — CRUD actions using createDbClient directly (no service layer)
 *
 * These actions do NOT use authenticateRequest/checkPermission.
 * Auth is handled at the Supabase RLS level.
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

// Mock AI indexing (used by create/update actions)
jest.mock('@/lib/ai/indexing', () => ({
    atualizarDocumentoNoIndice: jest.fn(),
}));

// Mock service layer
jest.mock('../../service', () => ({
    criarContrato: jest.fn(),
    atualizarContrato: jest.fn(),
    listarContratos: jest.fn(),
    buscarContrato: jest.fn(),
    contarContratosPorStatus: jest.fn(),
    contarContratos: jest.fn(),
    contarContratosAteData: jest.fn(),
    contarContratosEntreDatas: jest.fn(),
    excluirContrato: jest.fn(),
}));

// Mock repository (used by actionContratosStats)
jest.mock('../../repository', () => ({
    countContratosNovosMes: jest.fn(),
    countContratosTrendMensal: jest.fn(),
}));

// Mock Supabase clients (used by bulk actions, segmentos, and actionBuscarContratoCompleto)
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockNeq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

const mockFrom = jest.fn(() => ({
    update: mockUpdate,
    delete: mockDelete,
    insert: mockInsert,
    select: mockSelect,
    eq: mockEq,
    neq: mockNeq,
    in: mockIn,
    order: mockOrder,
    limit: mockLimit,
    maybeSingle: mockMaybeSingle,
    single: mockSingle,
}));

// Chain returns for fluent API
mockUpdate.mockReturnValue({ in: mockIn, eq: mockEq, select: mockSelect });
mockDelete.mockReturnValue({ in: mockIn, eq: mockEq });
mockInsert.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ eq: mockEq, in: mockIn, order: mockOrder, single: mockSingle, maybeSingle: mockMaybeSingle });
mockEq.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle, limit: mockLimit, error: null, count: 2 });
mockIn.mockReturnValue({ error: null, count: 2 });
mockOrder.mockReturnValue({ data: [], error: null });
mockLimit.mockReturnValue({ data: [], error: null });

jest.mock('@/lib/supabase', () => ({
    createDbClient: jest.fn(() => ({ from: mockFrom })),
}));

jest.mock('@/lib/supabase/service-client', () => ({
    createServiceClient: jest.fn(() => ({
        from: jest.fn(() => ({
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
    })),
}));

import { revalidatePath } from 'next/cache';

// Import REAL actions (after mocks)
import {
    actionCriarContrato,
    actionAtualizarContrato,
    actionListarContratos,
    actionBuscarContrato,
    actionExcluirContrato,
    actionAlterarStatusContratosEmMassa,
    actionAtribuirResponsavelContratosEmMassa,
    actionAlterarSegmentoContratosEmMassa,
    actionExcluirContratosEmMassa,
    actionAlterarResponsavelContrato,
    actionContarContratosPorStatus,
    actionContarContratosComEstatisticas,
    actionContratosStats,
    actionResolverNomesEntidadesContrato,
} from '../../actions/contratos-actions';

import {
    actionListarSegmentos,
    actionCriarSegmento,
    actionAtualizarSegmento,
    actionDeletarSegmento,
} from '../../actions/segmentos-actions';

// Import mocked service
import * as mockService from '../../service';
import * as mockRepository from '../../repository';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockContrato = {
    id: 1,
    clienteId: 10,
    tipoContrato: 'ajuizamento',
    tipoCobranca: 'pro_exito',
    papelClienteNoContrato: 'autora',
    status: 'contratado',
    cadastradoEm: '2025-01-01',
    observacoes: 'Contrato teste',
    segmentoId: null,
    responsavelId: null,
    partes: [],
    processos: [],
    updatedAt: '2025-01-01T00:00:00Z',
};

function buildFormData(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        fd.append(key, value);
    }
    return fd;
}

const validCreateFormData = () =>
    buildFormData({
        tipoContrato: 'ajuizamento',
        tipoCobranca: 'pro_exito',
        papelClienteNoContrato: 'autora',
        clienteId: '10',
        partes: '[]',
    });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Contratos Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // actionCriarContrato
    // =========================================================================
    describe('actionCriarContrato', () => {
        it('deve criar contrato com sucesso e revalidar cache', async () => {
            (mockService.criarContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: mockContrato,
            });

            const result = await actionCriarContrato(null, validCreateFormData());

            expect(result.success).toBe(true);
            expect(result.message).toContain('sucesso');
            expect(mockService.criarContrato).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
            expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
        });

        it('deve retornar erro de validação Zod quando campos obrigatórios faltam', async () => {
            const emptyFormData = new FormData();

            const result = await actionCriarContrato(null, emptyFormData);

            expect(result.success).toBe(false);
            expect(mockService.criarContrato).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Cliente não encontrado' },
            });

            const result = await actionCriarContrato(null, validCreateFormData());

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cliente não encontrado');
        });

        it('deve tratar exceção do service', async () => {
            (mockService.criarContrato as jest.Mock).mockRejectedValue(
                new Error('DB connection error')
            );

            const result = await actionCriarContrato(null, validCreateFormData());

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB connection error');
        });
    });

    // =========================================================================
    // actionAtualizarContrato
    // =========================================================================
    describe('actionAtualizarContrato', () => {
        it('deve atualizar contrato com sucesso e revalidar cache', async () => {
            (mockService.atualizarContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockContrato, observacoes: 'Atualizado' },
            });

            const fd = buildFormData({ observacoes: 'Atualizado' });
            const result = await actionAtualizarContrato(1, null, fd);

            expect(result.success).toBe(true);
            expect(mockService.atualizarContrato).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/1');
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const fd = buildFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarContrato(0, null, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID inválido');
            expect(mockService.atualizarContrato).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Contrato não encontrado' },
            });

            const fd = buildFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarContrato(999, null, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Contrato não encontrado');
        });

        it('deve tratar exceção do service', async () => {
            (mockService.atualizarContrato as jest.Mock).mockRejectedValue(
                new Error('Timeout')
            );

            const fd = buildFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarContrato(1, null, fd);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Timeout');
        });
    });

    // =========================================================================
    // actionExcluirContrato
    // =========================================================================
    describe('actionExcluirContrato', () => {
        it('deve excluir contrato com sucesso e revalidar cache', async () => {
            (mockService.excluirContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            const result = await actionExcluirContrato(1);

            expect(result.success).toBe(true);
            expect(mockService.excluirContrato).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const result = await actionExcluirContrato(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID inválido');
            expect(mockService.excluirContrato).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.excluirContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Contrato não encontrado' },
            });

            const result = await actionExcluirContrato(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Contrato não encontrado');
        });

        it('deve tratar exceção do service', async () => {
            (mockService.excluirContrato as jest.Mock).mockRejectedValue(
                new Error('DB error')
            );

            const result = await actionExcluirContrato(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });
    });

    // =========================================================================
    // actionListarContratos
    // =========================================================================
    describe('actionListarContratos', () => {
        it('deve listar contratos com sucesso', async () => {
            const mockList = { items: [mockContrato], paginacao: { pagina: 1, limite: 10, total: 1 } };
            (mockService.listarContratos as jest.Mock).mockResolvedValue({
                success: true,
                data: mockList,
            });

            const result = await actionListarContratos({ pagina: 1, limite: 10 });

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toEqual(mockList);
            expect(mockService.listarContratos).toHaveBeenCalledWith({ pagina: 1, limite: 10 });
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarContratos as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro no banco' },
            });

            const result = await actionListarContratos();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro no banco');
        });

        it('deve tratar exceção do service', async () => {
            (mockService.listarContratos as jest.Mock).mockRejectedValue(
                new Error('Connection refused')
            );

            const result = await actionListarContratos();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Connection refused');
        });
    });

    // =========================================================================
    // actionBuscarContrato
    // =========================================================================
    describe('actionBuscarContrato', () => {
        it('deve buscar contrato por ID com sucesso', async () => {
            (mockService.buscarContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: mockContrato,
            });

            const result = await actionBuscarContrato(1);

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toEqual(mockContrato);
            expect(mockService.buscarContrato).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const result = await actionBuscarContrato(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID inválido');
            expect(mockService.buscarContrato).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando contrato não encontrado', async () => {
            (mockService.buscarContrato as jest.Mock).mockResolvedValue({
                success: true,
                data: null,
            });

            const result = await actionBuscarContrato(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Contrato não encontrado');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarContrato as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'DB error' },
            });

            const result = await actionBuscarContrato(1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });
    });

    // =========================================================================
    // Bulk Actions
    // =========================================================================
    describe('actionAlterarStatusContratosEmMassa', () => {
        it('deve alterar status em massa com sucesso', async () => {
            mockIn.mockReturnValueOnce({ error: null, count: 2 });

            const result = await actionAlterarStatusContratosEmMassa([1, 2], 'contratado');

            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
        });

        it('deve retornar erro quando nenhum ID é fornecido', async () => {
            const result = await actionAlterarStatusContratosEmMassa([], 'contratado');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nenhum contrato selecionado');
        });

        it('deve retornar erro quando status é inválido', async () => {
            const result = await actionAlterarStatusContratosEmMassa([1], 'invalido');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Status inválido');
        });
    });

    describe('actionAtribuirResponsavelContratosEmMassa', () => {
        it('deve atribuir responsável em massa com sucesso', async () => {
            mockIn.mockReturnValueOnce({ error: null, count: 2 });

            const result = await actionAtribuirResponsavelContratosEmMassa([1, 2], 5);

            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
        });

        it('deve retornar erro quando nenhum ID é fornecido', async () => {
            const result = await actionAtribuirResponsavelContratosEmMassa([], 5);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nenhum contrato selecionado');
        });

        it('deve retornar erro quando responsável ID é inválido', async () => {
            const result = await actionAtribuirResponsavelContratosEmMassa([1], -1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID do responsável inválido');
        });
    });

    describe('actionAlterarSegmentoContratosEmMassa', () => {
        it('deve alterar segmento em massa com sucesso', async () => {
            mockIn.mockReturnValueOnce({ error: null, count: 2 });

            const result = await actionAlterarSegmentoContratosEmMassa([1, 2], 3);

            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
        });

        it('deve retornar erro quando nenhum ID é fornecido', async () => {
            const result = await actionAlterarSegmentoContratosEmMassa([], 3);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nenhum contrato selecionado');
        });

        it('deve retornar erro quando segmento ID é inválido', async () => {
            const result = await actionAlterarSegmentoContratosEmMassa([1], -1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID do segmento inválido');
        });
    });

    describe('actionExcluirContratosEmMassa', () => {
        it('deve excluir contratos em massa com sucesso', async () => {
            mockIn.mockReturnValueOnce({ error: null, count: 2 });

            const result = await actionExcluirContratosEmMassa([1, 2]);

            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
            expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
        });

        it('deve retornar erro quando nenhum ID é fornecido', async () => {
            const result = await actionExcluirContratosEmMassa([]);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nenhum contrato selecionado');
        });
    });

    describe('actionAlterarResponsavelContrato', () => {
        it('deve alterar responsável de um contrato com sucesso', async () => {
            mockEq.mockReturnValueOnce({ error: null });

            const result = await actionAlterarResponsavelContrato(1, 5);

            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos');
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const result = await actionAlterarResponsavelContrato(0, 5);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ID inválido');
        });
    });

    // =========================================================================
    // actionContarContratosPorStatus
    // =========================================================================
    describe('actionContarContratosPorStatus', () => {
        it('deve contar contratos por status com sucesso', async () => {
            const mockCounts = { em_contratacao: 5, contratado: 10, distribuido: 3, desistencia: 2 };
            (mockService.contarContratosPorStatus as jest.Mock).mockResolvedValue({
                success: true,
                data: mockCounts,
            });

            const result = await actionContarContratosPorStatus();

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toEqual(mockCounts);
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.contarContratosPorStatus as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'DB error' },
            });

            const result = await actionContarContratosPorStatus();

            expect(result.success).toBe(false);
        });

        it('deve suportar filtro por range de datas', async () => {
            const mockCounts = { em_contratacao: 2, contratado: 3, distribuido: 1, desistencia: 0 };
            (mockService.contarContratosPorStatus as jest.Mock).mockResolvedValue({
                success: true,
                data: mockCounts,
            });

            const result = await actionContarContratosPorStatus({
                mode: 'range',
                from: '2025-01-01',
                to: '2025-06-30',
            });

            expect(result.success).toBe(true);
        });

        it('deve retornar erro quando range de datas é inválido', async () => {
            const result = await actionContarContratosPorStatus({
                mode: 'range',
                from: 'invalid',
                to: 'invalid',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Período inválido');
        });
    });

    // =========================================================================
    // actionContarContratosComEstatisticas
    // =========================================================================
    describe('actionContarContratosComEstatisticas', () => {
        it('deve retornar total sem variação quando mode=all', async () => {
            (mockService.contarContratos as jest.Mock).mockResolvedValue({
                success: true,
                data: 50,
            });

            const result = await actionContarContratosComEstatisticas({ mode: 'all' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(50);
                expect(result.data.variacaoPercentual).toBeNull();
            }
        });

        it('deve calcular variação percentual com range', async () => {
            (mockService.contarContratosEntreDatas as jest.Mock)
                .mockResolvedValueOnce({ success: true, data: 20 })  // current range
                .mockResolvedValueOnce({ success: true, data: 10 }); // previous range

            const result = await actionContarContratosComEstatisticas({
                mode: 'range',
                from: '2025-01-01',
                to: '2025-06-30',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(20);
                expect(result.data.variacaoPercentual).toBe(100);
            }
        });

        it('deve retornar erro quando range é inválido', async () => {
            const result = await actionContarContratosComEstatisticas({
                mode: 'range',
                from: 'invalid',
                to: 'invalid',
            });

            expect(result.success).toBe(false);
        });

        it('deve calcular variação com mês anterior quando sem filtro', async () => {
            (mockService.contarContratos as jest.Mock).mockResolvedValue({
                success: true,
                data: 30,
            });
            (mockService.contarContratosAteData as jest.Mock).mockResolvedValue({
                success: true,
                data: 25,
            });

            const result = await actionContarContratosComEstatisticas();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(30);
                expect(result.data.variacaoPercentual).toBe(20);
            }
        });
    });

    // =========================================================================
    // actionContratosStats
    // =========================================================================
    describe('actionContratosStats', () => {
        it('deve retornar estatísticas agregadas com sucesso', async () => {
            (mockService.contarContratosPorStatus as jest.Mock).mockResolvedValue({
                success: true,
                data: { em_contratacao: 5, contratado: 10, distribuido: 3, desistencia: 2 },
            });
            (mockRepository.countContratosNovosMes as jest.Mock).mockResolvedValue({
                success: true,
                data: 8,
            });
            (mockRepository.countContratosTrendMensal as jest.Mock).mockResolvedValue({
                success: true,
                data: [
                    { mes: '2025-01', count: 5 },
                    { mes: '2025-02', count: 7 },
                    { mes: '2025-03', count: 3 },
                    { mes: '2025-04', count: 10 },
                    { mes: '2025-05', count: 6 },
                    { mes: '2025-06', count: 8 },
                ],
            });
            (mockService.contarContratos as jest.Mock).mockResolvedValue({
                success: true,
                data: 20,
            });

            const result = await actionContratosStats();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(20);
                expect(result.data.novosMes).toBe(8);
                expect(result.data.trendMensal).toHaveLength(6);
                expect(result.data.porStatus).toBeDefined();
                expect(typeof result.data.taxaConversao).toBe('number');
            }
        });

        it('deve retornar zeros quando services falham', async () => {
            (mockService.contarContratosPorStatus as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Error' },
            });
            (mockRepository.countContratosNovosMes as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Error' },
            });
            (mockRepository.countContratosTrendMensal as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Error' },
            });
            (mockService.contarContratos as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Error' },
            });

            const result = await actionContratosStats();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.total).toBe(0);
                expect(result.data.novosMes).toBe(0);
                expect(result.data.taxaConversao).toBe(0);
            }
        });
    });

    // =========================================================================
    // actionResolverNomesEntidadesContrato
    // =========================================================================
    describe('actionResolverNomesEntidadesContrato', () => {
        it('deve resolver nomes com sucesso quando IDs são fornecidos', async () => {
            mockIn.mockReturnValueOnce({ data: [{ id: 10, nome: 'Cliente A' }], error: null });
            mockIn.mockReturnValueOnce({ data: [{ id: 20, nome: 'Parte B' }], error: null });
            mockIn.mockReturnValueOnce({ data: [{ id: 30, nome_completo: 'Usuário C', nome_exibicao: null }], error: null });

            const result = await actionResolverNomesEntidadesContrato({
                clienteIds: [10],
                partesContrariasIds: [20],
                usuariosIds: [30],
            });

            expect(result.success).toBe(true);
        });

        it('deve retornar arrays vazios quando nenhum ID é fornecido', async () => {
            const result = await actionResolverNomesEntidadesContrato({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.clientes).toEqual([]);
                expect(result.data.partesContrarias).toEqual([]);
                expect(result.data.usuarios).toEqual([]);
            }
        });
    });
});


// =============================================================================
// Segmentos Actions
// =============================================================================
describe('Segmentos Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('actionListarSegmentos', () => {
        it('deve listar segmentos com sucesso', async () => {
            mockOrder.mockReturnValueOnce({
                data: [
                    { id: 1, nome: 'Trabalhista', slug: 'trabalhista', descricao: null, ativo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
                ],
                error: null,
            });

            const result = await actionListarSegmentos();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].nome).toBe('Trabalhista');
            }
        });

        it('deve retornar erro quando DB falha', async () => {
            mockOrder.mockReturnValueOnce({
                data: null,
                error: { message: 'DB error' },
            });

            const result = await actionListarSegmentos();

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toBe('DB error');
        });
    });

    describe('actionCriarSegmento', () => {
        it('deve criar segmento com sucesso', async () => {
            // Mock slug check (maybeSingle returns null = no existing slug)
            mockMaybeSingle.mockResolvedValueOnce({ data: null });
            // Mock insert result
            mockSingle.mockResolvedValueOnce({
                data: { id: 1, nome: 'Civil', slug: 'civil', descricao: null, ativo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
                error: null,
            });

            const result = await actionCriarSegmento({ nome: 'Civil', slug: 'civil' });

            expect(result.success).toBe(true);
            if (result.success) expect(result.data.nome).toBe('Civil');
        });

        it('deve retornar erro quando nome está vazio', async () => {
            const result = await actionCriarSegmento({ nome: '', slug: 'test' });

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toBe('Nome é obrigatório');
        });

        it('deve retornar erro quando slug está vazio', async () => {
            const result = await actionCriarSegmento({ nome: 'Test', slug: '' });

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toBe('Slug é obrigatório');
        });

        it('deve retornar erro quando slug já existe', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: { id: 99 } });

            const result = await actionCriarSegmento({ nome: 'Civil', slug: 'civil' });

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toContain('Já existe');
        });
    });

    describe('actionAtualizarSegmento', () => {
        it('deve atualizar segmento com sucesso', async () => {
            // Mock existence check
            mockMaybeSingle.mockResolvedValueOnce({ data: { id: 1 } });
            // Mock update result
            mockSingle.mockResolvedValueOnce({
                data: { id: 1, nome: 'Civil Atualizado', slug: 'civil', descricao: null, ativo: true, created_at: '2025-01-01', updated_at: '2025-01-02' },
                error: null,
            });

            const result = await actionAtualizarSegmento(1, { nome: 'Civil Atualizado' });

            expect(result.success).toBe(true);
            if (result.success) expect(result.data.nome).toBe('Civil Atualizado');
        });

        it('deve retornar erro quando segmento não existe', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null });

            const result = await actionAtualizarSegmento(999, { nome: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toBe('Segmento não encontrado');
        });
    });

    describe('actionDeletarSegmento', () => {
        it('deve deletar segmento com sucesso', async () => {
            // Chain: from('contratos').select('id').eq('segmento_id', id).limit(1)
            // Then: from('segmentos').delete().eq('id', id)
            // We need to mock the full chain for each call
            const mockChainSelect = {
                eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({ data: [], error: null }),
                }),
            };
            const mockChainDelete = {
                eq: jest.fn().mockReturnValue({ error: null }),
            };
            mockFrom
                .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockChainSelect) } as never)
                .mockReturnValueOnce({ delete: jest.fn().mockReturnValue(mockChainDelete) } as never);

            const result = await actionDeletarSegmento(1);

            expect(result.success).toBe(true);
        });

        it('deve retornar erro quando há contratos usando o segmento', async () => {
            const mockChainSelect = {
                eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({ data: [{ id: 1 }], error: null }),
                }),
            };
            mockFrom
                .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockChainSelect) } as never);

            const result = await actionDeletarSegmento(1);

            expect(result.success).toBe(false);
            if (!result.success) expect(result.error).toContain('existem contratos');
        });
    });
});
