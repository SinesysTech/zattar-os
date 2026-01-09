import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { actionObterMetricasDB } from "../../actions/metricas-actions";
import { actionAvaliarUpgrade, actionDocumentarDecisao } from "../../actions/upgrade-actions";

// Mock modules
jest.mock("@/lib/auth/server");
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/redis/cache-utils");
jest.mock("../../repositories/metricas-db-repository");
jest.mock("@/lib/supabase/management-api");
jest.mock("fs/promises");

describe("metricas-actions", () => {
  const mockUser = { id: "user-123" };
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock requireAuth
    (require("@/lib/auth/server") as any).requireAuth = jest.fn().mockResolvedValue({ user: mockUser });
    
    // Mock createClient
    (require("@/lib/supabase/server") as any).createClient = jest.fn().mockResolvedValue(mockSupabase);
    
    // Mock super_admin check
    mockSupabase.single.mockResolvedValue({ data: { is_super_admin: true }, error: null });
  });

  describe("actionObterMetricasDB", () => {
    it("deve retornar todas as métricas incluindo diskIO", async () => {
      const mockCacheHitRate = [{ name: "index", ratio: 99.5 }];
      const mockQueriesLentas = [{ rolname: "postgres", query: "SELECT *", calls: 100, total_time: 1000, max_time: 50 }];
      const mockDiskIO = {
        disk_io_budget_percent: 75,
        disk_io_consumption_mbps: 50,
        disk_io_limit_mbps: 87,
        disk_iops_consumption: 1500,
        disk_iops_limit: 2085,
        compute_tier: "small",
        timestamp: "2026-01-09T12:00:00Z",
      };

      // Mock repository functions
      const repo = require("../../repositories/metricas-db-repository");
      repo.buscarCacheHitRate = jest.fn().mockResolvedValue(mockCacheHitRate);
      repo.buscarQueriesLentas = jest.fn().mockResolvedValue(mockQueriesLentas);
      repo.buscarTabelasSequentialScan = jest.fn().mockResolvedValue([]);
      repo.buscarBloatTabelas = jest.fn().mockResolvedValue([]);
      repo.buscarIndicesNaoUtilizados = jest.fn().mockResolvedValue([]);
      repo.buscarMetricasDiskIO = jest.fn().mockResolvedValue(mockDiskIO);

      // Mock cache
      (require("@/lib/redis/cache-utils") as any).withCache = jest.fn().mockImplementation(
        async (_key: string, fn: () => Promise<any>) => await fn()
      );

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.diskIO).toEqual(mockDiskIO);
      expect(result.data?.cacheHitRate).toEqual(mockCacheHitRate);
    });

    it("deve retornar diskIO null se Management API indisponível", async () => {
      const repo = require("../../repositories/metricas-db-repository");
      repo.buscarCacheHitRate = jest.fn().mockResolvedValue([]);
      repo.buscarQueriesLentas = jest.fn().mockResolvedValue([]);
      repo.buscarTabelasSequentialScan = jest.fn().mockResolvedValue([]);
      repo.buscarBloatTabelas = jest.fn().mockResolvedValue([]);
      repo.buscarIndicesNaoUtilizados = jest.fn().mockResolvedValue([]);
      repo.buscarMetricasDiskIO = jest.fn().mockResolvedValue(null);

      (require("@/lib/redis/cache-utils") as any).withCache = jest.fn().mockImplementation(
        async (_key: string, fn: () => Promise<any>) => await fn()
      );

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(true);
      expect(result.data?.diskIO).toBeNull();
    });

    it("deve negar acesso se não for super_admin", async () => {
      mockSupabase.single.mockResolvedValue({ data: { is_super_admin: false }, error: null });

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });
  });

  describe("actionAvaliarUpgrade", () => {
    it("deve retornar recomendação correta", async () => {
      const repo = require("../../repositories/metricas-db-repository");
      const api = require("@/lib/supabase/management-api");

      repo.buscarCacheHitRate = jest.fn().mockResolvedValue([
        { name: "index", ratio: 94.2 },
        { name: "table", ratio: 93.8 },
      ]);

      api.obterMetricasDiskIO = jest.fn().mockResolvedValue({
        disk_io_budget_percent: 92,
        compute_tier: "small",
      });

      api.obterComputeAtual = jest.fn().mockResolvedValue({
        name: "small",
      });

      const result = await actionAvaliarUpgrade();

      expect(result.success).toBe(true);
      expect(result.data?.should_upgrade).toBe(true);
      expect(result.data?.recommended_tier).toBeDefined();
    });
  });

  describe("actionDocumentarDecisao", () => {
    it("deve atualizar arquivo DISK_IO_OPTIMIZATION.md", async () => {
      const fs = require("fs/promises");
      const mockContent = `
## 📈 Métricas Pós-Otimização

### Cache Hit Rate
- **Antes**: [PREENCHER]
- **Depois**: [PREENCHER]
- **Melhoria**: [PREENCHER]

### Disk IO Budget
- **Antes**: [PREENCHER]% consumido
- **Depois**: [PREENCHER]% consumido
- **Melhoria**: [PREENCHER]%

### Queries Lentas (>1s)
- **Antes**: [PREENCHER] queries
- **Depois**: [PREENCHER] queries
- **Melhoria**: [PREENCHER]%

## 💰 Decisão de Upgrade de Compute
[PREENCHER]
`;

      fs.readFile = jest.fn().mockResolvedValue(mockContent);
      fs.writeFile = jest.fn().mockResolvedValue(undefined);

      const result = await actionDocumentarDecisao(
        "manter",
        {
          cache_hit_rate_antes: 94.0,
          cache_hit_rate_depois: 99.5,
          disk_io_antes: 92,
          disk_io_depois: 75,
          queries_lentas_antes: 50,
          queries_lentas_depois: 5,
        },
        "Otimizações aplicadas com sucesso"
      );

      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it("deve negar acesso se não for super_admin", async () => {
      mockSupabase.single.mockResolvedValue({ data: { is_super_admin: false }, error: null });

      const result = await actionDocumentarDecisao(
        "manter",
        {} as any,
        "teste"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });
  });
});
