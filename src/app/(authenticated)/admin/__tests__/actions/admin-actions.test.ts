/**
 * Tests for Admin Server Actions
 *
 * Tests real exported actions with mocked dependencies (auth, repository, cache, fs).
 * Admin actions use requireAuth from @/lib/auth/server directly and check user.roles for "admin".
 *
 * Each action:
 * 1. Calls requireAuth() for authentication
 * 2. Checks user.roles?.includes("admin") for authorization
 * 3. Delegates to repository/service layer
 * 4. Returns ActionResult<T> ({ success, data?, error? })
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('next/cache');
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Mock auth
const mockAdminUser = { id: 123, roles: ['admin'] };
const mockNonAdminUser = { id: 456, roles: [] };

jest.mock('@/lib/auth/server', () => ({
    requireAuth: jest.fn(async () => ({ user: mockAdminUser })),
}));

// Mock redis cache-utils
jest.mock('@/lib/redis/cache-utils', () => ({
    withCache: jest.fn(async (_key: string, fn: () => Promise<unknown>) => fn()),
    generateCacheKey: jest.fn((prefix: string, params?: Record<string, unknown>) =>
        params ? `${prefix}:${JSON.stringify(params)}` : prefix
    ),
    CACHE_PREFIXES: { admin: 'admin' },
}));

// Mock repository
jest.mock('../../repositories/metricas-db-repository', () => ({
    buscarCacheHitRate: jest.fn(),
    buscarQueriesLentas: jest.fn(),
    buscarTabelasSequentialScan: jest.fn(),
    buscarBloatTabelas: jest.fn(),
    buscarIndicesNaoUtilizados: jest.fn(),
    buscarMetricasDiskIO: jest.fn(),
}));

// Mock management API
jest.mock('@/lib/supabase/management-api', () => ({
    obterMetricasDiskIO: jest.fn(),
    obterComputeAtual: jest.fn(),
}));

// Mock upgrade-advisor service
jest.mock('../../services/upgrade-advisor', () => ({
    avaliarNecessidadeUpgrade: jest.fn(),
}));

// Mock fs
jest.mock('fs/promises', () => ({
    readFile: jest.fn(),
    writeFile: jest.fn(),
}));
jest.mock('fs', () => ({
    existsSync: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { requireAuth } from '@/lib/auth/server';
import { withCache } from '@/lib/redis/cache-utils';
import * as repo from '../../repositories/metricas-db-repository';
import * as managementApi from '@/lib/supabase/management-api';
import { avaliarNecessidadeUpgrade } from '../../services/upgrade-advisor';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

import { actionObterMetricasDB } from '../../actions/metricas-actions';
import { actionAvaliarUpgrade, actionDocumentarDecisao } from '../../actions/upgrade-actions';


// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCacheHitRate = [{ name: 'index', ratio: 99.5 }, { name: 'table', ratio: 98.2 }];
const mockQueriesLentas = [
    { rolname: 'postgres', query: 'SELECT * FROM big_table', calls: 100, total_time: 5000, max_time: 200 },
];
const mockTabelasSeqScan = [
    { relname: 'usuarios', seq_scan: 500, seq_tup_read: 10000, idx_scan: 50, avg_seq_tup: 20, n_live_tup: 1000 },
];
const mockBloat = [
    { tabela: 'processos', tamanho_total: '1 GB', dead_tuples: 5000, live_tuples: 100000, bloat_percent: 5, last_vacuum: null, last_autovacuum: '2025-01-01' },
];
const mockIndicesNaoUtilizados = [
    { relname: 'processos', indexrelname: 'idx_old', idx_scan: 0, idx_tup_read: 0, idx_tup_fetch: 0 },
];
const mockDiskIOResult = {
    metrics: {
        disk_io_budget_percent: 75,
        disk_io_consumption_mbps: 50,
        disk_io_limit_mbps: 87,
        disk_iops_consumption: 1500,
        disk_iops_limit: 2085,
        compute_tier: 'small',
        timestamp: '2025-01-09T12:00:00Z',
    },
    status: 'ok' as const,
};

const mockUpgradeRecommendation = {
    should_upgrade: false,
    recommended_tier: null,
    reasons: ['✅ Métricas dentro dos parâmetros esperados'],
    estimated_cost_increase: 0,
    estimated_downtime_minutes: 2,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Admin Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (requireAuth as jest.Mock).mockResolvedValue({ user: mockAdminUser });
    });

    // =========================================================================
    // actionObterMetricasDB
    // =========================================================================
    describe('actionObterMetricasDB', () => {
        beforeEach(() => {
            (repo.buscarCacheHitRate as jest.Mock).mockResolvedValue(mockCacheHitRate);
            (repo.buscarQueriesLentas as jest.Mock).mockResolvedValue(mockQueriesLentas);
            (repo.buscarTabelasSequentialScan as jest.Mock).mockResolvedValue(mockTabelasSeqScan);
            (repo.buscarBloatTabelas as jest.Mock).mockResolvedValue(mockBloat);
            (repo.buscarIndicesNaoUtilizados as jest.Mock).mockResolvedValue(mockIndicesNaoUtilizados);
            (repo.buscarMetricasDiskIO as jest.Mock).mockResolvedValue(mockDiskIOResult);
        });

        it('deve retornar métricas com sucesso para admin autenticado', async () => {
            const result = await actionObterMetricasDB();

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.cacheHitRate).toEqual(mockCacheHitRate);
            expect(result.data?.queriesLentas).toEqual(mockQueriesLentas);
            expect(result.data?.tabelasSeqScan).toEqual(mockTabelasSeqScan);
            expect(result.data?.bloat).toEqual(mockBloat);
            expect(result.data?.indicesNaoUtilizados).toEqual(mockIndicesNaoUtilizados);
            expect(result.data?.diskIO).toEqual(mockDiskIOResult.metrics);
            expect(result.data?.diskIOStatus).toBe('ok');
            expect(result.data?.timestamp).toBeDefined();
        });

        it('deve chamar requireAuth para autenticação', async () => {
            await actionObterMetricasDB();

            expect(requireAuth).toHaveBeenCalledWith([]);
        });

        it('deve negar acesso quando usuário não é admin', async () => {
            (requireAuth as jest.Mock).mockResolvedValue({ user: mockNonAdminUser });

            const result = await actionObterMetricasDB();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Acesso negado');
            expect(repo.buscarCacheHitRate).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando requireAuth lança exceção (não autenticado)', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Não autenticado'));

            const result = await actionObterMetricasDB();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve delegar ao repository via withCache', async () => {
            await actionObterMetricasDB();

            expect(withCache).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Function),
                60
            );
        });

        it('deve retornar erro quando repository falha', async () => {
            (withCache as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

            const result = await actionObterMetricasDB();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Redis connection failed');
        });
    });

    // =========================================================================
    // actionAvaliarUpgrade
    // =========================================================================
    describe('actionAvaliarUpgrade', () => {
        beforeEach(() => {
            (repo.buscarCacheHitRate as jest.Mock).mockResolvedValue(mockCacheHitRate);
            (managementApi.obterMetricasDiskIO as jest.Mock).mockResolvedValue({
                status: 'ok',
                metrics: { disk_io_budget_percent: 75, compute_tier: 'small' },
            });
            (managementApi.obterComputeAtual as jest.Mock).mockResolvedValue({ name: 'small' });
            (avaliarNecessidadeUpgrade as jest.Mock).mockReturnValue(mockUpgradeRecommendation);
        });

        it('deve retornar recomendação de upgrade com sucesso', async () => {
            const result = await actionAvaliarUpgrade();

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.should_upgrade).toBe(false);
        });

        it('deve chamar requireAuth para autenticação', async () => {
            await actionAvaliarUpgrade();

            expect(requireAuth).toHaveBeenCalledWith([]);
        });

        it('deve negar acesso quando usuário não é admin', async () => {
            (requireAuth as jest.Mock).mockResolvedValue({ user: mockNonAdminUser });

            const result = await actionAvaliarUpgrade();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Acesso negado');
            expect(repo.buscarCacheHitRate).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando requireAuth lança exceção', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Não autenticado'));

            const result = await actionAvaliarUpgrade();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve delegar ao service avaliarNecessidadeUpgrade com métricas corretas', async () => {
            await actionAvaliarUpgrade();

            // Cache hit rate médio: (99.5 + 98.2) / 2 = 98.85
            const expectedCacheHitRate = (99.5 + 98.2) / 2;
            expect(avaliarNecessidadeUpgrade).toHaveBeenCalledWith(
                expectedCacheHitRate,
                75,
                'small'
            );
        });

        it('deve retornar erro quando buscarCacheHitRate falha', async () => {
            (repo.buscarCacheHitRate as jest.Mock).mockRejectedValue(new Error('DB error'));

            const result = await actionAvaliarUpgrade();

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });

        it('deve retornar erro quando management API falha', async () => {
            (managementApi.obterMetricasDiskIO as jest.Mock).mockRejectedValue(new Error('API timeout'));

            const result = await actionAvaliarUpgrade();

            expect(result.success).toBe(false);
            expect(result.error).toBe('API timeout');
        });
    });

    // =========================================================================
    // actionDocumentarDecisao
    // =========================================================================
    describe('actionDocumentarDecisao', () => {
        const validDecisao = 'manter' as const;
        const validMetricas = {
            cache_hit_rate_antes: 94.0,
            cache_hit_rate_depois: 99.5,
            disk_io_antes: 92,
            disk_io_depois: 75,
            queries_lentas_antes: 50,
            queries_lentas_depois: 5,
        };
        const validJustificativa = 'Otimizações de cache aplicadas com sucesso';

        beforeEach(() => {
            (existsSync as jest.Mock).mockReturnValue(true);
            (readFile as jest.Mock).mockResolvedValue(`
## 📈 Métricas Pós-Otimização

### Cache Hit Rate
- **Antes**: [PREENCHER]

---

## 🔄 Decisão de Upgrade de Compute
[PREENCHER]

---

## 📝 Histórico de Mudanças

| Data | Tipo | Descrição | Impacto |
|------|------|-----------|---------|
`);
            (writeFile as jest.Mock).mockResolvedValue(undefined);
        });

        it('deve documentar decisão com sucesso', async () => {
            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(true);
            expect(existsSync).toHaveBeenCalled();
            expect(readFile).toHaveBeenCalled();
            expect(writeFile).toHaveBeenCalled();
        });

        it('deve chamar requireAuth para autenticação', async () => {
            await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(requireAuth).toHaveBeenCalledWith([]);
        });

        it('deve negar acesso quando usuário não é admin', async () => {
            (requireAuth as jest.Mock).mockResolvedValue({ user: mockNonAdminUser });

            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Acesso negado');
            expect(existsSync).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando requireAuth lança exceção', async () => {
            (requireAuth as jest.Mock).mockRejectedValue(new Error('Não autenticado'));

            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Não autenticado');
        });

        it('deve retornar erro quando arquivo não existe', async () => {
            (existsSync as jest.Mock).mockReturnValue(false);

            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(false);
            expect(result.error).toContain('não encontrado');
            expect(readFile).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando leitura do arquivo falha', async () => {
            (readFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('deve retornar erro quando escrita do arquivo falha', async () => {
            (writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

            const result = await actionDocumentarDecisao(validDecisao, validMetricas, validJustificativa);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Disk full');
        });

        it('deve aceitar diferentes tipos de decisão', async () => {
            for (const decisao of ['manter', 'upgrade_small', 'upgrade_medium', 'upgrade_large'] as const) {
                jest.clearAllMocks();
                (requireAuth as jest.Mock).mockResolvedValue({ user: mockAdminUser });
                (existsSync as jest.Mock).mockReturnValue(true);
                (readFile as jest.Mock).mockResolvedValue('# Doc\n---\n');
                (writeFile as jest.Mock).mockResolvedValue(undefined);

                const result = await actionDocumentarDecisao(decisao, validMetricas, validJustificativa);

                expect(result.success).toBe(true);
            }
        });
    });
});
