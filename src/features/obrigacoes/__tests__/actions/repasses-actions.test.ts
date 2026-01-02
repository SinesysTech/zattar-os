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
  criarRepasseMock,
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'URL da declaração é obrigatória',
            };
          }
          return handler(input, {} as any);
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
      const repasseId = 1;
      const dadosRepasse = {
        dataRepasseEfetivado: new Date('2024-01-22'),
        comprovanteRepasseUrl:
          'https://storage.example.com/comprovante-repasse.pdf',
        observacoes: 'Repasse efetuado via PIX',
      };

      const repasseEfetivado = criarRepasseEfetivadoMock({
        id: repasseId,
        ...dadosRepasse,
        statusRepasse: 'efetivado',
      });

      (service.registrarRepasse as jest.Mock).mockResolvedValue(repasseEfetivado);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRegistrarRepasse({
        repasseId,
        ...dadosRepasse,
      });

      // Assert
      expect(service.registrarRepasse).toHaveBeenCalledWith(
        repasseId,
        expect.objectContaining({
          dataRepasseEfetivado: expect.any(Date),
          comprovanteRepasseUrl:
            'https://storage.example.com/comprovante-repasse.pdf',
          observacoes: 'Repasse efetuado via PIX',
        })
      );
      expect(result.statusRepasse).toBe('efetivado');
    });

    it('deve validar declaração anexada', async () => {
      // Arrange
      const repasseId = 1;

      (service.registrarRepasse as jest.Mock).mockRejectedValue(
        new Error(
          'Declaração de prestação de contas deve ser anexada antes de registrar o repasse'
        )
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          try {
            return await handler(input, { userId: 'user123' } as any);
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
            };
          }
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRegistrarRepasse({
        repasseId,
        dataRepasseEfetivado: new Date('2024-01-22'),
        comprovanteRepasseUrl: 'https://storage.example.com/comprovante.pdf',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Declaração de prestação de contas deve ser anexada antes de registrar o repasse'
      );
    });

    it('deve revalidar cache após registro', async () => {
      // Arrange
      const repasseId = 1;
      const repasseEfetivado = criarRepasseEfetivadoMock({
        id: repasseId,
        processoId: 100,
      });

      (service.registrarRepasse as jest.Mock).mockResolvedValue(repasseEfetivado);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionRegistrarRepasse({
        repasseId,
        dataRepasseEfetivado: new Date('2024-01-22'),
        comprovanteRepasseUrl: 'https://storage.example.com/comprovante.pdf',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/repasses');
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/processos/${repasseEfetivado.processoId}`
      );
    });

    it('deve validar comprovante obrigatório', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Comprovante de repasse é obrigatório',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRegistrarRepasse({
        repasseId: 1,
        dataRepasseEfetivado: new Date('2024-01-22'),
        comprovanteRepasseUrl: '',
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
        return async (input: any) => handler(input, { userId: 'user123' } as any);
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
