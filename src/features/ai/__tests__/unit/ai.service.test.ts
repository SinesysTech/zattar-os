import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as aiService from '../../service';
import * as repository from '../../repository';
import * as indexingService from '../../services/indexing.service';

jest.mock('../../repository');
jest.mock('../../services/indexing.service');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchKnowledge', () => {
    it('deve buscar embeddings com sucesso', async () => {
      // Arrange
      const mockParams = {
        query: 'teste de busca semântica',
        match_count: 5,
        filter: {},
      };
      const mockResults = [
        {
          id: 1,
          content: 'resultado 1',
          similarity: 0.95,
          metadata: {},
        },
        {
          id: 2,
          content: 'resultado 2',
          similarity: 0.87,
          metadata: {},
        },
      ];

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue(
        mockResults
      );

      // Act
      const result = await aiService.searchKnowledge(mockParams);

      // Assert
      expect(result).toEqual(mockResults);
      expect(repository.searchEmbeddings).toHaveBeenCalledWith(mockParams);
      expect(repository.searchEmbeddings).toHaveBeenCalledTimes(1);
    });

    it('deve passar parâmetros corretos para repository', async () => {
      // Arrange
      const mockParams = {
        query: 'busca com filtros',
        match_count: 10,
        filter: {
          entity_type: 'processo',
          entity_id: 123,
        },
      };

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue([]);

      // Act
      await aiService.searchKnowledge(mockParams);

      // Assert
      expect(repository.searchEmbeddings).toHaveBeenCalledWith({
        query: 'busca com filtros',
        match_count: 10,
        filter: {
          entity_type: 'processo',
          entity_id: 123,
        },
      });
    });

    it('deve retornar array vazio quando não há resultados', async () => {
      // Arrange
      const mockParams = {
        query: 'sem resultados',
        match_count: 5,
        filter: {},
      };

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await aiService.searchKnowledge(mockParams);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('indexDocument', () => {
    it('deve indexar documento com sucesso', async () => {
      // Arrange
      const mockDocument = {
        id: 1,
        content: 'conteúdo do documento',
        entity_type: 'processo',
        entity_id: 100,
      };

      (indexingService.indexDocument as jest.Mock).mockResolvedValue({
        success: true,
        embeddings_created: 5,
      });

      // Act
      const result = await aiService.indexDocument(mockDocument);

      // Assert
      expect(result).toEqual({
        success: true,
        embeddings_created: 5,
      });
      expect(indexingService.indexDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('deve chamar indexing service com parâmetros corretos', async () => {
      // Arrange
      const mockDocument = {
        id: 2,
        content: 'outro documento',
        entity_type: 'petição',
        entity_id: 200,
        metadata: {
          titulo: 'Petição Inicial',
        },
      };

      (indexingService.indexDocument as jest.Mock).mockResolvedValue({
        success: true,
        embeddings_created: 3,
      });

      // Act
      await aiService.indexDocument(mockDocument);

      // Assert
      expect(indexingService.indexDocument).toHaveBeenCalledWith({
        id: 2,
        content: 'outro documento',
        entity_type: 'petição',
        entity_id: 200,
        metadata: {
          titulo: 'Petição Inicial',
        },
      });
      expect(indexingService.indexDocument).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEmbeddings', () => {
    it('deve deletar embeddings por entidade', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 123;

      (repository.deleteEmbeddingsByEntity as jest.Mock).mockResolvedValue({
        deleted: 10,
      });

      // Act
      const result = await aiService.deleteEmbeddings(entityType, entityId);

      // Assert
      expect(result).toEqual({ deleted: 10 });
      expect(repository.deleteEmbeddingsByEntity).toHaveBeenCalledWith(
        entityType,
        entityId
      );
    });

    it('deve deletar embeddings por parent', async () => {
      // Arrange
      const parentType = 'processo';
      const parentId = 456;

      (repository.deleteEmbeddingsByParent as jest.Mock).mockResolvedValue({
        deleted: 25,
      });

      // Act
      const result = await aiService.deleteEmbeddingsByParent(
        parentType,
        parentId
      );

      // Assert
      expect(result).toEqual({ deleted: 25 });
      expect(repository.deleteEmbeddingsByParent).toHaveBeenCalledWith(
        parentType,
        parentId
      );
    });
  });

  describe('isIndexed', () => {
    it('deve retornar true quando entidade está indexada', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 100;

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(15);

      // Act
      const result = await aiService.isIndexed(entityType, entityId);

      // Assert
      expect(result).toBe(true);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith({
        entity_type: entityType,
        entity_id: entityId,
      });
    });

    it('deve retornar false quando entidade não está indexada', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 200;

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await aiService.isIndexed(entityType, entityId);

      // Assert
      expect(result).toBe(false);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith({
        entity_type: entityType,
        entity_id: entityId,
      });
    });
  });

  describe('getEmbeddingsCount', () => {
    it('deve retornar contagem total', async () => {
      // Arrange
      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(1000);

      // Act
      const result = await aiService.getEmbeddingsCount();

      // Assert
      expect(result).toBe(1000);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith({});
    });

    it('deve retornar contagem por entidade', async () => {
      // Arrange
      const entityType = 'processo';

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(150);

      // Act
      const result = await aiService.getEmbeddingsCount({ entity_type: entityType });

      // Assert
      expect(result).toBe(150);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith({
        entity_type: entityType,
      });
    });

    it('deve retornar contagem por entidade e ID', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 300;

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(8);

      // Act
      const result = await aiService.getEmbeddingsCount({
        entity_type: entityType,
        entity_id: entityId,
      });

      // Assert
      expect(result).toBe(8);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith({
        entity_type: entityType,
        entity_id: entityId,
      });
    });
  });
});
