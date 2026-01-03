// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarEnderecoMock } from '../fixtures';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  upsert: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(() => mockSupabaseClient),
}));

describe('Endereços Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarEndereco', () => {
    it('deve criar endereço com sucesso', async () => {
      // Arrange
      const endereco = criarEnderecoMock();
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: endereco,
        error: null,
      });

      // Act
      const result = await repository.criarEndereco(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('enderecos');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(params);
      expect(mockSupabaseClient.select).toHaveBeenCalled();
    });

    it('deve tratar erro de duplicata (código 23505)', async () => {
      // Arrange
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      // Act
      const result = await repository.criarEndereco(params);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('deve tratar erro genérico de banco', async () => {
      // Arrange
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'database error' },
      });

      // Act
      const result = await repository.criarEndereco(params);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('atualizarEndereco', () => {
    it('deve atualizar endereço com sucesso', async () => {
      // Arrange
      const enderecoAtualizado = criarEnderecoMock({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: enderecoAtualizado,
        error: null,
      });

      // Act
      const result = await repository.atualizarEndereco({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          logradouro: 'Rua Atualizada',
          updated_at: expect.any(String),
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });

    it('deve tratar endereço não encontrado (código PGRST116)', async () => {
      // Arrange
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      // Act
      const result = await repository.atualizarEndereco({
        id: 999,
        logradouro: 'Rua Inexistente',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toContain('999');
      }
    });
  });

  describe('buscarEnderecoPorId', () => {
    it('deve buscar endereço por ID', async () => {
      // Arrange
      const endereco = criarEnderecoMock({ id: 1 });

      mockSupabaseClient.single.mockResolvedValue({
        data: endereco,
        error: null,
      });

      // Act
      const result = await repository.buscarEnderecoPorId(1);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('enderecos');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });

    it('deve retornar erro quando não encontrado', async () => {
      // Arrange
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      // Act
      const result = await repository.buscarEnderecoPorId(999);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('buscarEnderecosPorEntidade', () => {
    it('deve buscar endereços por entidade', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({ id: 1 }),
        criarEnderecoMock({ id: 2 }),
      ];

      // Mock the chain properly
      const mockQuery = {
        data: enderecos,
        error: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(mockQuery),
      });

      // Act
      const result = await repository.buscarEnderecosPorEntidade({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve filtrar apenas endereços ativos', async () => {
      // Arrange
      const enderecos = [criarEnderecoMock({ ativo: true })];

      const mockQuery = {
        data: enderecos,
        error: null,
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue(mockQuery),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      const result = await repository.buscarEnderecosPorEntidade({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });

      // Assert
      expect(mockChain.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('deve ordenar por correspondencia e situacao', async () => {
      // Arrange
      const enderecos = [criarEnderecoMock()];

      const mockQuery = {
        data: enderecos,
        error: null,
      };

      const mockOrderChain = jest.fn().mockResolvedValue(mockQuery);
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: mockOrderChain,
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      await repository.buscarEnderecosPorEntidade({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });

      // Assert
      expect(mockOrderChain).toHaveBeenCalledWith('correspondencia', { ascending: false });
    });
  });

  describe('listarEnderecos', () => {
    it('deve listar endereços com paginação', async () => {
      // Arrange
      const enderecos = [criarEnderecoMock({ id: 1 }), criarEnderecoMock({ id: 2 })];

      const mockQuery = {
        data: enderecos,
        error: null,
        count: 2,
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockQuery),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      const result = await repository.listarEnderecos({
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enderecos).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.pagina).toBe(1);
        expect(result.data.totalPaginas).toBe(1);
      }
      expect(mockChain.range).toHaveBeenCalledWith(0, 49);
    });

    it('deve aplicar filtro de busca', async () => {
      // Arrange
      const enderecos = [criarEnderecoMock()];

      const mockQuery = {
        data: enderecos,
        error: null,
        count: 1,
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockQuery),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      await repository.listarEnderecos({
        busca: 'Flores',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(mockChain.or).toHaveBeenCalledWith(
        'logradouro.ilike.%Flores%,municipio.ilike.%Flores%,cep.ilike.%Flores%'
      );
    });

    it('deve aplicar filtros de entidade', async () => {
      // Arrange
      const enderecos = [criarEnderecoMock()];

      const mockQuery = {
        data: enderecos,
        error: null,
        count: 1,
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockQuery),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      await repository.listarEnderecos({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        ativo: true,
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(mockChain.eq).toHaveBeenCalledWith('entidade_tipo', 'cliente');
      expect(mockChain.eq).toHaveBeenCalledWith('entidade_id', 100);
      expect(mockChain.eq).toHaveBeenCalledWith('ativo', true);
    });
  });

  describe('upsertEnderecoPorIdPje', () => {
    it('deve fazer upsert de endereço por id_pje', async () => {
      // Arrange
      const endereco = criarEnderecoMock({ id_pje: 123 });
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        id_pje: 123,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: endereco,
        error: null,
      });

      // Act
      const result = await repository.upsertEnderecoPorIdPje(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        params,
        {
          onConflict: 'id_pje,entidade_tipo,entidade_id',
          ignoreDuplicates: false,
        }
      );
    });
  });

  describe('deletarEndereco', () => {
    it('deve fazer soft delete (ativo = false)', async () => {
      // Arrange
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      const result = await repository.deletarEndereco(1);

      // Assert
      expect(result.success).toBe(true);
      expect(mockChain.update).toHaveBeenCalledWith({ ativo: false });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 1);
    });

    it('deve retornar erro ao falhar soft delete', async () => {
      // Arrange
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'database error' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      // Act
      const result = await repository.deletarEndereco(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
