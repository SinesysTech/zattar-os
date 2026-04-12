/**
 * Tests for RH Server Actions
 *
 * Tests real exported actions with mocked service layer, auth (requireAuth), and cache revalidation.
 * RH actions use requireAuth from actions/utils which:
 * 1. Authenticates via Supabase
 * 2. Resolves numeric userId
 * 3. Checks permissions via checkPermission
 *
 * Each action:
 * 1. Calls requireAuth() for auth + authorization
 * 2. Validates input with Zod schema (where applicable)
 * 3. Delegates to service layer
 * 4. Returns { success, data?, error? }
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

// Mock requireAuth from actions/utils
const mockUserId = 1;
jest.mock('../../actions/utils', () => ({
    requireAuth: jest.fn(async () => ({ userId: mockUserId })),
}));

// Mock authorization (used by some actions directly)
jest.mock('@/lib/auth/authorization', () => ({
    checkPermission: jest.fn(async () => true),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarSalarios: jest.fn(),
    buscarSalarioPorId: jest.fn(),
    buscarSalariosDoUsuario: jest.fn(),
    criarSalario: jest.fn(),
    atualizarSalario: jest.fn(),
    encerrarVigenciaSalario: jest.fn(),
    inativarSalario: jest.fn(),
    deletarSalario: jest.fn(),
    calcularTotaisSalariosAtivos: jest.fn(),
    listarUsuariosSemSalarioVigente: jest.fn(),
    listarFolhasPagamento: jest.fn(),
    buscarFolhaPorId: jest.fn(),
    buscarFolhaPorPeriodo: jest.fn(),
    gerarFolhaPagamento: jest.fn(),
    previewGerarFolha: jest.fn(),
    aprovarFolhaPagamento: jest.fn(),
    pagarFolhaPagamento: jest.fn(),
    atualizarFolhaPagamento: jest.fn(),
    podeCancelarFolha: jest.fn(),
    calcularTotalAPagar: jest.fn(),
    cancelarFolhaPagamento: jest.fn(),
    deletarFolhaPagamento: jest.fn(),
    calcularTotaisPorStatus: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { requireAuth } from '../../actions/utils';
import { checkPermission } from '@/lib/auth/authorization';

// Import REAL actions (after mocks)
import {
    actionListarSalarios,
    actionBuscarSalario,
    actionBuscarSalariosDoUsuario,
    actionCriarSalario,
    actionAtualizarSalario,
    actionEncerrarVigenciaSalario,
    actionInativarSalario,
    actionExcluirSalario,
} from '../../actions/salarios-actions';

import {
    actionListarFolhasPagamento,
    actionBuscarFolhaPagamento,
    actionBuscarFolhaPorPeriodo,
    actionGerarFolhaPagamento,
    actionPreviewGerarFolha,
    actionAprovarFolhaPagamento,
    actionPagarFolhaPagamento,
    actionAtualizarFolhaPagamento,
    actionVerificarCancelamentoFolha,
    actionObterResumoPagamento,
    actionCancelarFolhaPagamento,
    actionExcluirFolhaPagamento,
} from '../../actions/folhas-pagamento-actions';

import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockSalario = {
    id: 1,
    usuarioId: 10,
    cargoId: 2,
    salarioBruto: 5000,
    dataInicioVigencia: '2025-01-01',
    dataFimVigencia: null,
    ativo: true,
    observacoes: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const mockSalariosList = {
    items: [mockSalario],
    paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
};

const mockFolha = {
    id: 1,
    mesReferencia: 6,
    anoReferencia: 2025,
    status: 'rascunho',
    valorTotal: 10000,
    dataPagamento: null,
    observacoes: null,
    itens: [],
    createdAt: '2025-06-01T00:00:00Z',
};

const mockFolhasList = {
    items: [mockFolha],
    paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
};

function buildFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.set(key, value);
    }
    return fd;
}

describe('RH Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (requireAuth as jest.Mock).mockResolvedValue({ userId: mockUserId });
        (checkPermission as jest.Mock).mockResolvedValue(true);
    });


    // =========================================================================
    // SALÁRIOS ACTIONS
    // =========================================================================

    // =========================================================================
    // actionListarSalarios
    // =========================================================================
    describe('actionListarSalarios', () => {
        it('deve listar salários com sucesso', async () => {
            (mockService.listarSalarios as jest.Mock).mockResolvedValue(mockSalariosList);

            const result = await actionListarSalarios({});

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject(mockSalariosList);
            expect(requireAuth).toHaveBeenCalledWith(['salarios:listar']);
            expect(mockService.listarSalarios).toHaveBeenCalled();
        });

        it('deve incluir totais quando solicitado', async () => {
            (mockService.listarSalarios as jest.Mock).mockResolvedValue(mockSalariosList);
            const mockTotais = { totalAtivos: 5, totalBruto: 25000 };
            (mockService.calcularTotaisSalariosAtivos as jest.Mock).mockResolvedValue(mockTotais);

            const result = await actionListarSalarios({ incluirTotais: true });

            expect(result.success).toBe(true);
            expect(result.data?.totais).toEqual(mockTotais);
            expect(mockService.calcularTotaisSalariosAtivos).toHaveBeenCalled();
        });

        it('deve incluir usuários sem salário quando solicitado', async () => {
            (mockService.listarSalarios as jest.Mock).mockResolvedValue(mockSalariosList);
            const mockSemSalario = [{ id: 20, nome: 'Sem Salário' }];
            (mockService.listarUsuariosSemSalarioVigente as jest.Mock).mockResolvedValue(mockSemSalario);

            const result = await actionListarSalarios({ incluirSemSalario: true });

            expect(result.success).toBe(true);
            expect(result.data?.usuariosSemSalario).toEqual(mockSemSalario);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionListarSalarios({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
            expect(mockService.listarSalarios).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarSalarios as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarSalarios({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarSalario
    // =========================================================================
    describe('actionBuscarSalario', () => {
        it('deve buscar salário por ID com sucesso', async () => {
            (mockService.buscarSalarioPorId as jest.Mock).mockResolvedValue(mockSalario);

            const result = await actionBuscarSalario(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSalario);
            expect(mockService.buscarSalarioPorId).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando salário não encontrado', async () => {
            (mockService.buscarSalarioPorId as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarSalario(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Salário não encontrado');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionBuscarSalario(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.buscarSalarioPorId as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionBuscarSalario(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarSalariosDoUsuario
    // =========================================================================
    describe('actionBuscarSalariosDoUsuario', () => {
        it('deve buscar salários do usuário com sucesso', async () => {
            const salarios = [mockSalario];
            (mockService.buscarSalariosDoUsuario as jest.Mock).mockResolvedValue(salarios);

            const result = await actionBuscarSalariosDoUsuario(10);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(salarios);
            expect(mockService.buscarSalariosDoUsuario).toHaveBeenCalledWith(10);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionBuscarSalariosDoUsuario(10);

            expect(result.success).toBe(false);
            expect(mockService.buscarSalariosDoUsuario).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionCriarSalario
    // =========================================================================
    describe('actionCriarSalario', () => {
        const validFormData = buildFormData({
            usuarioId: '10',
            salarioBruto: '5000',
            dataInicioVigencia: '2025-01-01',
        });

        it('deve criar salário com sucesso e revalidar cache', async () => {
            (mockService.criarSalario as jest.Mock).mockResolvedValue(mockSalario);

            const result = await actionCriarSalario(validFormData);

            expect(result.success).toBe(true);
            expect(mockService.criarSalario).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/salarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionCriarSalario(validFormData);

            expect(result.success).toBe(false);
            expect(mockService.criarSalario).not.toHaveBeenCalled();
        });

        it('deve rejeitar salário bruto negativo (validação Zod)', async () => {
            const invalidFd = buildFormData({
                usuarioId: '10',
                salarioBruto: '-100',
                dataInicioVigencia: '2025-01-01',
            });

            const result = await actionCriarSalario(invalidFd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.criarSalario).not.toHaveBeenCalled();
        });

        it('deve rejeitar data de vigência em formato inválido (validação Zod)', async () => {
            const invalidFd = buildFormData({
                usuarioId: '10',
                salarioBruto: '5000',
                dataInicioVigencia: '01/01/2025',
            });

            const result = await actionCriarSalario(invalidFd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.criarSalario).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarSalario as jest.Mock).mockRejectedValue(new Error('Salário duplicado'));

            const result = await actionCriarSalario(validFormData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Salário duplicado');
        });
    });

    // =========================================================================
    // actionAtualizarSalario
    // =========================================================================
    describe('actionAtualizarSalario', () => {
        const validFormData = buildFormData({
            salarioBruto: '6000',
        });

        it('deve atualizar salário com sucesso e revalidar cache', async () => {
            (mockService.atualizarSalario as jest.Mock).mockResolvedValue({ ...mockSalario, salarioBruto: 6000 });

            const result = await actionAtualizarSalario(1, validFormData);

            expect(result.success).toBe(true);
            expect(mockService.atualizarSalario).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/salarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionAtualizarSalario(1, validFormData);

            expect(result.success).toBe(false);
            expect(mockService.atualizarSalario).not.toHaveBeenCalled();
        });

        it('deve rejeitar salário bruto negativo (validação Zod)', async () => {
            const invalidFd = buildFormData({ salarioBruto: '-100' });

            const result = await actionAtualizarSalario(1, invalidFd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.atualizarSalario).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarSalario as jest.Mock).mockRejectedValue(new Error('Salário não encontrado'));

            const result = await actionAtualizarSalario(1, validFormData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Salário não encontrado');
        });
    });

    // =========================================================================
    // actionEncerrarVigenciaSalario
    // =========================================================================
    describe('actionEncerrarVigenciaSalario', () => {
        it('deve encerrar vigência com sucesso', async () => {
            (mockService.encerrarVigenciaSalario as jest.Mock).mockResolvedValue({ ...mockSalario, dataFimVigencia: '2025-06-30' });

            const result = await actionEncerrarVigenciaSalario(1, '2025-06-30');

            expect(result.success).toBe(true);
            expect(mockService.encerrarVigenciaSalario).toHaveBeenCalledWith(1, '2025-06-30');
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/salarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionEncerrarVigenciaSalario(1, '2025-06-30');

            expect(result.success).toBe(false);
            expect(mockService.encerrarVigenciaSalario).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.encerrarVigenciaSalario as jest.Mock).mockRejectedValue(new Error('Erro'));

            const result = await actionEncerrarVigenciaSalario(1, '2025-06-30');

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // actionInativarSalario
    // =========================================================================
    describe('actionInativarSalario', () => {
        it('deve inativar salário com sucesso', async () => {
            (mockService.inativarSalario as jest.Mock).mockResolvedValue({ ...mockSalario, ativo: false });

            const result = await actionInativarSalario(1);

            expect(result.success).toBe(true);
            expect(mockService.inativarSalario).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/salarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionInativarSalario(1);

            expect(result.success).toBe(false);
            expect(mockService.inativarSalario).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionExcluirSalario
    // =========================================================================
    describe('actionExcluirSalario', () => {
        it('deve excluir salário com sucesso', async () => {
            (mockService.deletarSalario as jest.Mock).mockResolvedValue(undefined);

            const result = await actionExcluirSalario(1);

            expect(result.success).toBe(true);
            expect(mockService.deletarSalario).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/salarios');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionExcluirSalario(1);

            expect(result.success).toBe(false);
            expect(mockService.deletarSalario).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletarSalario as jest.Mock).mockRejectedValue(new Error('Salário não encontrado'));

            const result = await actionExcluirSalario(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Salário não encontrado');
        });
    });


    // =========================================================================
    // FOLHAS DE PAGAMENTO ACTIONS
    // =========================================================================

    // =========================================================================
    // actionListarFolhasPagamento
    // =========================================================================
    describe('actionListarFolhasPagamento', () => {
        it('deve listar folhas com sucesso', async () => {
            (mockService.listarFolhasPagamento as jest.Mock).mockResolvedValue(mockFolhasList);

            const result = await actionListarFolhasPagamento({});

            expect(result.success).toBe(true);
            expect(result.data).toMatchObject(mockFolhasList);
            expect(requireAuth).toHaveBeenCalledWith(['folhas_pagamento:listar']);
        });

        it('deve incluir totais quando solicitado', async () => {
            (mockService.listarFolhasPagamento as jest.Mock).mockResolvedValue(mockFolhasList);
            const mockTotais = { rascunho: 1, aprovada: 2, paga: 3 };
            (mockService.calcularTotaisPorStatus as jest.Mock).mockResolvedValue(mockTotais);

            const result = await actionListarFolhasPagamento({ incluirTotais: true });

            expect(result.success).toBe(true);
            expect(result.data?.totais).toEqual(mockTotais);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionListarFolhasPagamento({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
            expect(mockService.listarFolhasPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarFolhasPagamento as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionListarFolhasPagamento({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    // =========================================================================
    // actionBuscarFolhaPagamento
    // =========================================================================
    describe('actionBuscarFolhaPagamento', () => {
        it('deve buscar folha por ID com sucesso', async () => {
            (mockService.buscarFolhaPorId as jest.Mock).mockResolvedValue(mockFolha);

            const result = await actionBuscarFolhaPagamento(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockFolha);
            expect(mockService.buscarFolhaPorId).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando folha não encontrada', async () => {
            (mockService.buscarFolhaPorId as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarFolhaPagamento(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Folha de pagamento não encontrada');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionBuscarFolhaPagamento(1);

            expect(result.success).toBe(false);
            expect(mockService.buscarFolhaPorId).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionBuscarFolhaPorPeriodo
    // =========================================================================
    describe('actionBuscarFolhaPorPeriodo', () => {
        it('deve buscar folha por período com sucesso', async () => {
            (mockService.buscarFolhaPorPeriodo as jest.Mock).mockResolvedValue(mockFolha);

            const result = await actionBuscarFolhaPorPeriodo(6, 2025);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockFolha);
            expect(mockService.buscarFolhaPorPeriodo).toHaveBeenCalledWith(6, 2025);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionBuscarFolhaPorPeriodo(6, 2025);

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // actionGerarFolhaPagamento
    // =========================================================================
    describe('actionGerarFolhaPagamento', () => {
        it('deve gerar folha com sucesso e revalidar cache', async () => {
            (mockService.gerarFolhaPagamento as jest.Mock).mockResolvedValue(mockFolha);
            const now = new Date();
            const fd = buildFormData({
                mesReferencia: String(now.getMonth() + 1),
                anoReferencia: String(now.getFullYear()),
            });

            const result = await actionGerarFolhaPagamento(fd);

            expect(result.success).toBe(true);
            expect(mockService.gerarFolhaPagamento).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
            const fd = buildFormData({ mesReferencia: '6', anoReferencia: '2025' });

            const result = await actionGerarFolhaPagamento(fd);

            expect(result.success).toBe(false);
            expect(mockService.gerarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve rejeitar mês inválido (validação Zod)', async () => {
            const fd = buildFormData({ mesReferencia: '13', anoReferencia: '2025' });

            const result = await actionGerarFolhaPagamento(fd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.gerarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve rejeitar ano abaixo do mínimo (validação Zod)', async () => {
            const fd = buildFormData({ mesReferencia: '6', anoReferencia: '2019' });

            const result = await actionGerarFolhaPagamento(fd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.gerarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.gerarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Já existe folha'));
            const now = new Date();
            const fd = buildFormData({
                mesReferencia: String(now.getMonth() + 1),
                anoReferencia: String(now.getFullYear()),
            });

            const result = await actionGerarFolhaPagamento(fd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Já existe folha');
        });
    });

    // =========================================================================
    // actionPreviewGerarFolha
    // =========================================================================
    describe('actionPreviewGerarFolha', () => {
        it('deve retornar preview com sucesso', async () => {
            const mockPreview = { salariosVigentes: [], valorTotal: 0, totalFuncionarios: 0, periodoLabel: 'Junho/2025' };
            (mockService.previewGerarFolha as jest.Mock).mockResolvedValue(mockPreview);

            const result = await actionPreviewGerarFolha(6, 2025);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockPreview);
            expect(mockService.previewGerarFolha).toHaveBeenCalledWith(6, 2025);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionPreviewGerarFolha(6, 2025);

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // actionAprovarFolhaPagamento
    // =========================================================================
    describe('actionAprovarFolhaPagamento', () => {
        const validFd = buildFormData({
            contaBancariaId: '1',
            contaContabilId: '2',
        });

        it('deve aprovar folha com sucesso e revalidar cache', async () => {
            (mockService.aprovarFolhaPagamento as jest.Mock).mockResolvedValue({ ...mockFolha, status: 'aprovada' });

            const result = await actionAprovarFolhaPagamento(1, validFd);

            expect(result.success).toBe(true);
            expect(mockService.aprovarFolhaPagamento).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento/1');
            expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionAprovarFolhaPagamento(1, validFd);

            expect(result.success).toBe(false);
            expect(mockService.aprovarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve rejeitar contaBancariaId inválido (validação Zod)', async () => {
            const invalidFd = buildFormData({
                contaBancariaId: '0',
                contaContabilId: '2',
            });

            const result = await actionAprovarFolhaPagamento(1, invalidFd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.aprovarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.aprovarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Folha não encontrada'));

            const result = await actionAprovarFolhaPagamento(1, validFd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Folha não encontrada');
        });
    });

    // =========================================================================
    // actionPagarFolhaPagamento
    // =========================================================================
    describe('actionPagarFolhaPagamento', () => {
        const validFd = buildFormData({
            formaPagamento: 'pix',
            contaBancariaId: '1',
        });

        it('deve pagar folha com sucesso e revalidar cache', async () => {
            (mockService.pagarFolhaPagamento as jest.Mock).mockResolvedValue({ ...mockFolha, status: 'paga' });

            const result = await actionPagarFolhaPagamento(1, validFd);

            expect(result.success).toBe(true);
            expect(mockService.pagarFolhaPagamento).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
            expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionPagarFolhaPagamento(1, validFd);

            expect(result.success).toBe(false);
            expect(mockService.pagarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve rejeitar forma de pagamento inválida (validação Zod)', async () => {
            const invalidFd = buildFormData({
                formaPagamento: 'bitcoin',
                contaBancariaId: '1',
            });

            const result = await actionPagarFolhaPagamento(1, invalidFd);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockService.pagarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.pagarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Folha não aprovada'));

            const result = await actionPagarFolhaPagamento(1, validFd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Folha não aprovada');
        });
    });

    // =========================================================================
    // actionAtualizarFolhaPagamento
    // =========================================================================
    describe('actionAtualizarFolhaPagamento', () => {
        it('deve atualizar folha com sucesso', async () => {
            (mockService.atualizarFolhaPagamento as jest.Mock).mockResolvedValue(mockFolha);
            const fd = buildFormData({ observacoes: 'Nota atualizada' });

            const result = await actionAtualizarFolhaPagamento(1, fd);

            expect(result.success).toBe(true);
            expect(mockService.atualizarFolhaPagamento).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
            const fd = buildFormData({ observacoes: 'Nota' });

            const result = await actionAtualizarFolhaPagamento(1, fd);

            expect(result.success).toBe(false);
            expect(mockService.atualizarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Folha não encontrada'));
            const fd = buildFormData({ observacoes: 'Nota' });

            const result = await actionAtualizarFolhaPagamento(1, fd);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Folha não encontrada');
        });
    });

    // =========================================================================
    // actionVerificarCancelamentoFolha
    // =========================================================================
    describe('actionVerificarCancelamentoFolha', () => {
        it('deve verificar cancelamento com sucesso', async () => {
            const mockResult = { podeCancelar: true, status: 'rascunho', temLancamentosPagos: false };
            (mockService.podeCancelarFolha as jest.Mock).mockResolvedValue(mockResult);

            const result = await actionVerificarCancelamentoFolha(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockResult);
            expect(mockService.podeCancelarFolha).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionVerificarCancelamentoFolha(1);

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // actionObterResumoPagamento
    // =========================================================================
    describe('actionObterResumoPagamento', () => {
        it('deve obter resumo com sucesso', async () => {
            const mockResumo = { totalBruto: 10000, totalItens: 2, itensPendentes: 2, itensConfirmados: 0 };
            (mockService.calcularTotalAPagar as jest.Mock).mockResolvedValue(mockResumo);

            const result = await actionObterResumoPagamento(1);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockResumo);
            expect(mockService.calcularTotalAPagar).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionObterResumoPagamento(1);

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // actionCancelarFolhaPagamento
    // =========================================================================
    describe('actionCancelarFolhaPagamento', () => {
        it('deve cancelar folha com sucesso e revalidar cache', async () => {
            (mockService.cancelarFolhaPagamento as jest.Mock).mockResolvedValue({ ...mockFolha, status: 'cancelada' });

            const result = await actionCancelarFolhaPagamento(1, 'Motivo do cancelamento');

            expect(result.success).toBe(true);
            expect(mockService.cancelarFolhaPagamento).toHaveBeenCalledWith(1, 'Motivo do cancelamento');
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
            expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionCancelarFolhaPagamento(1);

            expect(result.success).toBe(false);
            expect(mockService.cancelarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.cancelarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Folha já paga'));

            const result = await actionCancelarFolhaPagamento(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Folha já paga');
        });
    });

    // =========================================================================
    // actionExcluirFolhaPagamento
    // =========================================================================
    describe('actionExcluirFolhaPagamento', () => {
        it('deve excluir folha com sucesso e revalidar cache', async () => {
            (mockService.deletarFolhaPagamento as jest.Mock).mockResolvedValue(undefined);

            const result = await actionExcluirFolhaPagamento(1);

            expect(result.success).toBe(true);
            expect(mockService.deletarFolhaPagamento).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/rh/folhas-pagamento');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionExcluirFolhaPagamento(1);

            expect(result.success).toBe(false);
            expect(mockService.deletarFolhaPagamento).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.deletarFolhaPagamento as jest.Mock).mockRejectedValue(new Error('Folha não encontrada'));

            const result = await actionExcluirFolhaPagamento(1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Folha não encontrada');
        });
    });
});
