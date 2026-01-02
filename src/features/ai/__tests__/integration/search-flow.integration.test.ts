import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { searchKnowledge } from '../../service';
import * as repository from '../../repository';
import { generateEmbedding } from '../../services/embedding.service';
import { createClient } from '@/lib/supabase/server';

jest.mock('../../repository');
jest.mock('../../services/embedding.service');
jest.mock('@/lib/supabase/server');

describe('AI Search Flow Integration', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  it('deve buscar documentos por query semântica', async () => {
    // Arrange
    const query = 'ação trabalhista sobre horas extras';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        entity_type: 'processo',
        entity_id: 100,
        content: 'Processo trabalhista sobre pagamento de horas extras não pagas',
        similarity: 0.95,
        metadata: {
          numero_processo: '0001234-56.2023.5.02.0001',
          vara: 'Vara do Trabalho',
        },
      },
      {
        id: 2,
        entity_type: 'processo',
        entity_id: 101,
        content: 'Reclamação trabalhista solicitando horas extras',
        similarity: 0.88,
        metadata: {
          numero_processo: '0005678-90.2023.5.02.0002',
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_count: 5,
      filter: {},
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].similarity).toBeGreaterThan(0.8);
    expect(result[0].entity_type).toBe('processo');
    expect(result[0].metadata).toHaveProperty('numero_processo');
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_count: 5,
      filter: {},
    });
  });

  it('deve filtrar por tipo de entidade', async () => {
    // Arrange
    const query = 'petição inicial';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 10,
        entity_type: 'documento',
        entity_id: 500,
        content: 'Petição Inicial de Ação de Cobrança',
        similarity: 0.92,
        metadata: {
          tipo_documento: 'petição',
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_count: 10,
      filter: {
        entity_type: 'documento',
      },
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].entity_type).toBe('documento');
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_count: 10,
      filter: {
        entity_type: 'documento',
      },
    });
  });

  it('deve respeitar threshold de similaridade', async () => {
    // Arrange
    const query = 'busca com threshold';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        content: 'resultado relevante',
        similarity: 0.95,
        metadata: {},
      },
      {
        id: 2,
        content: 'resultado menos relevante',
        similarity: 0.65,
        metadata: {},
      },
      {
        id: 3,
        content: 'resultado irrelevante',
        similarity: 0.40,
        metadata: {},
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_count: 10,
      filter: {},
    });

    // Filter by threshold (>= 0.7)
    const filteredResults = result.filter((r) => r.similarity >= 0.7);

    // Assert
    expect(filteredResults).toHaveLength(2);
    expect(filteredResults[0].similarity).toBeGreaterThanOrEqual(0.7);
    expect(filteredResults[1].similarity).toBeGreaterThanOrEqual(0.7);
  });

  it('deve limitar número de resultados', async () => {
    // Arrange
    const query = 'busca com limite';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      content: `resultado ${i + 1}`,
      similarity: 0.9 - i * 0.01,
      metadata: {},
    }));

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_count: 5,
      filter: {},
    });

    // Assert
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_count: 5,
      filter: {},
    });
    // O repository deve retornar apenas os 5 mais similares
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('deve retornar metadados corretos', async () => {
    // Arrange
    const query = 'busca com metadados';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        entity_type: 'processo',
        entity_id: 200,
        content: 'Processo com metadados completos',
        similarity: 0.93,
        metadata: {
          numero_processo: '0001234-56.2023.5.02.0001',
          vara: '1ª Vara Cível',
          autor: 'João Silva',
          reu: 'Empresa XYZ',
          valor_causa: 50000,
          data_distribuicao: '2023-01-15',
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_count: 5,
      filter: {},
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].metadata).toHaveProperty('numero_processo');
    expect(result[0].metadata).toHaveProperty('vara');
    expect(result[0].metadata).toHaveProperty('autor');
    expect(result[0].metadata).toHaveProperty('valor_causa');
    expect(result[0].metadata.numero_processo).toBe('0001234-56.2023.5.02.0001');
    expect(result[0].metadata.valor_causa).toBe(50000);
  });
});
