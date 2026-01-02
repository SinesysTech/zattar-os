import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionMarcarParcelaRecebida,
  actionRecalcularDistribuicao,
  actionListarParcelas,
  actionCancelarParcela,
} from '../../actions/parcelas-actions';
import { authenticatedAction } from '@/lib/safe-action';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import { criarParcelaMock, criarParcelaRecebidaMock } from '../fixtures';

jest.mock('@/lib/safe-action');
jest.mock('../../service');
jest.mock('next/cache');

describe('Parcelas Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionMarcarParcelaRecebida', () => {
    it('deve marcar parcela como recebida', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        acordoCondenacaoId: 10,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
        dataEfetivacao: new Date('2024-01-16'),
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionMarcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
        dataEfetivacao: new Date('2024-01-16'),
      });

      // Assert
      expect(service.marcarParcelaRecebida).toHaveBeenCalledWith({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
        dataEfetivacao: expect.any(Date),
      });
      expect(result).toEqual(parcelaRecebida);
    });

    it('deve revalidar cache', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        acordoCondenacaoId: 10,
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionMarcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/acordos/${parcelaRecebida.acordoCondenacaoId}`
      );
    });

    it('deve validar forma de pagamento obrigatória', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Forma de pagamento é obrigatória',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionMarcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: null as any,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Forma de pagamento é obrigatória');
    });

    it('deve aceitar comprovante de pagamento', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        comprovantePagamentoUrl: 'https://storage.example.com/comprovante.pdf',
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionMarcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'transferencia',
        comprovantePagamentoUrl: 'https://storage.example.com/comprovante.pdf',
      });

      // Assert
      expect(result.comprovantePagamentoUrl).toBe(
        'https://storage.example.com/comprovante.pdf'
      );
    });
  });

  describe('actionRecalcularDistribuicao', () => {
    it('deve recalcular distribuição de acordo', async () => {
      // Arrange
      const acordoId = 10;
      const parcelasRecalculadas = [
        criarParcelaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2 }),
      ];

      (service.recalcularDistribuicao as jest.Mock).mockResolvedValue(
        parcelasRecalculadas
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionRecalcularDistribuicao({ acordoId });

      // Assert
      expect(service.recalcularDistribuicao).toHaveBeenCalledWith(acordoId);
      expect(result).toEqual(parcelasRecalculadas);
      expect(result).toHaveLength(2);
    });

    it('deve revalidar path específico do acordo', async () => {
      // Arrange
      const acordoId = 10;

      (service.recalcularDistribuicao as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionRecalcularDistribuicao({ acordoId });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/acordos/${acordoId}`);
    });

    it('deve retornar erro se acordo tem parcelas pagas', async () => {
      // Arrange
      const acordoId = 10;

      (service.recalcularDistribuicao as jest.Mock).mockRejectedValue(
        new Error('Não é possível recalcular distribuição com parcelas já pagas')
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
      const result = await actionRecalcularDistribuicao({ acordoId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Não é possível recalcular distribuição com parcelas já pagas'
      );
    });
  });

  describe('actionListarParcelas', () => {
    it('deve listar parcelas por acordo', async () => {
      // Arrange
      const acordoId = 10;
      const mockParcelas = [
        criarParcelaMock({ id: 1, acordoCondenacaoId: acordoId }),
        criarParcelaMock({ id: 2, acordoCondenacaoId: acordoId }),
      ];

      (service.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
        mockParcelas
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionListarParcelas({ acordoId });

      // Assert
      expect(service.listarParcelasPorAcordo).toHaveBeenCalledWith(acordoId);
      expect(result).toEqual(mockParcelas);
      expect(result).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      // Arrange
      const acordoId = 10;
      const mockParcelas = [
        criarParcelaMock({ id: 1, status: 'pendente' }),
      ];

      (service.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
        mockParcelas
      );

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionListarParcelas({
        acordoId,
        status: 'pendente',
      });

      // Assert
      expect(service.listarParcelasPorAcordo).toHaveBeenCalledWith(
        acordoId,
        { status: 'pendente' }
      );
    });
  });

  describe('actionCancelarParcela', () => {
    it('deve cancelar parcela', async () => {
      // Arrange
      const parcelaId = 1;
      const motivo = 'Acordo cancelado por descumprimento';

      const parcelaCancelada = criarParcelaMock({
        id: parcelaId,
        status: 'cancelado',
        observacoes: motivo,
      });

      (service.cancelarParcela as jest.Mock).mockResolvedValue(parcelaCancelada);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionCancelarParcela({
        parcelaId,
        motivo,
      });

      // Assert
      expect(service.cancelarParcela).toHaveBeenCalledWith(parcelaId, motivo);
      expect(result.status).toBe('cancelado');
      expect(result.observacoes).toBe(motivo);
    });

    it('deve validar motivo obrigatório', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Motivo é obrigatório',
            };
          }
          return handler(input, {} as any);
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionCancelarParcela({
        parcelaId: 1,
        motivo: '',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Motivo é obrigatório');
    });

    it('deve revalidar cache após cancelamento', async () => {
      // Arrange
      const parcelaId = 1;
      const parcelaCancelada = criarParcelaMock({
        id: parcelaId,
        acordoCondenacaoId: 10,
        status: 'cancelado',
      });

      (service.cancelarParcela as jest.Mock).mockResolvedValue(parcelaCancelada);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: any) => handler(input, { userId: 'user123' } as any);
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionCancelarParcela({
        parcelaId,
        motivo: 'Motivo',
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith(
        `/dashboard/acordos/${parcelaCancelada.acordoCondenacaoId}`
      );
    });
  });
});
