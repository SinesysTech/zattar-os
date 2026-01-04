import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionListarLancamentos,
  actionCriarLancamento,
  actionAtualizarLancamento,
  actionExcluirLancamento,
  actionConfirmarLancamento,
  actionCancelarLancamento,
  actionEstornarLancamento,
} from '../../actions/lancamentos';
import { LancamentosService } from '../../services/lancamentos';
import { revalidatePath } from 'next/cache';
import { criarLancamentoMock, criarResumoVencimentosMock } from '../fixtures';

jest.mock('../../services/lancamentos');
jest.mock('next/cache');

describe('CRUD de Lançamentos', () => {
  const mockLancamento = criarLancamentoMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarLancamentos', () => {
    it('deve buscar lançamentos + total + resumo em paralelo', async () => {
      const mockLancamentos = [mockLancamento];
      const mockResumo = criarResumoVencimentosMock();

      (LancamentosService.listar as jest.Mock).mockResolvedValue(mockLancamentos);
      (LancamentosService.contar as jest.Mock).mockResolvedValue(100);
      (LancamentosService.buscarResumoVencimentos as jest.Mock).mockResolvedValue(mockResumo);

      const result = await actionListarLancamentos({
        pagina: 1,
        limite: 10,
      });

      expect(LancamentosService.listar).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
      });
      expect(LancamentosService.contar).toHaveBeenCalled();
      expect(LancamentosService.buscarResumoVencimentos).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: {
          dados: mockLancamentos,
          meta: {
            total: 100,
            pagina: 1,
            limite: 10,
            totalPaginas: 10,
          },
          resumo: mockResumo,
        },
      });
    });

    it('deve retornar paginação completa', async () => {
      const mockLancamentos = [mockLancamento];
      const mockResumo = criarResumoVencimentosMock();

      (LancamentosService.listar as jest.Mock).mockResolvedValue(mockLancamentos);
      (LancamentosService.contar as jest.Mock).mockResolvedValue(100);
      (LancamentosService.buscarResumoVencimentos as jest.Mock).mockResolvedValue(mockResumo);

      const result = await actionListarLancamentos({
        pagina: 2,
        limite: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.total).toBe(100);
        expect(result.data.dados).toHaveLength(1);
      }
    });

    it('deve tratar erros', async () => {
      (LancamentosService.listar as jest.Mock).mockRejectedValue(
        new Error('Erro ao listar')
      );

      const result = await actionListarLancamentos({
        pagina: 1,
        limite: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionCriarLancamento', () => {
    it('deve criar lançamento', async () => {
      const novoLancamento = {
        tipo: 'receita' as const,
        categoria: 'honorarios',
        descricao: 'Novo lançamento',
        valor: 1000,
        dataVencimento: '2024-01-15',
        contaBancariaId: 1,
      };

      (LancamentosService.criar as jest.Mock).mockResolvedValue(mockLancamento);

      const result = await actionCriarLancamento(novoLancamento);

      expect(LancamentosService.criar).toHaveBeenCalledWith(novoLancamento);
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao criar', async () => {
      (LancamentosService.criar as jest.Mock).mockRejectedValue(
        new Error('Erro ao criar')
      );

      const result = await actionCriarLancamento({
        tipo: 'receita' as const,
        categoria: 'honorarios',
        descricao: 'Teste',
        valor: 1000,
        dataVencimento: '2024-01-15',
        contaBancariaId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionAtualizarLancamento', () => {
    it('deve atualizar lançamento', async () => {
      (LancamentosService.atualizar as jest.Mock).mockResolvedValue(mockLancamento);

      const result = await actionAtualizarLancamento(1, {
        descricao: 'Lançamento atualizado',
        valor: 2000,
      });

      expect(LancamentosService.atualizar).toHaveBeenCalledWith(1, {
        descricao: 'Lançamento atualizado',
        valor: 2000,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao atualizar', async () => {
      (LancamentosService.atualizar as jest.Mock).mockRejectedValue(
        new Error('Erro ao atualizar')
      );

      const result = await actionAtualizarLancamento(1, {
        descricao: 'Teste',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionExcluirLancamento', () => {
    it('deve validar ID e excluir lançamento', async () => {
      (LancamentosService.excluir as jest.Mock).mockResolvedValue(true);

      const result = await actionExcluirLancamento(1);

      expect(LancamentosService.excluir).toHaveBeenCalledWith(1);
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros', async () => {
      (LancamentosService.excluir as jest.Mock).mockRejectedValue(
        new Error('Erro ao excluir')
      );

      const result = await actionExcluirLancamento(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionConfirmarLancamento', () => {
    it('deve confirmar lançamento e adicionar dataEfetivacao', async () => {
      const mockConfirmado = {
        ...mockLancamento,
        status: 'confirmado' as const,
        dataEfetivacao: new Date().toISOString(),
      };

      (LancamentosService.atualizar as jest.Mock).mockResolvedValue(mockConfirmado);

      const result = await actionConfirmarLancamento(1);

      expect(LancamentosService.atualizar).toHaveBeenCalledWith(1, {
        status: 'confirmado',
        dataEfetivacao: expect.any(String),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao confirmar', async () => {
      (LancamentosService.atualizar as jest.Mock).mockRejectedValue(
        new Error('Erro ao confirmar')
      );

      const result = await actionConfirmarLancamento(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionCancelarLancamento', () => {
    it('deve cancelar lançamento', async () => {
      const mockCancelado = {
        ...mockLancamento,
        status: 'cancelado' as const,
      };

      (LancamentosService.atualizar as jest.Mock).mockResolvedValue(mockCancelado);

      const result = await actionCancelarLancamento(1);

      expect(LancamentosService.atualizar).toHaveBeenCalledWith(1, {
        status: 'cancelado',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao cancelar', async () => {
      (LancamentosService.atualizar as jest.Mock).mockRejectedValue(
        new Error('Erro ao cancelar')
      );

      const result = await actionCancelarLancamento(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionEstornarLancamento', () => {
    it('deve estornar lançamento', async () => {
      const mockEstornado = {
        ...mockLancamento,
        status: 'estornado' as const,
      };

      (LancamentosService.atualizar as jest.Mock).mockResolvedValue(mockEstornado);

      const result = await actionEstornarLancamento(1);

      expect(LancamentosService.atualizar).toHaveBeenCalledWith(1, {
        status: 'estornado',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao estornar', async () => {
      (LancamentosService.atualizar as jest.Mock).mockRejectedValue(
        new Error('Erro ao estornar')
      );

      const result = await actionEstornarLancamento(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
