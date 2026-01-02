import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '../../services/embedding.service';

jest.mock('@/lib/supabase/server');
jest.mock('../../services/embedding.service');

describe('AI Repository', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('saveEmbeddings', () => {
    it('deve salvar embeddings em batches', async () => {
      // Arrange
      const mockEmbeddings = [
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo 1',
          embedding: [0.1, 0.2, 0.3],
          metadata: {},
        },
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo 2',
          embedding: [0.4, 0.5, 0.6],
          metadata: {},
        },
      ];

      const mockInsert = jest.fn().mockResolvedValue({
        data: mockEmbeddings,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await repository.saveEmbeddings(mockEmbeddings);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockInsert).toHaveBeenCalledWith(mockEmbeddings);
    });

    it('deve lançar erro se insert falhar', async () => {
      // Arrange
      const mockEmbeddings = [
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo',
          embedding: [0.1, 0.2],
          metadata: {},
        },
      ];

      const mockError = new Error('Erro ao inserir embeddings');

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      // Act & Assert
      await expect(repository.saveEmbeddings(mockEmbeddings)).rejects.toThrow(
        'Erro ao inserir embeddings'
      );
    });

    it('deve processar múltiplos batches (>100 embeddings)', async () => {
      // Arrange
      const mockEmbeddings = Array.from({ length: 250 }, (_, i) => ({
        entity_type: 'processo',
        entity_id: 1,
        content: `conteúdo ${i}`,
        embedding: [0.1, 0.2, 0.3],
        metadata: {},
      }));

      const mockInsert = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await repository.saveEmbeddings(mockEmbeddings);

      // Assert
      // Deve ter feito 3 chamadas (100 + 100 + 50)
      expect(mockInsert).toHaveBeenCalledTimes(3);
      expect(mockInsert).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 0' })])
      );
      expect(mockInsert).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 100' })])
      );
      expect(mockInsert).toHaveBeenNthCalledWith(
        3,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 200' })])
      );
    });
  });

  describe('searchEmbeddings', () => {
    it('deve chamar RPC match_embeddings com parâmetros corretos', async () => {
      // Arrange
      const mockParams = {
        query: 'busca semântica',
        match_count: 5,
        filter: {},
      };

      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      const mockResults = [
        {
          id: 1,
          content: 'resultado 1',
          similarity: 0.92,
        },
      ];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockResults,
        error: null,
      });

      // Act
      const result = await repository.searchEmbeddings(mockParams);

      // Assert
      expect(generateEmbedding).toHaveBeenCalledWith('busca semântica');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_count: 5,
        filter: {},
      });
      expect(result).toEqual(mockResults);
    });

    it('deve gerar embedding da query antes de buscar', async () => {
      // Arrange
      const mockParams = {
        query: 'texto da query',
        match_count: 10,
        filter: {},
      };

      const mockEmbedding = [0.5, 0.6, 0.7];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(generateEmbedding).toHaveBeenCalledWith('texto da query');
      expect(generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('deve aplicar filtros de entity_type', async () => {
      // Arrange
      const mockParams = {
        query: 'busca filtrada',
        match_count: 5,
        filter: {
          entity_type: 'processo',
        },
      };

      const mockEmbedding = [0.1, 0.2];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_count: 5,
        filter: {
          entity_type: 'processo',
        },
      });
    });

    it('deve aplicar filtros de parent_id', async () => {
      // Arrange
      const mockParams = {
        query: 'busca por parent',
        match_count: 3,
        filter: {
          parent_type: 'processo',
          parent_id: 100,
        },
      };

      const mockEmbedding = [0.1, 0.2];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_count: 3,
        filter: {
          parent_type: 'processo',
          parent_id: 100,
        },
      });
    });

    it('deve retornar array vazio quando não há matches', async () => {
      // Arrange
      const mockParams = {
        query: 'sem matches',
        match_count: 5,
        filter: {},
      };

      (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await repository.searchEmbeddings(mockParams);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('deleteEmbeddingsByEntity', () => {
    it('deve deletar embeddings por entity_type e entity_id', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 123;

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });

      // Act
      await repository.deleteEmbeddingsByEntity(entityType, entityId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('entity_type', entityType);
      expect(mockEq).toHaveBeenCalledWith('entity_id', entityId);
    });

    it('deve lançar erro se delete falhar', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 456;

      const mockError = new Error('Erro ao deletar embeddings');

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });

      // Act & Assert
      await expect(
        repository.deleteEmbeddingsByEntity(entityType, entityId)
      ).rejects.toThrow('Erro ao deletar embeddings');
    });
  });

  describe('getEmbeddingsCount', () => {
    it('deve retornar contagem com filtros', async () => {
      // Arrange
      const filters = {
        entity_type: 'processo',
        entity_id: 100,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { count: 25 },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
      });

      // Act
      const result = await repository.getEmbeddingsCount(filters);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(25);
    });

    it('deve retornar contagem total sem filtros', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { count: 1000 },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.getEmbeddingsCount({});

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(1000);
    });
  });
});
