import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionBuscaSemantica,
  actionBuscaHibrida,
  actionObterContextoRAG,
  actionBuscarSimilares,
} from '../../actions';
import { authenticatedAction } from '@/lib/safe-action';
import * as retrieval from '@/lib/ai/retrieval';

jest.mock('@/lib/safe-action');
jest.mock('@/lib/ai/retrieval');

describe('Busca Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionBuscaSemantica', () => {
    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => ({
          success: false,
          error: 'Não autenticado',
        });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'teste' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Não autenticado');
    });

    it('deve validar schema de entrada (query mínimo 3 caracteres)', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Query deve ter no mínimo 3 caracteres',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'ab' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Query deve ter no mínimo 3 caracteres');
    });

    it('deve chamar buscaSemantica com parâmetros corretos', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          content: 'resultado 1',
          similarity: 0.9,
        },
      ];

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({
        query: 'ação trabalhista',
        limit: 10,
      });

      // Assert
      expect(retrieval.buscaSemantica).toHaveBeenCalledWith({
        query: 'ação trabalhista',
        limit: 10,
      });
      expect(result).toEqual(mockResults);
    });

    it('deve truncar texto longo (>500 caracteres)', async () => {
      // Arrange
      const longQuery = 'a'.repeat(600);
      const truncatedQuery = longQuery.substring(0, 500);

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionBuscaSemantica({ query: longQuery });

      // Assert
      expect(retrieval.buscaSemantica).toHaveBeenCalledWith({
        query: truncatedQuery,
      });
    });

    it('deve aplicar filtros de tipo', async () => {
      // Arrange
      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionBuscaSemantica({
        query: 'busca filtrada',
        filter: {
          entity_type: 'processo',
        },
      });

      // Assert
      expect(retrieval.buscaSemantica).toHaveBeenCalledWith({
        query: 'busca filtrada',
        filter: {
          entity_type: 'processo',
        },
      });
    });

    it('deve retornar resultados formatados', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          entity_type: 'processo',
          entity_id: 100,
          content: 'Processo trabalhista',
          similarity: 0.95,
          metadata: {
            numero_processo: '0001234-56.2023.5.02.0001',
          },
        },
        {
          id: 2,
          entity_type: 'documento',
          entity_id: 200,
          content: 'Petição inicial',
          similarity: 0.87,
          metadata: {
            tipo_documento: 'petição',
          },
        },
      ];

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'teste' });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('entity_type');
      expect(result[0]).toHaveProperty('similarity');
      expect(result[0]).toHaveProperty('metadata');
    });
  });

  describe('actionBuscaHibrida', () => {
    it('deve combinar busca semântica e textual', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          content: 'resultado semântico',
          similarity: 0.9,
          source: 'semantic',
        },
        {
          id: 2,
          content: 'resultado textual',
          similarity: 0.85,
          source: 'fulltext',
        },
      ];

      (retrieval.buscaHibrida as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaHibrida({
        query: 'busca híbrida',
        limit: 10,
      });

      // Assert
      expect(retrieval.buscaHibrida).toHaveBeenCalledWith({
        query: 'busca híbrida',
        limit: 10,
      });
      expect(result).toEqual(mockResults);
    });

    it('deve validar limite máximo (50)', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success || input.limit > 50) {
            return {
              success: false,
              error: 'Limite máximo é 50',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaHibrida({
        query: 'teste',
        limit: 100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Limite máximo é 50');
    });
  });

  describe('actionObterContextoRAG', () => {
    it('deve retornar contexto formatado para LLM', async () => {
      // Arrange
      const mockContext = {
        context: 'Contexto formatado para o LLM baseado em documentos relevantes',
        sources: [
          {
            id: 1,
            tipo: 'processo',
            titulo: 'Processo 0001234',
          },
          {
            id: 2,
            tipo: 'documento',
            titulo: 'Petição Inicial',
          },
        ],
        tokensUsed: 450,
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({
        query: 'qual o status do processo?',
      });

      // Assert
      expect(retrieval.obterContextoRAG).toHaveBeenCalledWith({
        query: 'qual o status do processo?',
      });
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('tokensUsed');
      expect(result.sources).toHaveLength(2);
    });

    it('deve respeitar maxTokens', async () => {
      // Arrange
      const mockContext = {
        context: 'Contexto reduzido',
        sources: [{ id: 1, tipo: 'processo', titulo: 'Processo' }],
        tokensUsed: 100,
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({
        query: 'teste',
        maxTokens: 100,
      });

      // Assert
      expect(retrieval.obterContextoRAG).toHaveBeenCalledWith({
        query: 'teste',
        maxTokens: 100,
      });
      expect(result.tokensUsed).toBeLessThanOrEqual(100);
    });

    it('deve retornar fontes usadas', async () => {
      // Arrange
      const mockContext = {
        context: 'Contexto',
        sources: [
          {
            id: 10,
            tipo: 'processo',
            titulo: 'Processo Trabalhista',
            metadata: {
              numero_processo: '0001234-56.2023.5.02.0001',
            },
          },
        ],
        tokensUsed: 200,
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({ query: 'teste' });

      // Assert
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]).toHaveProperty('id');
      expect(result.sources[0]).toHaveProperty('tipo');
      expect(result.sources[0]).toHaveProperty('titulo');
      expect(result.sources[0]).toHaveProperty('metadata');
    });
  });

  describe('actionBuscarSimilares', () => {
    it('deve buscar documentos similares por tipo e ID', async () => {
      // Arrange
      const mockResults = [
        {
          id: 2,
          entity_type: 'processo',
          entity_id: 101,
          content: 'Processo similar 1',
          similarity: 0.92,
        },
        {
          id: 3,
          entity_type: 'processo',
          entity_id: 102,
          content: 'Processo similar 2',
          similarity: 0.88,
        },
      ];

      (retrieval.buscarSimilares as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarSimilares({
        entityType: 'processo',
        entityId: 100,
        limit: 5,
      });

      // Assert
      expect(retrieval.buscarSimilares).toHaveBeenCalledWith({
        entityType: 'processo',
        entityId: 100,
        limit: 5,
      });
      expect(result).toEqual(mockResults);
    });

    it('deve validar tipo de entidade', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Tipo de entidade inválido',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarSimilares({
        entityType: 'tipo_invalido',
        entityId: 100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tipo de entidade inválido');
    });
  });
});
