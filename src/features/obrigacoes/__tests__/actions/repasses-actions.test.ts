import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionListarRepassesPendentes,
  actionAnexarDeclaracao,
  actionRegistrarRepasse,
  actionListarRepassesPorCliente,
} from '../../actions/repasses-actions';
import { authenticatedAction } from '@/lib/safe-action';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import {
  criarRepassePendenteMock,
  criarRepasseEfetivadoMock,
} from '../fixtures';

jest.mock('@/lib/safe-action');
jest.mock('../../service');
jest.mock('next/cache');

describe('Repasses Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarRepassesPendentes', () => {
    it('deve listar repasses com filtros', async () => {
      // Arrange
      const repassesPendentes = [
        criarRepassePendenteMock({
          id: 1,
          valorRepasse: 3500,
          statusRepasse: 'pendente',
        }),
        criarRepassePendenteMock({
          id: 2,
          valorRepasse: 7000,
          statusRepasse: 'pendente',
        }),
      ];

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue(
        repassesPendentes
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionListarRepassesPendentes({
        status: 'pendente',
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        status: 'pendente',
      });
      expect(result).toEqual(repassesPendentes);
      expect(result).toHaveLength(2);
    });

    it('deve aplicar filtros de data', async () => {
      // Arrange
      const dataInicio = new Date('2024-01-01');
      const dataFim = new Date('2024-01-31');

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionListarRepassesPendentes({
        dataInicio,
        dataFim,
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        dataInicio,
        dataFim,
      });
    });

    it('deve filtrar por cliente', async () => {
      // Arrange
      const clienteId = 50;

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionListarRepassesPendentes({
        clienteId,
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        clienteId,
      });
    });
  });

  describe('actionAnexarDeclaracao', () => {
    it('deve anexar URL de declaração', async () => {
      // Arrange
      const repasseId = 1;
      const declaracaoUrl = 'https://storage.example.com/declaracao.pdf';

      const repasseComDeclaracao = criarRepassePendenteMock({
        id: repasseId,
        declaracaoPrestacaoContasUrl: declaracaoUrl,
      });

      (service.anexarDeclaracaoPrestacaoContas as jest.Mock).mockResolvedValue(
        repasseComDeclaracao
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionAnexarDeclaracao({
        repasseId,
        declaracaoUrl,
      });

      // Assert
      expect(service.anexarDeclaracaoPrestacaoContas).toHaveBeenCalledWith(
        repasseId,
        declaracaoUrl
      );
      expect(result.declaracaoPrestacaoContasUrl).toBe(declaracaoUrl);
    });

    it('deve revalidar cache de repasses', async () => {
      // Arrange
      const repasseId = 1;
      const repasseComDeclaracao = criarRepassePendenteMock({
        id: repasseId,
      });

      (service.anexarDeclaracaoPrestacaoContas as jest.Mock).mockResolvedValue(
        repasseComDeclaracao
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionAnexarDeclaracao({
        repasseId,
        declaracaoUrl: 'https://storage.example.com/declaracao.pdf',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/repasses');
    });

    it('deve validar URL obrigatória', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'URL da declaração é obrigatória',
            };
          }
          return handler(input, {} as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionAnexarDeclaracao({
        repasseId: 1,
        declaracaoUrl: '',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('URL da declaração é obrigatória');
    });
  });

  describe('actionRegistrarRepasse', () => {
    it('deve registrar repasse com comprovante', async () => {
      // Arrange
      const parcelaId = 1;
      const dadosRepasse = {
        arquivoComprovantePath: 'uploads/comprovante-repasse.pdf',
        usuarioRepasseId: 100,
        dataRepasse: '2024-01-22',
      };

      (service.registrarRepasse as jest.Mock).mockResolvedValue(undefined);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionRegistrarRepasse({
        parcelaId,
        ...dadosRepasse,
      });

      // Assert
      expect(service.registrarRepasse).toHaveBeenCalledWith(
        parcelaId,
        expect.objectContaining({
          arquivoComprovantePath: 'uploads/comprovante-repasse.pdf',
          usuarioRepasseId: 100,
          dataRepasse: '2024-01-22',
        })
      );
    });

    it('deve validar declaração anexada', async () => {
      // Arrange
      const parcelaId = 1;

      (service.registrarRepasse as jest.Mock).mockRejectedValue(
        new Error(
          'Declaração de prestação de contas obrigatória'
        )
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          try {
            return await handler(input, { userId: 'user123' } as { userId: string });
          } catch (error: unknown) {
            return {
              success: false,
              error: (error as Error).message,
            };
          }
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRegistrarRepasse({
        parcelaId,
        arquivoComprovantePath: 'uploads/comprovante.pdf',
        usuarioRepasseId: 100,
        dataRepasse: '2024-01-22',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Declaração de prestação de contas obrigatória'
      );
    });

    it('deve revalidar cache após registro', async () => {
      // Arrange
      const parcelaId = 1;

      (service.registrarRepasse as jest.Mock).mockResolvedValue(undefined);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionRegistrarRepasse({
        parcelaId,
        arquivoComprovantePath: 'uploads/comprovante.pdf',
        usuarioRepasseId: 100,
        dataRepasse: '2024-01-22',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/repasses');
    });

    it('deve validar comprovante obrigatório', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Comprovante de repasse é obrigatório',
            };
          }
          return handler(input, {} as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRegistrarRepasse({
        parcelaId: 1,
        arquivoComprovantePath: '',
        usuarioRepasseId: 100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Comprovante de repasse é obrigatório');
    });
  });

  describe('actionListarRepassesPorCliente', () => {
    it('deve listar repasses por cliente', async () => {
      // Arrange
      const clienteId = 50;

      const repassesCliente = [
        criarRepasseEfetivadoMock({
          id: 1,
          clienteId,
          valorRepasse: 3500,
        }),
        criarRepassePendenteMock({
          id: 2,
          clienteId,
          valorRepasse: 7000,
        }),
      ];

      (service.listarRepassesPorCliente as jest.Mock).mockResolvedValue(
        repassesCliente
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionListarRepassesPorCliente({ clienteId });

      // Assert
      expect(service.listarRepassesPorCliente).toHaveBeenCalledWith(clienteId);
      expect(result).toEqual(repassesCliente);
      expect(result).toHaveLength(2);
      expect(result[0].clienteId).toBe(clienteId);
      expect(result[1].clienteId).toBe(clienteId);
    });

    it('deve retornar array vazio se cliente não tem repasses', async () => {
      // Arrange
      const clienteId = 99;

      (service.listarRepassesPorCliente as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionListarRepassesPorCliente({ clienteId });

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
