/**
 * Tests for Captura Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, authorization, and cache revalidation.
 *
 * The captura module has two action files:
 * 1. comunica-cnj-actions.ts — uses `requireAuth` from ./utils (custom auth helper wrapping supabase + checkPermission)
 * 2. timeline-actions.ts — uses `authenticateRequest` from @/lib/auth + `checkPermission` from @/lib/auth/authorization
 *
 * Each action:
 * 1. Authenticates the user
 * 2. Checks permissions
 * 3. Delegates to service layer
 * 4. Returns { success, data?, error? }
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

// Mock auth (used by timeline-actions)
const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Captura',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock authorization (used by timeline-actions)
jest.mock('@/lib/auth/authorization', () => ({
    checkPermission: jest.fn(async () => true),
}));

// Mock requireAuth (used by comunica-cnj-actions)
jest.mock('../../actions/utils', () => ({
    requireAuth: jest.fn(async () => ({ userId: 42 })),
}));

// Mock comunica-cnj service
jest.mock('../../comunica-cnj/service', () => ({
    buscarComunicacoes: jest.fn(),
    listarComunicacoesCapturadas: jest.fn(),
    sincronizarComunicacoes: jest.fn(),
    obterCertidao: jest.fn(),
    vincularComunicacaoAExpediente: jest.fn(),
    listarTribunaisDisponiveis: jest.fn(),
}));

// Mock timeline services
jest.mock('../../services/timeline/timeline-capture.service', () => ({
    capturarTimeline: jest.fn(),
}));

jest.mock('../../services/timeline/timeline-relink.service', () => ({
    relinkBackblazeDocumentos: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';
import { requireAuth } from '../../actions/utils';

// Import REAL actions (after mocks)
import {
    actionConsultarComunicacoes,
    actionListarComunicacoesCapturadas,
    actionSincronizarComunicacoes,
    actionObterCertidao,
    actionVincularExpediente,
    actionListarTribunaisDisponiveis,
} from '../../actions/comunica-cnj-actions';

import {
    actionCapturarTimeline,
    actionRelinkBackblaze,
} from '../../actions/timeline-actions';

// Import mocked services
import * as mockCnjService from '../../comunica-cnj/service';
import { capturarTimeline } from '../../services/timeline/timeline-capture.service';
import { relinkBackblazeDocumentos } from '../../services/timeline/timeline-relink.service';


// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockConsultaResult = {
    comunicacoes: [
        {
            id: 1,
            hash: 'abc123',
            numeroProcesso: '00012345620245010001',
            siglaTribunal: 'TRT1',
            tipoComunicacao: 'Intimação',
            dataDisponibilizacao: '2025-01-15',
        },
    ],
    paginacao: { pagina: 1, itensPorPagina: 100, total: 1, totalPaginas: 1 },
    rateLimit: { limit: 100, remaining: 99 },
};

const mockComunicacoesList = {
    data: [{ id: 1, hash: 'abc123', numeroProcesso: '00012345620245010001' }],
    total: 1,
    page: 1,
    limit: 50,
};

const mockSincronizacaoResult = {
    success: true,
    stats: { total: 5, novos: 3, duplicados: 2, vinculados: 1, expedientesCriados: 0, erros: 0 },
};

const mockTribunais = [
    { id: 'TRT1', nome: 'TRT da 1ª Região', sigla: 'TRT1', jurisdicao: 'RJ' },
];

const mockTimelineResult = {
    totalItens: 10,
    totalBaixadosSucesso: 8,
    documentosBaixados: [
        { detalhes: { id: 1, descricao: 'Doc 1' }, pdf: Buffer.from('pdf'), erro: null },
    ],
};

const mockRelinkResult = {
    totalNoBackblaze: 5,
    totalRelinkados: 3,
    totalJaVinculados: 1,
    totalSemMatch: 1,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Captura Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (checkPermission as jest.Mock).mockResolvedValue(true);
        (requireAuth as jest.Mock).mockResolvedValue({ userId: 42 });
    });

    // =========================================================================
    // Comunica CNJ Actions
    // =========================================================================

    describe('actionConsultarComunicacoes', () => {
        const validParams = { siglaTribunal: 'TRT1', pagina: 1, itensPorPagina: 100 as const };

        it('deve consultar comunicações com sucesso', async () => {
            (mockCnjService.buscarComunicacoes as jest.Mock).mockResolvedValue({
                success: true,
                data: mockConsultaResult,
            });

            const result = await actionConsultarComunicacoes(validParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockConsultaResult);
            expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:consultar']);
            expect(mockCnjService.buscarComunicacoes).toHaveBeenCalledWith(validParams);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionConsultarComunicacoes(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
            expect(mockCnjService.buscarComunicacoes).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockCnjService.buscarComunicacoes as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'API indisponível' },
            });

            const result = await actionConsultarComunicacoes(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('API indisponível');
        });

        it('deve retornar erro quando service lança exceção', async () => {
            (mockCnjService.buscarComunicacoes as jest.Mock).mockRejectedValue(
                new Error('Timeout')
            );

            const result = await actionConsultarComunicacoes(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Timeout');
        });
    });

    describe('actionListarComunicacoesCapturadas', () => {
        const validParams = { page: 1, limit: 50 };

        it('deve listar comunicações capturadas com sucesso', async () => {
            (mockCnjService.listarComunicacoesCapturadas as jest.Mock).mockResolvedValue({
                success: true,
                data: mockComunicacoesList,
            });

            const result = await actionListarComunicacoesCapturadas(validParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockComunicacoesList);
            expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:listar']);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionListarComunicacoesCapturadas(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockCnjService.listarComunicacoesCapturadas as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro no banco' },
            });

            const result = await actionListarComunicacoesCapturadas(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro no banco');
        });
    });

    describe('actionSincronizarComunicacoes', () => {
        const validParams = { numeroOab: '12345', ufOab: 'RJ' };

        it('deve sincronizar comunicações com sucesso', async () => {
            (mockCnjService.sincronizarComunicacoes as jest.Mock).mockResolvedValue({
                success: true,
                data: mockSincronizacaoResult,
            });

            const result = await actionSincronizarComunicacoes(validParams);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSincronizacaoResult);
            expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:capturar']);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionSincronizarComunicacoes(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockCnjService.sincronizarComunicacoes as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro de sincronização' },
            });

            const result = await actionSincronizarComunicacoes(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro de sincronização');
        });
    });

    describe('actionObterCertidao', () => {
        it('deve obter certidão em base64 com sucesso', async () => {
            const mockBuffer = Buffer.from('pdf-content');
            (mockCnjService.obterCertidao as jest.Mock).mockResolvedValue({
                success: true,
                data: mockBuffer,
            });

            const result = await actionObterCertidao('hash123');

            expect(result.success).toBe(true);
            expect(result.data).toBe(mockBuffer.toString('base64'));
            expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:visualizar']);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionObterCertidao('hash123');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('deve retornar erro quando certidão não encontrada', async () => {
            (mockCnjService.obterCertidao as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Certidão não encontrada' },
            });

            const result = await actionObterCertidao('invalid-hash');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Certidão não encontrada');
        });
    });

    describe('actionVincularExpediente', () => {
        it('deve vincular expediente com sucesso', async () => {
            (mockCnjService.vincularComunicacaoAExpediente as jest.Mock).mockResolvedValue({
                success: true,
            });

            const result = await actionVincularExpediente(1, 10);

            expect(result.success).toBe(true);
            expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:editar', 'expedientes:editar']);
            expect(mockCnjService.vincularComunicacaoAExpediente).toHaveBeenCalledWith(1, 10);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionVincularExpediente(1, 10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockCnjService.vincularComunicacaoAExpediente as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Comunicação não encontrada' },
            });

            const result = await actionVincularExpediente(999, 10);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Comunicação não encontrada');
        });
    });

    describe('actionListarTribunaisDisponiveis', () => {
        it('deve listar tribunais com sucesso', async () => {
            (mockCnjService.listarTribunaisDisponiveis as jest.Mock).mockResolvedValue({
                success: true,
                data: mockTribunais,
            });

            const result = await actionListarTribunaisDisponiveis();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTribunais);
            expect(requireAuth).toHaveBeenCalledWith([]);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            const result = await actionListarTribunaisDisponiveis();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockCnjService.listarTribunaisDisponiveis as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro ao listar tribunais' },
            });

            const result = await actionListarTribunaisDisponiveis();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Erro ao listar tribunais');
        });
    });

    // =========================================================================
    // Timeline Actions
    // =========================================================================

    describe('actionCapturarTimeline', () => {
        const validParams = {
            trtCodigo: 'TRT3' as const,
            grau: 'primeiro_grau' as const,
            processoId: 'pje-123',
            numeroProcesso: '0010702-80.2025.5.03.0111',
            advogadoId: 1,
        };

        it('deve capturar timeline com sucesso e revalidar cache', async () => {
            (capturarTimeline as jest.Mock).mockResolvedValue(mockTimelineResult);

            const result = await actionCapturarTimeline(validParams);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'acervo', 'editar');
            expect(capturarTimeline).toHaveBeenCalledWith(validParams);
            expect(revalidatePath).toHaveBeenCalledWith(
                `/app/processos/${validParams.processoId}/timeline`
            );
            expect(revalidatePath).toHaveBeenCalledWith(
                `/app/processos/${validParams.processoId}`
            );
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionCapturarTimeline(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(capturarTimeline).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionCapturarTimeline(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para capturar timeline');
            expect(capturarTimeline).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service lança exceção', async () => {
            (capturarTimeline as jest.Mock).mockRejectedValue(new Error('PJE offline'));

            const result = await actionCapturarTimeline(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('PJE offline');
        });
    });

    describe('actionRelinkBackblaze', () => {
        it('deve relinkar documentos com sucesso e revalidar cache', async () => {
            (relinkBackblazeDocumentos as jest.Mock).mockResolvedValue(mockRelinkResult);

            const result = await actionRelinkBackblaze('pje-123', '0010702-80.2025.5.03.0111');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockRelinkResult);
            expect(getCurrentUser).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'acervo', 'editar');
            expect(relinkBackblazeDocumentos).toHaveBeenCalledWith(
                'pje-123',
                '0010702-80.2025.5.03.0111'
            );
            expect(revalidatePath).toHaveBeenCalledWith('/app/processos/pje-123');
        });

        it('deve retornar erro quando não autenticado', async () => {
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await actionRelinkBackblaze('pje-123', '0010702-80.2025.5.03.0111');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
            expect(relinkBackblazeDocumentos).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando sem permissão', async () => {
            (checkPermission as jest.Mock).mockResolvedValue(false);

            const result = await actionRelinkBackblaze('pje-123', '0010702-80.2025.5.03.0111');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Sem permissão para relinkar documentos');
            expect(relinkBackblazeDocumentos).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service lança exceção', async () => {
            (relinkBackblazeDocumentos as jest.Mock).mockRejectedValue(
                new Error('Backblaze indisponível')
            );

            const result = await actionRelinkBackblaze('pje-123', '0010702-80.2025.5.03.0111');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Backblaze indisponível');
        });
    });
});
