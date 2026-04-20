/**
 * Tests for Captura Server Actions (Timeline)
 *
 * Usa `authenticateRequest` from @/lib/auth + `checkPermission` from @/lib/auth/authorization.
 *
 * Actions de Comunica CNJ foram movidas para comunica-cnj/__tests__/actions/
 * após migração do módulo em 2026-04-20.
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

const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Captura',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

jest.mock('@/lib/auth/authorization', () => ({
    checkPermission: jest.fn(async () => true),
}));

jest.mock('../../services/timeline/timeline-capture.service', () => ({
    capturarTimeline: jest.fn(),
}));

jest.mock('../../services/timeline/timeline-relink.service', () => ({
    relinkBackblazeDocumentos: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';

import {
    actionCapturarTimeline,
    actionRelinkBackblaze,
} from '../../actions/timeline-actions';

import { capturarTimeline } from '../../services/timeline/timeline-capture.service';
import { relinkBackblazeDocumentos } from '../../services/timeline/timeline-relink.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
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
describe('Captura Timeline Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
        (checkPermission as jest.Mock).mockResolvedValue(true);
    });

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
