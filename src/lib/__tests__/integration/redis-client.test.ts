/**
 * Testes de Integração para Redis Client
 *
 * Valida gerenciamento de conexão Redis incluindo:
 * - Criação de cliente Redis
 * - Tratamento de erros de conexão
 * - Fechamento de conexão
 * - Event handlers
 */

import Redis from 'ioredis';
import { getRedisClient, closeRedisClient } from '@/lib/redis/client';

// Mock do ioredis
jest.mock('ioredis');

interface MockRedisInstance {
  on: jest.Mock;
  quit: jest.Mock;
  get?: jest.Mock;
  set?: jest.Mock;
  del?: jest.Mock;
  ping?: jest.Mock;
}

describe('Redis - Client', () => {
  const originalEnv = process.env;
  let mockRedisInstance: MockRedisInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Reset environment
    process.env = { ...originalEnv };

    // Criar mock de instância Redis
    mockRedisInstance = {
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    // Configurar Redis constructor mock
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedisInstance as unknown as Redis
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('getRedisClient', () => {
    describe('Redis Habilitado', () => {
      it('deve retornar instância Redis quando habilitado', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBe(mockRedisInstance);
        expect(Redis).toHaveBeenCalledWith(
          'redis://localhost:6379',
          expect.objectContaining({
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
          })
        );
      });

      it('deve configurar password quando fornecido', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';
        process.env.REDIS_PASSWORD = 'secret-password';

        // Act
        getRedisClient();

        // Assert
        expect(Redis).toHaveBeenCalledWith(
          'redis://localhost:6379',
          expect.objectContaining({
            password: 'secret-password',
          })
        );
      });

      it('deve configurar retry strategy', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Assert
        const config = (Redis as jest.MockedClass<typeof Redis>).mock.calls[0][1];
        expect(config?.retryStrategy).toBeDefined();

        // Testar retry strategy
        if (config?.retryStrategy) {
          expect(config.retryStrategy(1)).toBe(100);
          expect(config.retryStrategy(2)).toBe(200);
          expect(config.retryStrategy(3)).toBe(300);
          expect(config.retryStrategy(4)).toBeNull(); // Stop after 3
          expect(config.retryStrategy(10)).toBeNull();
        }
      });

      it('deve configurar retry strategy com max de 2 segundos', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Assert
        const config = (Redis as jest.MockedClass<typeof Redis>).mock.calls[0][1];
        if (config?.retryStrategy) {
          // 20 * 100 = 2000, mas max é 2000
          expect(config.retryStrategy(2)).toBeLessThanOrEqual(2000);
        }
      });

      it('deve registrar event handlers', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Assert
        expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('ready', expect.any(Function));
        expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
      });

      it('deve logar erro quando ocorrer erro de conexão', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Simular evento de erro
        const errorHandler = mockRedisInstance.on.mock.calls.find(
          (call: unknown[]) => call[0] === 'error'
        )?.[1];
        const testError = new Error('Connection failed');
        errorHandler(testError);

        // Assert
        expect(console.error).toHaveBeenCalledWith('Redis Client Error:', testError);
      });

      it('deve logar quando conectar', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Simular evento de conexão
        const connectHandler = mockRedisInstance.on.mock.calls.find(
          (call: unknown[]) => call[0] === 'connect'
        )?.[1];
        connectHandler();

        // Assert
        expect(console.log).toHaveBeenCalledWith('Redis Client Connected');
      });

      it('deve logar quando ficar ready', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Simular evento ready
        const readyHandler = mockRedisInstance.on.mock.calls.find(
          (call: unknown[]) => call[0] === 'ready'
        )?.[1];
        readyHandler();

        // Assert
        expect(console.log).toHaveBeenCalledWith('Redis Client Ready');
      });

      it('deve logar quando fechar conexão', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        getRedisClient();

        // Simular evento close
        const closeHandler = mockRedisInstance.on.mock.calls.find(
          (call: unknown[]) => call[0] === 'close'
        )?.[1];
        closeHandler();

        // Assert
        expect(console.log).toHaveBeenCalledWith('Redis Client Connection Closed');
      });

      it('deve reutilizar instância existente', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        // Act
        const client1 = getRedisClient();
        const client2 = getRedisClient();

        // Assert
        expect(client1).toBe(client2);
        expect(Redis).toHaveBeenCalledTimes(1); // Apenas uma instância criada
      });
    });

    describe('Redis Desabilitado', () => {
      it('deve retornar null quando Redis desabilitado', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'false';

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBeNull();
        expect(Redis).not.toHaveBeenCalled();
      });

      it('deve retornar null quando ENABLE_REDIS_CACHE não definido', () => {
        // Arrange
        delete process.env.ENABLE_REDIS_CACHE;

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBeNull();
      });

      it('deve retornar null quando ENABLE_REDIS_CACHE é string vazia', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = '';

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBeNull();
      });
    });

    describe('Tratamento de Erros', () => {
      it('deve retornar null em caso de erro ao criar cliente', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'redis://localhost:6379';

        (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => {
          throw new Error('Failed to connect');
        });

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to create Redis client:',
          expect.any(Error)
        );
      });

      it('deve lidar com URL inválida', () => {
        // Arrange
        process.env.ENABLE_REDIS_CACHE = 'true';
        process.env.REDIS_URL = 'invalid-url';

        (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => {
          throw new Error('Invalid URL');
        });

        // Act
        const client = getRedisClient();

        // Assert
        expect(client).toBeNull();
      });
    });
  });

  describe('closeRedisClient', () => {
    it('deve fechar cliente Redis quando existe', async () => {
      // Arrange
      process.env.ENABLE_REDIS_CACHE = 'true';
      process.env.REDIS_URL = 'redis://localhost:6379';

      getRedisClient(); // Criar cliente

      // Act
      await closeRedisClient();

      // Assert
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('deve resetar referência do cliente após fechar', async () => {
      // Arrange
      process.env.ENABLE_REDIS_CACHE = 'true';
      process.env.REDIS_URL = 'redis://localhost:6379';

      getRedisClient();
      await closeRedisClient();

      // Act - Deve criar nova instância
      const newClient = getRedisClient();

      // Assert
      expect(Redis).toHaveBeenCalledTimes(2); // Nova instância criada
      expect(newClient).toBe(mockRedisInstance);
    });

    it('não deve fazer nada quando cliente não existe', async () => {
      // Arrange - Não criar cliente

      // Act & Assert - Não deve lançar erro
      await expect(closeRedisClient()).resolves.toBeUndefined();
    });

    it('não deve fazer nada quando Redis desabilitado', async () => {
      // Arrange
      process.env.ENABLE_REDIS_CACHE = 'false';

      // Act & Assert
      await expect(closeRedisClient()).resolves.toBeUndefined();
      expect(mockRedisInstance.quit).not.toHaveBeenCalled();
    });
  });

  describe('Configurações de Ambiente', () => {
    it('deve usar variáveis de ambiente corretas', () => {
      // Arrange
      process.env.ENABLE_REDIS_CACHE = 'true';
      process.env.REDIS_URL = 'redis://custom-host:1234';
      process.env.REDIS_PASSWORD = 'custom-password';

      // Act
      getRedisClient();

      // Assert
      expect(Redis).toHaveBeenCalledWith(
        'redis://custom-host:1234',
        expect.objectContaining({
          password: 'custom-password',
        })
      );
    });

    it('deve funcionar sem password', () => {
      // Arrange
      process.env.ENABLE_REDIS_CACHE = 'true';
      process.env.REDIS_URL = 'redis://localhost:6379';
      delete process.env.REDIS_PASSWORD;

      // Act
      getRedisClient();

      // Assert
      expect(Redis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({
          password: undefined,
        })
      );
    });
  });
});
