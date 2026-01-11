import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { actionObterMetricasDB } from "../../actions/metricas-actions";
import { actionAvaliarUpgrade, actionDocumentarDecisao } from "../../actions/upgrade-actions";
import * as authServer from "@/lib/auth/server";
import * as supabaseServer from "@/lib/supabase/server";
import * as cacheUtils from "@/lib/redis/cache-utils";
import * as repo from "../../repositories/metricas-db-repository";
import * as managementApi from "@/lib/supabase/management-api";
import * as fsPromises from "fs/promises";

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
    (authServer.requireAuth as unknown as jest.Mock).mockResolvedValue({ user: mockUser });
    
    // Mock createClient
    (supabaseServer.createClient as unknown as jest.Mock).mockResolvedValue(mockSupabase);
    
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
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue(mockCacheHitRate);
      (repo.buscarQueriesLentas as unknown as jest.Mock).mockResolvedValue(mockQueriesLentas);
      (repo.buscarTabelasSequentialScan as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarBloatTabelas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarIndicesNaoUtilizados as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarMetricasDiskIO as unknown as jest.Mock).mockResolvedValue(mockDiskIO);

      // Mock cache
      (cacheUtils.withCache as unknown as jest.Mock).mockImplementation(
        async (_key: string, fn: () => Promise<unknown>) => await fn()
      );

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.diskIO).toEqual(mockDiskIO);
      expect(result.data?.cacheHitRate).toEqual(mockCacheHitRate);
    });

    it("deve retornar diskIO null se Management API indisponível", async () => {
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarQueriesLentas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarTabelasSequentialScan as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarBloatTabelas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarIndicesNaoUtilizados as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarMetricasDiskIO as unknown as jest.Mock).mockResolvedValue(null);

      (cacheUtils.withCache as unknown as jest.Mock).mockImplementation(
        async (_key: string, fn: () => Promise<unknown>) => await fn()
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
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue([
        { name: "index", ratio: 94.2 },
        { name: "table", ratio: 93.8 },
      ]);

      (managementApi.obterMetricasDiskIO as unknown as jest.Mock).mockResolvedValue({
        disk_io_budget_percent: 92,
        compute_tier: "small",
      });

      (managementApi.obterComputeAtual as unknown as jest.Mock).mockResolvedValue({
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
      const fs = fsPromises as unknown as {
        readFile: jest.Mock;
        writeFile: jest.Mock;
      };
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
        {
          cache_hit_rate_antes: 0,
          cache_hit_rate_depois: 0,
          disk_io_antes: 0,
          disk_io_depois: 0,
          queries_lentas_antes: 0,
          queries_lentas_depois: 0,
        },
        "teste"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });
  });
});
