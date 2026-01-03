/**
 * Testes de Integração para Redis Cache Utils
 *
 * Valida funções de cache Redis incluindo:
 * - Get/Set/Delete de cache
 * - Padrões de invalidação
 * - Geração de chaves determinísticas
 * - Wrapper withCache
 */

import {
  getCached,
  setCached,
  deleteCached,
  deletePattern,
  generateCacheKey,
  withCache,
  getCacheStats,
} from '@/lib/redis/cache-utils';
import { getRedisClient } from '@/lib/redis/client';
import { isRedisAvailable } from '@/lib/redis/utils';

// Mocks
jest.mock('@/lib/redis/client');
jest.mock('@/lib/redis/utils', () => ({
  isRedisAvailable: jest.fn(),
}));

describe('Redis - Cache Utils', () => {
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      info: jest.fn(),
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
    (isRedisAvailable as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateCacheKey', () => {
    it('deve retornar apenas prefix quando params não fornecido', () => {
      expect(generateCacheKey('test')).toBe('test');
    });

    it('deve gerar chave com params', () => {
      const result = generateCacheKey('test', { id: 1, name: 'foo' });
      expect(result).toContain('test:');
      expect(result).toContain('"id"');
      expect(result).toContain('"name"');
    });

    it('deve gerar chaves determinísticas (ordem independente)', () => {
      const key1 = generateCacheKey('test', { b: 2, a: 1, c: 3 });
      const key2 = generateCacheKey('test', { a: 1, c: 3, b: 2 });
      expect(key1).toBe(key2);
    });

    it('deve lidar com objetos aninhados', () => {
      const params = {
        user: { id: 1, name: 'John' },
        filters: { active: true },
      };
      const result = generateCacheKey('test', params);
      expect(result).toContain('test:');
    });

    it('deve lidar com arrays', () => {
      const result = generateCacheKey('test', { ids: [1, 2, 3] });
      expect(result).toContain('[1,2,3]');
    });

    it('deve lidar com valores null', () => {
      const result = generateCacheKey('test', { value: null });
      expect(result).toContain('null');
    });
  });

  describe('getCached', () => {
    it('deve retornar dados do cache quando existe', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await getCached<typeof mockData>('test:key');

      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    });

    it('deve retornar null quando cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await getCached('test:key');

      expect(result).toBeNull();
    });

    it('deve retornar null quando Redis não disponível', async () => {
      (isRedisAvailable as jest.Mock).mockResolvedValue(false);

      const result = await getCached('test:key');

      expect(result).toBeNull();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando Redis client é null', async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);

      const result = await getCached('test:key');

      expect(result).toBeNull();
    });

    it('deve retornar null e logar warning em caso de erro', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await getCached('test:key');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache get failed'),
        expect.any(Error)
      );
    });

    it('deve deserializar JSON complexo', async () => {
      const complexData = {
        id: 1,
        nested: { value: 'test' },
        array: [1, 2, 3],
        date: '2024-01-15',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(complexData));

      const result = await getCached('test:key');

      expect(result).toEqual(complexData);
    });
  });

  describe('setCached', () => {
    it('deve armazenar dados no cache com TTL padrão', async () => {
      const mockData = { id: 1, name: 'Test' };

      await setCached('test:key', mockData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        600, // TTL padrão
        JSON.stringify(mockData)
      );
    });

    it('deve armazenar dados com TTL customizado', async () => {
      const mockData = { id: 1 };

      await setCached('test:key', mockData, 300);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        300,
        JSON.stringify(mockData)
      );
    });

    it('não deve fazer nada quando Redis não disponível', async () => {
      (isRedisAvailable as jest.Mock).mockResolvedValue(false);

      await setCached('test:key', { id: 1 });

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('não deve fazer nada quando Redis client é null', async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);

      await setCached('test:key', { id: 1 });

      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('deve logar warning em caso de erro', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await setCached('test:key', { id: 1 });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache set failed'),
        expect.any(Error)
      );
    });

    it('deve serializar dados complexos', async () => {
      const complexData = {
        id: 1,
        nested: { value: [1, 2, 3] },
        date: new Date('2024-01-15'),
      };

      await setCached('test:key', complexData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        600,
        expect.stringContaining('"id":1')
      );
    });
  });

  describe('deleteCached', () => {
    it('deve deletar chave do cache', async () => {
      await deleteCached('test:key');

      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('não deve fazer nada quando Redis não disponível', async () => {
      (isRedisAvailable as jest.Mock).mockResolvedValue(false);

      await deleteCached('test:key');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('deve logar warning em caso de erro', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await deleteCached('test:key');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache delete failed'),
        expect.any(Error)
      );
    });
  });

  describe('deletePattern', () => {
    it('deve deletar múltiplas chaves com padrão', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValue(3);

      const result = await deletePattern('test:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      expect(result).toBe(3);
    });

    it('deve retornar 0 quando nenhuma chave encontrada', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await deletePattern('test:*');

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('deve retornar 0 quando Redis não disponível', async () => {
      (isRedisAvailable as jest.Mock).mockResolvedValue(false);

      const result = await deletePattern('test:*');

      expect(result).toBe(0);
    });

    it('deve retornar 0 e logar warning em caso de erro', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const result = await deletePattern('test:*');

      expect(result).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache delete pattern failed'),
        expect.any(Error)
      );
    });
  });

  describe('withCache', () => {
    it('deve retornar do cache quando existe', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const fn = jest.fn().mockResolvedValue({ id: 2, name: 'Fresh' });

      const result = await withCache('test:key', fn);

      expect(result).toEqual(cachedData);
      expect(fn).not.toHaveBeenCalled(); // Não deve executar função
    });

    it('deve executar função e cachear resultado quando cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const freshData = { id: 2, name: 'Fresh' };
      const fn = jest.fn().mockResolvedValue(freshData);

      const result = await withCache('test:key', fn);

      expect(result).toEqual(freshData);
      expect(fn).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        600,
        JSON.stringify(freshData)
      );
    });

    it('deve usar TTL customizado', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fn = jest.fn().mockResolvedValue({ id: 1 });

      await withCache('test:key', fn, 300);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        300,
        expect.any(String)
      );
    });

    it('deve executar função quando Redis não disponível', async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);
      const freshData = { id: 1 };
      const fn = jest.fn().mockResolvedValue(freshData);

      const result = await withCache('test:key', fn);

      expect(result).toEqual(freshData);
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('deve retornar estatísticas do Redis', async () => {
      const mockInfo = `
# Memory
used_memory:12345
# Stats
total_connections_received:100
keyspace_hits:50
keyspace_misses:10
# Server
uptime_in_seconds:3600
`;
      mockRedis.info.mockResolvedValue(mockInfo);

      const stats = await getCacheStats();

      expect(stats).toHaveProperty('used_memory', '12345');
      expect(stats).toHaveProperty('keyspace_hits', '50');
      expect(stats).toHaveProperty('keyspace_misses', '10');
    });

    it('deve retornar objeto vazio quando Redis não disponível', async () => {
      (isRedisAvailable as jest.Mock).mockResolvedValue(false);

      const stats = await getCacheStats();

      expect(stats).toEqual({});
    });

    it('deve retornar objeto vazio em caso de erro', async () => {
      mockRedis.info.mockRejectedValue(new Error('Redis error'));

      const stats = await getCacheStats();

      expect(stats).toEqual({});
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Casos de Integração', () => {
    it('deve cachear e recuperar lista de processos', async () => {
      const processos = [
        { id: 1, numero: '001', valor: 1000 },
        { id: 2, numero: '002', valor: 2000 },
      ];

      // Set
      await setCached('processos:list', processos, 300);
      expect(mockRedis.setex).toHaveBeenCalled();

      // Get
      mockRedis.get.mockResolvedValue(JSON.stringify(processos));
      const cached = await getCached('processos:list');
      expect(cached).toEqual(processos);
    });

    it('deve usar withCache para query de banco', async () => {
      const dbQuery = jest.fn(async () => {
        // Simula query demorada
        await new Promise(resolve => setTimeout(resolve, 10));
        return [{ id: 1 }, { id: 2 }];
      });

      // Primeira chamada - miss
      mockRedis.get.mockResolvedValueOnce(null);
      const result1 = await withCache('query:users', dbQuery);

      expect(dbQuery).toHaveBeenCalledTimes(1);

      // Segunda chamada - hit
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(result1));
      const result2 = await withCache('query:users', dbQuery);

      expect(dbQuery).toHaveBeenCalledTimes(1); // Não deve chamar de novo
      expect(result2).toEqual(result1);
    });

    it('deve invalidar cache de padrão', async () => {
      mockRedis.keys.mockResolvedValue([
        'usuarios:1',
        'usuarios:2',
        'usuarios:list:page1',
      ]);
      mockRedis.del.mockResolvedValue(3);

      const deleted = await deletePattern('usuarios:*');

      expect(deleted).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('usuarios:*');
    });
  });
});
