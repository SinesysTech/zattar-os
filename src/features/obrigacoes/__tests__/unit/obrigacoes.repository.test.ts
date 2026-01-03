// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import { criarAcordoMock, criarParcelaMock } from '../fixtures';

jest.mock('@/lib/supabase/service-client');

describe('Obrigações Repository', () => {
  let mockSupabaseClient: {
    from: jest.MockedFunction<(table: string) => unknown>;
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('criarAcordo', () => {
    it('deve inserir acordo no Supabase', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      };

      const acordoCriado = criarAcordoMock(novoAcordo);

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: acordoCriado,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acordos_condenacoes');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          processo_id: 100,
          tipo: 'acordo',
          direcao: 'recebimento',
          valor_total: 10000,
        })
      );
      expect(result).toEqual(acordoCriado);
    });

    it('deve aplicar valores padrão (percentual 30%)', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
      };

      const acordoCriado = criarAcordoMock({
        ...novoAcordo,
        percentualEscritorio: 30,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: acordoCriado,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(result.percentualEscritorio).toBe(30);
    });

    it('deve mapear resultado corretamente', async () => {
      // Arrange
      const novoAcordo = {
        processoId: 100,
        tipo: 'acordo' as const,
        direcao: 'recebimento' as const,
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      };

      const dbResult = {
        id: 1,
        processo_id: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valor_total: 10000,
        numero_parcelas: 2,
        percentual_escritorio: 30,
        data_vencimento_primeira_parcela: '2024-01-15',
        intervalo_vencimento_dias: 30,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.criarAcordo(novoAcordo);

      // Assert
      expect(result).toHaveProperty('processoId');
      expect(result).toHaveProperty('numeroParcelas');
      expect(result).toHaveProperty('percentualEscritorio');
      expect(result).toHaveProperty('dataVencimentoPrimeiraParcela');
    });
  });

  describe('listarAcordos', () => {
    it('deve listar com join de parcelas e acervo', async () => {
      // Arrange
      const mockAcordos = [
        {
          id: 1,
          processo_id: 100,
          tipo: 'acordo',
          valor_total: 10000,
          numero_parcelas: 2,
          parcelas: [
            { id: 1, status: 'recebido' },
            { id: 2, status: 'pendente' },
          ],
          acervo: {
            numero_processo: '0001234-56.2023.5.02.0001',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAcordos,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('acordos_condenacoes');
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('parcelas'),
        expect.objectContaining({ count: 'exact' })
      );
      expect(result.data).toHaveLength(1);
    });

    it('deve aplicar filtros de busca textual', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        range: mockRange,
      });

      // Act
      await repository.listarAcordos({
        busca: '0001234',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(mockIlike).toHaveBeenCalledWith(
        'acervo.numero_processo',
        '%0001234%'
      );
    });

    it('deve calcular totalParcelas e parcelasPagas', async () => {
      // Arrange
      const mockAcordos = [
        {
          id: 1,
          tipo: 'acordo',
          parcelas: [
            { id: 1, status: 'recebido' },
            { id: 2, status: 'recebido' },
            { id: 3, status: 'pendente' },
          ],
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAcordos,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        page: 1,
        pageSize: 10,
      });

      // Assert
      const acordo = result.data[0];
      expect(acordo.totalParcelas).toBe(3);
      expect(acordo.parcelasPagas).toBe(2);
    });

    it('deve retornar paginação correta', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await repository.listarAcordos({
        page: 2,
        pageSize: 10,
      });

      // Assert
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
      });
      expect(mockRange).toHaveBeenCalledWith(10, 19); // page 2, skip 10, take 10
    });
  });

  describe('criarParcelas', () => {
    it('deve inserir múltiplas parcelas', async () => {
      // Arrange
      const parcelas = [
        {
          acordoCondenacaoId: 1,
          numeroParcela: 1,
          dataVencimento: new Date('2024-01-15'),
          valorBrutoCreditoPrincipal: 5000,
          valorLiquidoRepasse: 3500,
          valorLiquidoEscritorio: 1500,
          status: 'pendente' as const,
        },
        {
          acordoCondenacaoId: 1,
          numeroParcela: 2,
          dataVencimento: new Date('2024-02-15'),
          valorBrutoCreditoPrincipal: 5000,
          valorLiquidoRepasse: 3500,
          valorLiquidoEscritorio: 1500,
          status: 'pendente' as const,
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: parcelas.map((p, i) => criarParcelaMock({ id: i + 1, ...p })),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await repository.criarParcelas(parcelas);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parcelas');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            acordo_condenacao_id: 1,
            numero_parcela: 1,
          }),
          expect.objectContaining({
            acordo_condenacao_id: 1,
            numero_parcela: 2,
          }),
        ])
      );
      expect(result).toHaveLength(2);
    });

    it('deve mapear campos snake_case para camelCase', async () => {
      // Arrange
      const parcelas = [
        {
          acordoCondenacaoId: 1,
          numeroParcela: 1,
          dataVencimento: new Date('2024-01-15'),
          valorBrutoCreditoPrincipal: 5000,
          valorLiquidoRepasse: 3500,
          valorLiquidoEscritorio: 1500,
          status: 'pendente' as const,
        },
      ];

      const dbResult = [
        {
          id: 1,
          acordo_condenacao_id: 1,
          numero_parcela: 1,
          data_vencimento: '2024-01-15',
          valor_bruto_credito_principal: 5000,
          valor_liquido_repasse: 3500,
          valor_liquido_escritorio: 1500,
          status: 'pendente',
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: dbResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await repository.criarParcelas(parcelas);

      // Assert
      expect(result[0]).toHaveProperty('acordoCondenacaoId');
      expect(result[0]).toHaveProperty('numeroParcela');
      expect(result[0]).toHaveProperty('valorBrutoCreditoPrincipal');
      expect(result[0]).toHaveProperty('valorLiquidoRepasse');
    });
  });

  describe('marcarParcelaComoRecebida', () => {
    it('deve atualizar status e data', async () => {
      // Arrange
      const parcelaId = 1;
      const dados = {
        valorEfetivado: 5000,
        formaPagamento: 'pix' as const,
        dataEfetivacao: new Date('2024-01-16'),
      };

      const parcelaAtualizada = criarParcelaMock({
        id: parcelaId,
        status: 'recebido',
        valorEfetivado: 5000,
        formaPagamento: 'pix',
        dataEfetivacao: new Date('2024-01-16'),
      });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: parcelaAtualizada,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await repository.marcarParcelaComoRecebida(parcelaId, dados);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parcelas');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'recebido',
          valor_efetivado: 5000,
          forma_pagamento: 'pix',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', parcelaId);
      expect(result.status).toBe('recebido');
    });

    it('deve atualizar valor se fornecido', async () => {
      // Arrange
      const parcelaId = 1;
      const dados = {
        valorEfetivado: 4800,
        formaPagamento: 'transferencia' as const,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: criarParcelaMock({ id: parcelaId, valorEfetivado: 4800 }),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await repository.marcarParcelaComoRecebida(parcelaId, dados);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          valor_efetivado: 4800,
        })
      );
    });
  });

  describe('listarRepassesPendentes', () => {
    it('deve buscar da view repasses_pendentes', async () => {
      // Arrange
      const mockRepasses = [
        {
          id: 1,
          parcela_id: 1,
          processo_id: 100,
          cliente_id: 50,
          valor_repasse: 3500,
          status_repasse: 'pendente',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockRepasses,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      // Act
      const result = await repository.listarRepassesPendentes();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('repasses_pendentes');
      expect(result).toHaveLength(1);
    });

    it('deve aplicar filtros de status e data', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockLte = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        gte: mockGte,
      });

      mockGte.mockReturnValue({
        lte: mockLte,
      });

      // Act
      await repository.listarRepassesPendentes({
        status: 'pendente',
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-01-31'),
      });

      // Assert
      expect(mockEq).toHaveBeenCalledWith('status_repasse', 'pendente');
      expect(mockGte).toHaveBeenCalledWith(
        'data_repasse_prevista',
        expect.any(String)
      );
      expect(mockLte).toHaveBeenCalledWith(
        'data_repasse_prevista',
        expect.any(String)
      );
    });
  });
});
