import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { actionBuscaSemantica, actionBuscaHibrida } from '../../actions';
import * as retrieval from '@/lib/ai/retrieval';
import { authenticatedAction } from '@/lib/safe-action';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/features/ai/services/embedding.service';

jest.mock('@/lib/safe-action');
jest.mock('@/lib/ai/retrieval');
jest.mock('@/lib/supabase/server');
jest.mock('@/features/ai/services/embedding.service');

describe('Busca Semântica Integration', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    // Mock authenticatedAction to always authenticate
    const mockAuthAction = jest.fn((schema, handler) => {
      return async (input: any) => handler(input, { userId: 'user123' } as any);
    });

    (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);
  });

  it('deve buscar processos por query natural', async () => {
    // Arrange
    const query = 'processos trabalhistas sobre demissão sem justa causa';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockProcessos = [
      {
        id: 1,
        entity_type: 'processo',
        entity_id: 100,
        content:
          'Reclamação trabalhista - Demissão sem justa causa - Pedido de indenização',
        similarity: 0.94,
        metadata: {
          numero_processo: '0001234-56.2023.5.02.0001',
          autor: 'João Silva',
          reu: 'Empresa ABC Ltda',
          vara: '1ª Vara do Trabalho',
          data_distribuicao: '2023-06-15',
        },
      },
      {
        id: 2,
        entity_type: 'processo',
        entity_id: 101,
        content:
          'Ação trabalhista sobre dispensa imotivada e pedido de reintegração',
        similarity: 0.89,
        metadata: {
          numero_processo: '0005678-90.2023.5.02.0002',
          autor: 'Maria Santos',
          reu: 'Empresa XYZ S/A',
          vara: '2ª Vara do Trabalho',
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockProcessos);

    // Act
    const result = await actionBuscaSemantica({
      query,
      limit: 10,
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].entity_type).toBe('processo');
    expect(result[0].similarity).toBeGreaterThan(0.85);
    expect(result[0].metadata).toHaveProperty('numero_processo');
    expect(result[0].metadata).toHaveProperty('autor');
    expect(retrieval.buscaSemantica).toHaveBeenCalledWith({
      query,
      limit: 10,
    });
  });

  it('deve buscar documentos por similaridade', async () => {
    // Arrange
    const query = 'petições iniciais de ação de cobrança';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockDocumentos = [
      {
        id: 10,
        entity_type: 'documento',
        entity_id: 500,
        content: 'Petição Inicial - Ação de Cobrança - Honorários Advocatícios',
        similarity: 0.96,
        metadata: {
          tipo_documento: 'petição',
          processo_id: 100,
          data_criacao: '2023-05-20',
        },
      },
      {
        id: 11,
        entity_type: 'documento',
        entity_id: 501,
        content: 'Inicial de Cobrança - Valores não pagos por serviços prestados',
        similarity: 0.91,
        metadata: {
          tipo_documento: 'petição',
          processo_id: 101,
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockDocumentos);

    // Act
    const result = await actionBuscaSemantica({
      query,
      filter: {
        entity_type: 'documento',
      },
      limit: 5,
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].entity_type).toBe('documento');
    expect(result[0].metadata.tipo_documento).toBe('petição');
    expect(retrieval.buscaSemantica).toHaveBeenCalledWith({
      query,
      filter: {
        entity_type: 'documento',
      },
      limit: 5,
    });
  });

  it('deve combinar busca semântica com filtros SQL', async () => {
    // Arrange
    const query = 'acordos trabalhistas com valor superior a 50 mil';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockAcordos = [
      {
        id: 20,
        entity_type: 'acordo',
        entity_id: 1000,
        content: 'Acordo trabalhista - Valor total: R$ 75.000,00',
        similarity: 0.93,
        metadata: {
          processo_id: 100,
          valor_total: 75000,
          numero_parcelas: 5,
          status: 'ativo',
        },
      },
      {
        id: 21,
        entity_type: 'acordo',
        entity_id: 1001,
        content: 'Acordo de indenização - Montante de R$ 120.000,00',
        similarity: 0.88,
        metadata: {
          processo_id: 102,
          valor_total: 120000,
          numero_parcelas: 10,
          status: 'ativo',
        },
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaHibrida as jest.Mock).mockResolvedValue(mockAcordos);

    // Act
    const result = await actionBuscaHibrida({
      query,
      filter: {
        entity_type: 'acordo',
        metadata: {
          valor_total_gte: 50000,
        },
      },
      limit: 10,
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].entity_type).toBe('acordo');
    expect(result[0].metadata.valor_total).toBeGreaterThanOrEqual(50000);
    expect(result[1].metadata.valor_total).toBeGreaterThanOrEqual(50000);
    expect(retrieval.buscaHibrida).toHaveBeenCalledWith({
      query,
      filter: {
        entity_type: 'acordo',
        metadata: {
          valor_total_gte: 50000,
        },
      },
      limit: 10,
    });
  });
});
