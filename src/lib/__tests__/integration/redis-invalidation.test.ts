/**
 * Testes de Integração para Redis Invalidation
 *
 * Valida funções de invalidação de cache incluindo:
 * - Invalidação de caches específicos
 * - Invalidação de todos os caches de lista
 * - Invalidação por tipo de entidade e ID
 */

import {
  invalidatePendentesCache,
  invalidateAudienciasCache,
  invalidateAcervoCache,
  invalidateUsuariosCache,
  invalidateClientesCache,
  invalidateContratosCache,
  invalidateAllListCaches,
  invalidateCacheOnUpdate,
  invalidatePlanoContasCache,
} from '@/lib/redis/invalidation';
import { deletePattern, CACHE_PREFIXES } from '@/lib/redis/cache-utils';

// Mock do deletePattern
jest.mock('@/lib/redis/cache-utils', () => ({
  deletePattern: jest.fn(),
  CACHE_PREFIXES: {
    pendentes: 'pendentes',
    audiencias: 'audiencias',
    acervo: 'acervo',
    usuarios: 'usuarios',
    clientes: 'clientes',
    contratos: 'contratos',
    tiposExpedientes: 'tipos_expedientes',
    cargos: 'cargos',
    planoContas: 'plano_contas',
  },
}));

describe('Redis - Invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Invalidação de Caches Específicos', () => {
    it('invalidatePendentesCache deve invalidar cache de pendentes', async () => {
      await invalidatePendentesCache();

      expect(deletePattern).toHaveBeenCalledWith('pendentes:*');
    });

    it('invalidateAudienciasCache deve invalidar cache de audiências', async () => {
      await invalidateAudienciasCache();

      expect(deletePattern).toHaveBeenCalledWith('audiencias:*');
    });

    it('invalidateAcervoCache deve invalidar cache de acervo', async () => {
      await invalidateAcervoCache();

      expect(deletePattern).toHaveBeenCalledWith('acervo:*');
    });

    it('invalidateUsuariosCache deve invalidar cache de usuários', async () => {
      await invalidateUsuariosCache();

      expect(deletePattern).toHaveBeenCalledWith('usuarios:*');
    });

    it('invalidateClientesCache deve invalidar cache de clientes', async () => {
      await invalidateClientesCache();

      expect(deletePattern).toHaveBeenCalledWith('clientes:*');
    });

    it('invalidateContratosCache deve invalidar cache de contratos', async () => {
      await invalidateContratosCache();

      expect(deletePattern).toHaveBeenCalledWith('contratos:*');
    });

    it('invalidatePlanoContasCache deve invalidar cache de plano de contas', async () => {
      await invalidatePlanoContasCache();

      expect(deletePattern).toHaveBeenCalledWith('plano_contas:*');
    });
  });

  describe('invalidateAllListCaches', () => {
    it('deve invalidar todos os caches de lista em paralelo', async () => {
      await invalidateAllListCaches();

      expect(deletePattern).toHaveBeenCalledTimes(8);
      expect(deletePattern).toHaveBeenCalledWith('pendentes:*');
      expect(deletePattern).toHaveBeenCalledWith('audiencias:*');
      expect(deletePattern).toHaveBeenCalledWith('acervo:*');
      expect(deletePattern).toHaveBeenCalledWith('usuarios:*');
      expect(deletePattern).toHaveBeenCalledWith('clientes:*');
      expect(deletePattern).toHaveBeenCalledWith('contratos:*');
      expect(deletePattern).toHaveBeenCalledWith('tipos_expedientes:*');
      expect(deletePattern).toHaveBeenCalledWith('cargos:*');
    });

    it('deve executar invalidações em paralelo', async () => {
      // Mock deletePattern para verificar execução paralela
      const deletePatternMock = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10))
      );
      (deletePattern as jest.Mock).mockImplementation(deletePatternMock);

      const startTime = Date.now();
      await invalidateAllListCaches();
      const endTime = Date.now();

      // Se executado em paralelo, deve levar ~10ms
      // Se executado sequencialmente, levaria 8 * 10 = 80ms
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('invalidateCacheOnUpdate', () => {
    describe('Pendentes', () => {
      it('deve invalidar cache de pendentes e ID específico', async () => {
        await invalidateCacheOnUpdate('pendentes', '123');

        expect(deletePattern).toHaveBeenCalledWith('pendentes:*');
        expect(deletePattern).toHaveBeenCalledWith('pendentes:id:123');
      });
    });

    describe('Audiências', () => {
      it('deve invalidar cache de audiências e ID específico', async () => {
        await invalidateCacheOnUpdate('audiencias', '456');

        expect(deletePattern).toHaveBeenCalledWith('audiencias:*');
        expect(deletePattern).toHaveBeenCalledWith('audiencias:id:456');
      });
    });

    describe('Acervo', () => {
      it('deve invalidar cache de acervo e ID específico', async () => {
        await invalidateCacheOnUpdate('acervo', '789');

        expect(deletePattern).toHaveBeenCalledWith('acervo:*');
        expect(deletePattern).toHaveBeenCalledWith('acervo:id:789');
      });
    });

    describe('Usuários', () => {
      it('deve invalidar cache de usuários, ID, CPF e email', async () => {
        await invalidateCacheOnUpdate('usuarios', '123');

        expect(deletePattern).toHaveBeenCalledWith('usuarios:*');
        expect(deletePattern).toHaveBeenCalledWith('usuarios:id:123');
        expect(deletePattern).toHaveBeenCalledWith('usuarios:cpf:*');
        expect(deletePattern).toHaveBeenCalledWith('usuarios:email:*');
        expect(deletePattern).toHaveBeenCalledTimes(4);
      });
    });

    describe('Clientes', () => {
      it('deve invalidar cache de clientes, ID, CPF e CNPJ', async () => {
        await invalidateCacheOnUpdate('clientes', '456');

        expect(deletePattern).toHaveBeenCalledWith('clientes:*');
        expect(deletePattern).toHaveBeenCalledWith('clientes:id:456');
        expect(deletePattern).toHaveBeenCalledWith('clientes:cpf:*');
        expect(deletePattern).toHaveBeenCalledWith('clientes:cnpj:*');
        expect(deletePattern).toHaveBeenCalledTimes(4);
      });
    });

    describe('Contratos', () => {
      it('deve invalidar cache de contratos e ID específico', async () => {
        await invalidateCacheOnUpdate('contratos', '789');

        expect(deletePattern).toHaveBeenCalledWith('contratos:*');
        expect(deletePattern).toHaveBeenCalledWith('contratos:id:789');
      });
    });

    describe('Tipos de Expedientes', () => {
      it('deve invalidar cache de tipos de expedientes e ID específico', async () => {
        await invalidateCacheOnUpdate('tiposExpedientes', '10');

        expect(deletePattern).toHaveBeenCalledWith('tipos_expedientes:*');
        expect(deletePattern).toHaveBeenCalledWith('tipos_expedientes:id:10');
      });
    });

    describe('Cargos', () => {
      it('deve invalidar cache de cargos e ID específico', async () => {
        await invalidateCacheOnUpdate('cargos', '20');

        expect(deletePattern).toHaveBeenCalledWith('cargos:*');
        expect(deletePattern).toHaveBeenCalledWith('cargos:id:20');
      });
    });

    describe('Plano de Contas', () => {
      it('deve invalidar cache de plano de contas, ID e código', async () => {
        await invalidateCacheOnUpdate('planoContas', '30');

        expect(deletePattern).toHaveBeenCalledWith('plano_contas:*');
        expect(deletePattern).toHaveBeenCalledWith('plano_contas:id:30');
        expect(deletePattern).toHaveBeenCalledWith('plano_contas:codigo:*');
      });
    });

    describe('Tipo de Entidade Desconhecido', () => {
      it('deve logar warning para tipo desconhecido', async () => {
        await invalidateCacheOnUpdate('unknown_entity', '123');

        expect(console.warn).toHaveBeenCalledWith(
          'Unknown entity type for cache invalidation: unknown_entity'
        );
      });

      it('não deve chamar deletePattern para tipo desconhecido', async () => {
        await invalidateCacheOnUpdate('unknown_entity', '123');

        expect(deletePattern).not.toHaveBeenCalled();
      });
    });
  });

  describe('Casos de Uso Real', () => {
    it('deve invalidar cache após criar novo processo', async () => {
      // Simula criação de processo
      const processoId = '1001';

      await invalidateCacheOnUpdate('acervo', processoId);

      expect(deletePattern).toHaveBeenCalledWith('acervo:*');
      expect(deletePattern).toHaveBeenCalledWith(`acervo:id:${processoId}`);
    });

    it('deve invalidar cache após atualizar usuário', async () => {
      // Simula atualização de email e CPF do usuário
      const usuarioId = '42';

      await invalidateCacheOnUpdate('usuarios', usuarioId);

      // Deve invalidar todos os caches relacionados
      expect(deletePattern).toHaveBeenCalledWith('usuarios:*');
      expect(deletePattern).toHaveBeenCalledWith(`usuarios:id:${usuarioId}`);
      expect(deletePattern).toHaveBeenCalledWith('usuarios:cpf:*');
      expect(deletePattern).toHaveBeenCalledWith('usuarios:email:*');
    });

    it('deve invalidar cache após deletar cliente', async () => {
      const clienteId = '100';

      await invalidateCacheOnUpdate('clientes', clienteId);

      expect(deletePattern).toHaveBeenCalledWith('clientes:*');
      expect(deletePattern).toHaveBeenCalledWith(`clientes:id:${clienteId}`);
      expect(deletePattern).toHaveBeenCalledWith('clientes:cpf:*');
      expect(deletePattern).toHaveBeenCalledWith('clientes:cnpj:*');
    });

    it('deve invalidar todos os caches após migração de dados', async () => {
      // Simula migração ou importação em lote
      await invalidateAllListCaches();

      // Todos os caches principais devem ser limpos
      expect(deletePattern).toHaveBeenCalledTimes(8);
    });

    it('deve invalidar cache de múltiplas entidades sequencialmente', async () => {
      await invalidateCacheOnUpdate('usuarios', '1');
      await invalidateCacheOnUpdate('clientes', '2');
      await invalidateCacheOnUpdate('processos', '3'); // Desconhecido

      expect(deletePattern).toHaveBeenCalledWith('usuarios:*');
      expect(deletePattern).toHaveBeenCalledWith('clientes:*');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown entity type')
      );
    });
  });

  describe('Performance', () => {
    it('deve executar invalidações em lote eficientemente', async () => {
      const promises = [
        invalidatePendentesCache(),
        invalidateAudienciasCache(),
        invalidateAcervoCache(),
      ];

      await Promise.all(promises);

      expect(deletePattern).toHaveBeenCalledTimes(3);
    });

    it('deve lidar com múltiplas invalidações de usuários', async () => {
      const userIds = ['1', '2', '3', '4', '5'];

      await Promise.all(
        userIds.map(id => invalidateCacheOnUpdate('usuarios', id))
      );

      // 4 chamadas por usuário (geral, id, cpf, email) * 5 usuários
      expect(deletePattern).toHaveBeenCalledTimes(20);
    });
  });

  describe('Integração com CACHE_PREFIXES', () => {
    it('deve usar prefixos corretos do CACHE_PREFIXES', async () => {
      await invalidateUsuariosCache();

      expect(deletePattern).toHaveBeenCalledWith(
        `${CACHE_PREFIXES.usuarios}:*`
      );
    });

    it('deve construir padrões corretos com ID', async () => {
      const id = '123';
      await invalidateCacheOnUpdate('clientes', id);

      expect(deletePattern).toHaveBeenCalledWith(`clientes:id:${id}`);
    });
  });
});
