import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionCriarAcordoComParcelas,
  actionBuscarAcordosPorCPF,
  actionBuscarAcordosPorNumeroProcesso,
  actionListarAcordos,
} from '../../actions/acordos-actions';
import { authenticatedAction } from '@/lib/safe-action';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import { criarAcordoMock, criarParcelaMock } from '../fixtures';

jest.mock('@/lib/safe-action');
jest.mock('../../service');
jest.mock('next/cache');

describe('Acordos Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionCriarAcordoComParcelas', () => {
    it('deve validar schema Zod', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Dados inválidos',
            };
          }
          return handler(input, { userId: 'user123' } as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionCriarAcordoComParcelas({
        processoId: -1, // ID inválido
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: -100, // Valor negativo
        numeroParcelas: 0, // Zero parcelas
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Dados inválidos');
    });

    it('deve converter FormData para objeto', async () => {
      // Arrange
      const acordo = criarAcordoMock();
      const parcelas = [
        criarParcelaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2 }),
      ];

      (service.criarAcordoComParcelas as jest.Mock).mockResolvedValue({
        id: acordo.id,
        acordo,
        parcelas,
      });

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      });

      // Assert
      expect(service.criarAcordoComParcelas).toHaveBeenCalledWith(
        expect.objectContaining({
          processoId: 100,
          tipo: 'acordo',
          direcao: 'recebimento',
          valorTotal: 10000,
          numeroParcelas: 2,
        })
      );
      expect(result).toEqual({ id: acordo.id, acordo, parcelas });
    });

    it('deve chamar service com parâmetros corretos', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        processoId: 100,
        tipo: 'condenacao',
        direcao: 'pagamento',
        valorTotal: 15000,
        numeroParcelas: 3,
      });

      const parcelas = Array.from({ length: 3 }, (_, i) =>
        criarParcelaMock({ id: i + 1, numeroParcela: i + 1 })
      );

      (service.criarAcordoComParcelas as jest.Mock).mockResolvedValue({
        id: acordo.id,
        acordo,
        parcelas,
      });

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'condenacao',
        direcao: 'pagamento',
        valorTotal: 15000,
        numeroParcelas: 3,
        dataVencimentoPrimeiraParcela: new Date('2024-02-01'),
        percentualEscritorio: 40,
        formaPagamentoPadrao: 'transferencia_direta',
      });

      // Assert
      expect(service.criarAcordoComParcelas).toHaveBeenCalledWith(
        expect.objectContaining({
          processoId: 100,
          tipo: 'condenacao',
          direcao: 'pagamento',
          valorTotal: 15000,
          numeroParcelas: 3,
          percentualEscritorio: 40,
          formaPagamentoPadrao: 'transferencia_direta',
        })
      );
    });

    it('deve revalidar cache após criação', async () => {
      // Arrange
      const acordo = criarAcordoMock();
      const parcelas = [criarParcelaMock()];

      (service.criarAcordoComParcelas as jest.Mock).mockResolvedValue({
        id: acordo.id,
        acordo,
        parcelas,
      });

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionCriarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 1,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
        formaPagamentoPadrao: 'transferencia_direta',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/processos/${acordo.processoId}`
      );
    });
  });

  describe('actionBuscarAcordosPorCPF', () => {
    it('deve buscar acordos por CPF', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const mockAcordos = [
        criarAcordoMock({ id: 1, processoId: 100 }),
        criarAcordoMock({ id: 2, processoId: 101 }),
      ];

      (service.buscarAcordosPorClienteCPF as jest.Mock).mockResolvedValue(
        mockAcordos
      );

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarAcordosPorCPF({ cpf });

      // Assert
      expect(service.buscarAcordosPorClienteCPF).toHaveBeenCalledWith(cpf);
      expect(result).toEqual(mockAcordos);
      expect(result).toHaveLength(2);
    });

    it('deve validar CPF obrigatório', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'CPF é obrigatório',
            };
          }
          return handler(input, { userId: 'user123' } as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarAcordosPorCPF({ cpf: '' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('CPF é obrigatório');
    });

    it('deve normalizar CPF antes de buscar', async () => {
      // Arrange
      const cpf = '123.456.789-00';

      (service.buscarAcordosPorClienteCPF as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionBuscarAcordosPorCPF({ cpf });

      // Assert
      expect(service.buscarAcordosPorClienteCPF).toHaveBeenCalledWith(cpf);
    });
  });

  describe('actionBuscarAcordosPorNumeroProcesso', () => {
    it('deve buscar acordos por número de processo', async () => {
      // Arrange
      const numeroProcesso = '0001234-56.2023.5.02.0001';
      const mockAcordos = [criarAcordoMock({ processoId: 100 })];

      (service.buscarAcordosPorNumeroProcesso as jest.Mock).mockResolvedValue(
        mockAcordos
      );

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarAcordosPorNumeroProcesso({
        numeroProcesso,
      });

      // Assert
      expect(service.buscarAcordosPorNumeroProcesso).toHaveBeenCalledWith(
        numeroProcesso
      );
      expect(result).toEqual(mockAcordos);
    });

    it('deve normalizar número de processo', async () => {
      // Arrange
      const numeroProcesso = '0001234-56.2023.5.02.0001';

      (service.buscarAcordosPorNumeroProcesso as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionBuscarAcordosPorNumeroProcesso({ numeroProcesso });

      // Assert
      expect(service.buscarAcordosPorNumeroProcesso).toHaveBeenCalledWith(
        numeroProcesso
      );
    });
  });

  describe('actionListarAcordos', () => {
    it('deve listar acordos com paginação', async () => {
      // Arrange
      const mockResponse = {
        data: [
          criarAcordoMock({ id: 1 }),
          criarAcordoMock({ id: 2 }),
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      };

      (service.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionListarAcordos({
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(service.listarAcordos).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve aplicar filtros de busca', async () => {
      // Arrange
      const mockResponse = {
        data: [criarAcordoMock()],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (service.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionListarAcordos({
        page: 1,
        pageSize: 10,
        tipo: 'acordo',
        status: 'pago_parcial',
        processoId: 100,
      });

      // Assert
      expect(service.listarAcordos).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        tipo: 'acordo',
        status: 'pago_parcial',
        processoId: 100,
      });
    });
  });
});
