/**
 * Tests for Entrevistas Trabalhistas Server Actions
 *
 * Tests real exported actions with mocked service layer, repository, and cache revalidation.
 *
 * The entrevistas-trabalhistas module has four action files:
 * 1. entrevista-actions.ts — Core CRUD actions delegating to service layer
 * 2. anexo-actions.ts — Attachment upload/delete actions using repository + Zod validation
 * 3. consolidacao-ia-actions.ts — AI consolidation action using DifyService + repository
 * 4. integracao-peticao-actions.ts — Petition integration action using DifyService + repository
 *
 * These actions do NOT use authenticatedAction/safe-action.
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

// Mock service layer
jest.mock('../../service', () => ({
    iniciarEntrevista: jest.fn(),
    salvarModulo: jest.fn(),
    finalizarEntrevista: jest.fn(),
    reabrirEntrevista: jest.fn(),
}));

// Mock repository (used by anexo-actions and consolidacao-ia-actions)
jest.mock('../../repository', () => ({
    createAnexo: jest.fn(),
    deleteAnexo: jest.fn(),
    findAnexos: jest.fn(),
    findById: jest.fn(),
}));

// Mock storage (used by uploadArquivoAnexoAction)
jest.mock('@/lib/storage/supabase-storage.service', () => ({
    uploadToSupabase: jest.fn(),
}));

// Mock DifyService (used by consolidacao-ia and integracao-peticao)
jest.mock('@/lib/dify/service', () => ({
    DifyService: {
        createAsync: jest.fn(),
    },
}));

// Mock Supabase service client (used by integracao-peticao-actions)
jest.mock('@/lib/supabase/service-client', () => ({
    createServiceClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({ data: [], error: null }),
        })),
    })),
}));

import { revalidatePath } from 'next/cache';

// Import REAL actions (after mocks)
import {
    iniciarEntrevistaAction,
    salvarModuloAction,
    finalizarEntrevistaAction,
    reabrirEntrevistaAction,
} from '../../actions/entrevista-actions';

import {
    uploadAnexoAction,
    deleteAnexoAction,
} from '../../actions/anexo-actions';

import { consolidarEntrevistaIAAction } from '../../actions/consolidacao-ia-actions';
import { enviarParaIntegracaoPeticaoAction } from '../../actions/integracao-peticao-actions';

// Import mocked modules
import * as mockService from '../../service';
import * as mockRepository from '../../repository';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockEntrevista = {
    id: 1,
    contratoId: 10,
    tipoLitigio: 'trabalhista_classico' as const,
    status: 'em_andamento' as const,
    moduloAtual: 'vinculo',
    respostas: {},
    testemunhasMapeadas: false,
    createdBy: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const mockAnexo = {
    id: 1,
    entrevistaId: 1,
    modulo: 'vinculo',
    tipoAnexo: 'documento',
    arquivoUrl: 'https://storage.example.com/file.pdf',
    descricao: 'Contrato de trabalho',
    createdAt: '2025-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests — entrevista-actions.ts
// ---------------------------------------------------------------------------
describe('Entrevista Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // iniciarEntrevistaAction
    // =========================================================================
    describe('iniciarEntrevistaAction', () => {
        it('deve iniciar entrevista com sucesso e revalidar cache', async () => {
            (mockService.iniciarEntrevista as jest.Mock).mockResolvedValue({
                success: true,
                data: mockEntrevista,
            });

            const result = await iniciarEntrevistaAction(10, 'trabalhista_classico', 'domestica', 1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockEntrevista);
                expect(result.message).toContain('sucesso');
            }
            expect(mockService.iniciarEntrevista).toHaveBeenCalledWith({
                contratoId: 10,
                tipoLitigio: 'trabalhista_classico',
                perfilReclamante: 'domestica',
                createdBy: 1,
            });
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.iniciarEntrevista as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Já existe entrevista para este contrato' },
            });

            const result = await iniciarEntrevistaAction(10, 'trabalhista_classico');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Já existe entrevista para este contrato');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.iniciarEntrevista as jest.Mock).mockRejectedValue(
                new Error('DB connection error'),
            );

            const result = await iniciarEntrevistaAction(10, 'trabalhista_classico');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB connection error');
            }
        });
    });

    // =========================================================================
    // salvarModuloAction
    // =========================================================================
    describe('salvarModuloAction', () => {
        const respostasModulo = { ctps_assinada: true, funcao_cargo: 'Analista' };

        it('deve salvar módulo com sucesso e revalidar cache', async () => {
            (mockService.salvarModulo as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockEntrevista, respostas: { vinculo: respostasModulo } },
            });

            const result = await salvarModuloAction(1, 10, 'vinculo', respostasModulo, false);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toBe('Rascunho salvo');
            }
            expect(mockService.salvarModulo).toHaveBeenCalledWith(
                1, 'vinculo', respostasModulo, false, undefined,
            );
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar mensagem de avanço quando avancar=true', async () => {
            (mockService.salvarModulo as jest.Mock).mockResolvedValue({
                success: true,
                data: mockEntrevista,
            });

            const result = await salvarModuloAction(1, 10, 'vinculo', respostasModulo, true);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toContain('avançando');
            }
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.salvarModulo as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Entrevista não encontrada' },
            });

            const result = await salvarModuloAction(1, 10, 'vinculo', respostasModulo);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Entrevista não encontrada');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.salvarModulo as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await salvarModuloAction(1, 10, 'vinculo', respostasModulo);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Timeout');
            }
        });
    });

    // =========================================================================
    // finalizarEntrevistaAction
    // =========================================================================
    describe('finalizarEntrevistaAction', () => {
        it('deve finalizar entrevista com sucesso e revalidar cache', async () => {
            (mockService.finalizarEntrevista as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockEntrevista, status: 'concluida' },
            });

            const result = await finalizarEntrevistaAction(1, 10, true);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toContain('finalizada');
            }
            expect(mockService.finalizarEntrevista).toHaveBeenCalledWith(1, true);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.finalizarEntrevista as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Campos obrigatórios não preenchidos' },
            });

            const result = await finalizarEntrevistaAction(1, 10, false);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Campos obrigatórios não preenchidos');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.finalizarEntrevista as jest.Mock).mockRejectedValue(
                new Error('DB error'),
            );

            const result = await finalizarEntrevistaAction(1, 10, true);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB error');
            }
        });
    });

    // =========================================================================
    // reabrirEntrevistaAction
    // =========================================================================
    describe('reabrirEntrevistaAction', () => {
        it('deve reabrir entrevista com sucesso e revalidar cache', async () => {
            (mockService.reabrirEntrevista as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockEntrevista, status: 'em_andamento' },
            });

            const result = await reabrirEntrevistaAction(1, 10);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toContain('reaberta');
            }
            expect(mockService.reabrirEntrevista).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.reabrirEntrevista as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Entrevista não está concluída' },
            });

            const result = await reabrirEntrevistaAction(1, 10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Entrevista não está concluída');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.reabrirEntrevista as jest.Mock).mockRejectedValue(
                new Error('Connection refused'),
            );

            const result = await reabrirEntrevistaAction(1, 10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Connection refused');
            }
        });
    });
});

// ---------------------------------------------------------------------------
// Tests — anexo-actions.ts
// ---------------------------------------------------------------------------
describe('Anexo Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // uploadAnexoAction
    // =========================================================================
    describe('uploadAnexoAction', () => {
        it('deve fazer upload de anexo com sucesso e revalidar cache', async () => {
            (mockRepository.createAnexo as jest.Mock).mockResolvedValue({
                success: true,
                data: mockAnexo,
            });

            const result = await uploadAnexoAction(
                1, 10, 'vinculo', undefined, 'documento',
                'https://storage.example.com/file.pdf', 'Contrato de trabalho',
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toContain('sucesso');
            }
            expect(mockRepository.createAnexo).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve rejeitar input com URL inválida (validação Zod)', async () => {
            const result = await uploadAnexoAction(
                1, 10, 'vinculo', undefined, 'documento',
                'not-a-url',
            );

            expect(result.success).toBe(false);
            expect(mockRepository.createAnexo).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com módulo vazio (validação Zod)', async () => {
            const result = await uploadAnexoAction(
                1, 10, '', undefined, 'documento',
                'https://storage.example.com/file.pdf',
            );

            expect(result.success).toBe(false);
            expect(mockRepository.createAnexo).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando repository falha', async () => {
            (mockRepository.createAnexo as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro ao salvar anexo' },
            });

            const result = await uploadAnexoAction(
                1, 10, 'vinculo', undefined, 'documento',
                'https://storage.example.com/file.pdf',
            );

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
            }
        });

        it('deve tratar exceção inesperada', async () => {
            (mockRepository.createAnexo as jest.Mock).mockRejectedValue(
                new Error('DB error'),
            );

            const result = await uploadAnexoAction(
                1, 10, 'vinculo', undefined, 'documento',
                'https://storage.example.com/file.pdf',
            );

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB error');
            }
        });
    });

    // =========================================================================
    // deleteAnexoAction
    // =========================================================================
    describe('deleteAnexoAction', () => {
        it('deve excluir anexo com sucesso e revalidar cache', async () => {
            (mockRepository.deleteAnexo as jest.Mock).mockResolvedValue({
                success: true,
                data: null,
            });

            const result = await deleteAnexoAction(1, 10);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.message).toContain('excluído');
            }
            expect(mockRepository.deleteAnexo).toHaveBeenCalledWith(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/contratos/10');
        });

        it('deve retornar erro quando repository falha', async () => {
            (mockRepository.deleteAnexo as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Anexo não encontrado' },
            });

            const result = await deleteAnexoAction(1, 10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
            }
        });

        it('deve tratar exceção inesperada', async () => {
            (mockRepository.deleteAnexo as jest.Mock).mockRejectedValue(
                new Error('DB error'),
            );

            const result = await deleteAnexoAction(1, 10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB error');
            }
        });
    });
});

// ---------------------------------------------------------------------------
// Tests — consolidacao-ia-actions.ts
// ---------------------------------------------------------------------------
describe('Consolidação IA Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('consolidarEntrevistaIAAction', () => {
        it('deve retornar fallback local quando DifyService não está disponível', async () => {
            (mockRepository.findAnexos as jest.Mock).mockResolvedValue({
                success: true,
                data: [],
            });

            const respostas = {
                vinculo: { remuneracao_mensal: '5000', ctps_assinada: true },
                ruptura: { motivo: 'demissao_sem_justa_causa' },
            };

            const result = await consolidarEntrevistaIAAction(1, respostas as any);

            expect(result.success).toBe(true);
            expect(result.relatoConsolidado).toBeDefined();
        });

        it('deve detectar inconsistência quando remuneração não informada', async () => {
            (mockRepository.findAnexos as jest.Mock).mockResolvedValue({
                success: true,
                data: [],
            });

            const respostas = {
                vinculo: { ctps_assinada: true },
            };

            const result = await consolidarEntrevistaIAAction(1, respostas as any);

            expect(result.success).toBe(true);
            expect(result.inconsistencias).toBeDefined();
            expect(result.inconsistencias!.length).toBeGreaterThan(0);
        });

        it('deve retornar erro quando exceção inesperada ocorre', async () => {
            (mockRepository.findAnexos as jest.Mock).mockRejectedValue(
                new Error('Falha crítica'),
            );

            const result = await consolidarEntrevistaIAAction(1, {} as any);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Falha crítica');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests — integracao-peticao-actions.ts
// ---------------------------------------------------------------------------
describe('Integração Petição Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('enviarParaIntegracaoPeticaoAction', () => {
        it('deve retornar erro quando entrevista não é encontrada', async () => {
            (mockRepository.findById as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Entrevista não encontrada' },
            });

            const result = await enviarParaIntegracaoPeticaoAction(999);

            expect(result.success).toBe(false);
            expect(result.message).toContain('nao encontrada');
        });

        it('deve retornar payload pronto quando nenhum assistente Dify é encontrado', async () => {
            (mockRepository.findById as jest.Mock).mockResolvedValue({
                success: true,
                data: mockEntrevista,
            });
            (mockRepository.findAnexos as jest.Mock).mockResolvedValue({
                success: true,
                data: [],
            });

            const result = await enviarParaIntegracaoPeticaoAction(1);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Payload pronto');
        });

        it('deve tratar exceção inesperada', async () => {
            (mockRepository.findById as jest.Mock).mockRejectedValue(
                new Error('Connection refused'),
            );

            const result = await enviarParaIntegracaoPeticaoAction(1);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Connection refused');
        });
    });
});
