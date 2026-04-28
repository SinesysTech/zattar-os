import {
  isDiskIOMetricsConfigured,
  isManagementApiConfigured,
  listarComputeTiers,
  obterComputeAtual,
  obterMetricasDiskIO,
} from "../management-api";
import { getRedisClient } from "@/lib/redis/client";

// Mock do Redis
jest.mock("@/lib/redis/client", () => ({
  getRedisClient: jest.fn(),
}));

// Mock do fetch global
global.fetch = jest.fn();

describe("management-api", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isDiskIOMetricsConfigured", () => {
    it("deve retornar true quando NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY estão definidos", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.SUPABASE_SECRET_KEY = "service-role-key";
      expect(isDiskIOMetricsConfigured()).toBe(true);
    });

    it("deve retornar false quando NEXT_PUBLIC_SUPABASE_URL está faltando", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_SECRET_KEY = "service-role-key";
      expect(isDiskIOMetricsConfigured()).toBe(false);
    });

    it("deve retornar false quando SUPABASE_SECRET_KEY está faltando", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      delete process.env.SUPABASE_SECRET_KEY;
      expect(isDiskIOMetricsConfigured()).toBe(false);
    });
  });

  describe("isManagementApiConfigured", () => {
    it("deve retornar true quando SUPABASE_PROJECT_REF e SUPABASE_ACCESS_TOKEN estão definidos", () => {
      process.env.SUPABASE_PROJECT_REF = "project-ref";
      process.env.SUPABASE_ACCESS_TOKEN = "access-token";
      expect(isManagementApiConfigured()).toBe(true);
    });

    it("deve retornar false quando SUPABASE_PROJECT_REF está faltando", () => {
      delete process.env.SUPABASE_PROJECT_REF;
      process.env.SUPABASE_ACCESS_TOKEN = "access-token";
      expect(isManagementApiConfigured()).toBe(false);
    });

    it("deve retornar false quando SUPABASE_ACCESS_TOKEN está faltando", () => {
      process.env.SUPABASE_PROJECT_REF = "project-ref";
      delete process.env.SUPABASE_ACCESS_TOKEN;
      expect(isManagementApiConfigured()).toBe(false);
    });
  });

  describe("listarComputeTiers", () => {
    it("deve retornar a lista de tiers de computação", async () => {
      const tiers = await listarComputeTiers();
      expect(Array.isArray(tiers)).toBe(true);
      expect(tiers.length).toBeGreaterThan(0);
      expect(tiers[0]).toHaveProperty("name");
      expect(tiers[0]).toHaveProperty("ram_gb");
    });
  });

  describe("obterComputeAtual", () => {
    it("deve retornar null se não estiver configurado", async () => {
      delete process.env.SUPABASE_PROJECT_REF;
      delete process.env.SUPABASE_ACCESS_TOKEN;
      const result = await obterComputeAtual();
      expect(result).toBeNull();
    });

    it("deve retornar dados do compute tier em caso de sucesso", async () => {
      process.env.SUPABASE_PROJECT_REF = "project-ref";
      process.env.SUPABASE_ACCESS_TOKEN = "access-token";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tier: "Small",
          ram_gb: 2,
          iops: 2085,
          throughput_mbps: 87,
          monthly_cost_usd: 10,
        }),
      });

      const result = await obterComputeAtual();
      expect(result).toEqual({
        name: "Small",
        ram_gb: 2,
        iops: 2085,
        throughput_mbps: 87,
        monthly_cost_usd: 10,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.supabase.com/v1/projects/project-ref",
        expect.any(Object)
      );
    });

    it("deve retornar null em caso de erro na API", async () => {
      process.env.SUPABASE_PROJECT_REF = "project-ref";
      process.env.SUPABASE_ACCESS_TOKEN = "access-token";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await obterComputeAtual();
      expect(result).toBeNull();
    });
  });

  describe("obterMetricasDiskIO", () => {
    const mockProjectUrl = "https://example.supabase.co";
    const mockServiceRoleKey = "service-role-key";
    const mockProjectRef = "project-ref";

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = mockProjectUrl;
      process.env.SUPABASE_SECRET_KEY = mockServiceRoleKey;
      process.env.SUPABASE_PROJECT_REF = mockProjectRef;
    });

    it("deve retornar not_configured se as variáveis de ambiente estiverem faltando", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const result = await obterMetricasDiskIO();
      expect(result.status).toBe("not_configured");
    });

    it("deve retornar dados do cache se disponíveis", async () => {
      const mockMetrics = { disk_io_budget_percent: 50 };
      const mockRedis = {
        get: jest.fn().mockResolvedValue(JSON.stringify(mockMetrics)),
      };
      (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

      const result = await obterMetricasDiskIO();
      expect(result.status).toBe("ok");
      expect(result.metrics).toEqual(mockMetrics);
      expect(mockRedis.get).toHaveBeenCalledWith(`supabase:metrics:disk_io:${mockProjectRef}`);
    });

    it("deve retornar waiting_samples na primeira coleta", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null); // Sem redis para simplificar
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => `
# HELP node_disk_reads_completed_total The total number of reads completed successfully.
# TYPE node_disk_reads_completed_total counter
node_disk_reads_completed_total{device="sda"} 100
node_disk_writes_completed_total{device="sda"} 50
node_disk_read_bytes_total{device="sda"} 1024
node_disk_written_bytes_total{device="sda"} 2048
`,
      });

      const result = await obterMetricasDiskIO();
      expect(result.status).toBe("waiting_samples");
    });

    it("deve calcular métricas corretamente com duas amostras", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);

      const now = Date.now();
      const previousSample = {
        ts: now - 20000, // 20 segundos atrás
        readsCompleted: 100,
        writesCompleted: 50,
        readBytes: 1024,
        writtenBytes: 2048,
      };

      // Mocking internal state is hard without exporting it,
      // but the code uses getPreviousDiskIoSample which uses Redis or a module-level variable.
      // Since I mocked getRedisClient to return null, it uses lastInMemoryDiskIoSample.

      // Let's force Redis mock to return the previous sample for the counters
      const mockRedis = {
        get: jest.fn()
          .mockResolvedValueOnce(null) // Cache de métricas (miss)
          .mockResolvedValueOnce(JSON.stringify(previousSample)), // Cache de counters (hit)
        setex: jest.fn().mockResolvedValue("OK"),
      };
      (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => `
node_disk_reads_completed_total{device="sda"} 300
node_disk_writes_completed_total{device="sda"} 150
node_disk_read_bytes_total{device="sda"} ${1024 + 10 * 1024 * 1024}
node_disk_written_bytes_total{device="sda"} ${2048 + 10 * 1024 * 1024}
`,
      });

      // Mock obterComputeAtual and listarComputeTiers indirectly by mocking fetch and returning static
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tier: "Small" }),
      });

      const result = await obterMetricasDiskIO();

      expect(result.status).toBe("ok");
      expect(result.metrics).toBeDefined();
      // (300-100) / 20 = 10 reads/sec
      // (150-50) / 20 = 5 writes/sec
      // Total IOPS = 15
      // Bytes diff = 20MB total / 20 sec = 1MB/sec
      expect(result.metrics?.disk_iops_consumption).toBeCloseTo(15);
      expect(result.metrics?.disk_io_consumption_mbps).toBeCloseTo(1);
    });

    it("deve retornar api_error se o fetch falhar", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await obterMetricasDiskIO();
      expect(result.status).toBe("api_error");
    });
  });
});
