import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionImportarExtrato,
  actionConciliarManual,
  actionObterSugestoes,
  actionBuscarLancamentosManuais,
  actionConciliarAutomaticamente,
  actionListarTransacoes,
  actionDesconciliar,
  actionBuscarTransacao,
} from '../../actions/conciliacao';
import { conciliacaoService } from '../../services/conciliacao';
import { ConciliacaoRepository } from '../../repository/conciliacao';
import { revalidatePath } from 'next/cache';
import {
  criarTransacaoBancariaMock,
  criarLancamentoMock,
  criarConciliacaoMock,
} from '../fixtures';

jest.mock('../../services/conciliacao');
jest.mock('../../repository/conciliacao');
jest.mock('next/cache');

describe('Importação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionImportarExtrato', () => {
    it('deve importar extrato com FormData válido', async () => {
      const mockFormData = new FormData();
      mockFormData.append('contaBancariaId', '1');
      mockFormData.append('tipoArquivo', 'ofx');
      mockFormData.append('arquivo', new Blob(['conteúdo']), 'extrato.ofx');

      (conciliacaoService.importarExtrato as jest.Mock).mockResolvedValue({
        success: true,
        transacoesImportadas: 10,
      });

      const result = await actionImportarExtrato(mockFormData);

      expect(conciliacaoService.importarExtrato).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro/conciliacao-bancaria');
      expect(result.success).toBe(true);
    });

    it('deve validar dados obrigatórios', async () => {
      const mockFormData = new FormData();
      mockFormData.append('tipoArquivo', 'ofx');

      const result = await actionImportarExtrato(mockFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve tratar erros ao importar', async () => {
      const mockFormData = new FormData();
      mockFormData.append('contaBancariaId', '1');
      mockFormData.append('tipoArquivo', 'ofx');
      mockFormData.append('arquivo', new Blob(['conteúdo']), 'extrato.ofx');

      (conciliacaoService.importarExtrato as jest.Mock).mockRejectedValue(
        new Error('Erro ao processar')
      );

      const result = await actionImportarExtrato(mockFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionListarTransacoes', () => {
    it('deve listar transações com paginação', async () => {
      const mockTransacoes = [
        criarTransacaoBancariaMock({ id: 1 }),
        criarTransacaoBancariaMock({ id: 2 }),
      ];

      (conciliacaoService.listarTransacoes as jest.Mock).mockResolvedValue({
        items: mockTransacoes,
        paginacao: {
          total: 2,
          pagina: 1,
          limite: 10,
        },
        resumo: {
          totalPendentes: 2,
          totalConciliadas: 0,
        },
      });

      const result = await actionListarTransacoes({
        pagina: 1,
        limite: 10,
      });

      expect(conciliacaoService.listarTransacoes).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dados).toHaveLength(2);
        expect(result.data.meta.total).toBe(2);
        expect(result.data.resumo).toBeDefined();
      }
    });

    it('deve retornar dados, meta e resumo', async () => {
      const mockResultado = {
        items: [criarTransacaoBancariaMock()],
        paginacao: {
          total: 1,
          pagina: 1,
          limite: 10,
        },
        resumo: {
          totalPendentes: 1,
          totalConciliadas: 0,
        },
      };

      (conciliacaoService.listarTransacoes as jest.Mock).mockResolvedValue(mockResultado);

      const result = await actionListarTransacoes({
        pagina: 1,
        limite: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dados).toEqual(mockResultado.items);
        expect(result.data.meta).toEqual(mockResultado.paginacao);
        expect(result.data.resumo).toEqual(mockResultado.resumo);
      }
    });
  });
});

describe('Conciliação', () => {
  const mockTransacao = criarTransacaoBancariaMock();
  const mockLancamento = criarLancamentoMock();
  const mockConciliacao = criarConciliacaoMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionConciliarManual', () => {
    it('deve conciliar manualmente', async () => {
      (conciliacaoService.conciliarManual as jest.Mock).mockResolvedValue(
        mockConciliacao
      );

      const result = await actionConciliarManual({
        transacaoId: 1,
        lancamentoId: 1,
      });

      expect(conciliacaoService.conciliarManual).toHaveBeenCalledWith({
        transacaoId: 1,
        lancamentoId: 1,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro/conciliacao-bancaria');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao conciliar', async () => {
      (conciliacaoService.conciliarManual as jest.Mock).mockRejectedValue(
        new Error('Erro ao conciliar')
      );

      const result = await actionConciliarManual({
        transacaoId: 1,
        lancamentoId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionObterSugestoes', () => {
    it('deve buscar sugestões de lançamentos para transação', async () => {
      const mockSugestoes = [
        { ...mockLancamento, similaridade: 0.95 },
        { ...mockLancamento, id: 2, similaridade: 0.80 },
      ];

      (conciliacaoService.obterSugestoes as jest.Mock).mockResolvedValue(mockSugestoes);

      const result = await actionObterSugestoes(1);

      expect(conciliacaoService.obterSugestoes).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve retornar lista ordenada por similaridade', async () => {
      const mockSugestoes = [
        { ...mockLancamento, id: 1, similaridade: 0.95 },
        { ...mockLancamento, id: 2, similaridade: 0.80 },
        { ...mockLancamento, id: 3, similaridade: 0.90 },
      ];

      (conciliacaoService.obterSugestoes as jest.Mock).mockResolvedValue(mockSugestoes);

      const result = await actionObterSugestoes(1);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verifica se está ordenado por similaridade descendente
        const similaridades = result.data.map((s: any) => s.similaridade);
        const ordenado = [...similaridades].sort((a, b) => b - a);
        expect(similaridades).toEqual(ordenado);
      }
    });
  });

  describe('actionBuscarLancamentosManuais', () => {
    it('deve buscar lançamentos candidatos com filtros', async () => {
      const mockLancamentos = [mockLancamento];

      (conciliacaoService.buscarLancamentosCandidatos as jest.Mock).mockResolvedValue(
        mockLancamentos
      );

      const result = await actionBuscarLancamentosManuais({
        data: '2024-01-15',
        valor: 1000,
        tipo: 'receita',
      });

      expect(conciliacaoService.buscarLancamentosCandidatos).toHaveBeenCalledWith({
        data: '2024-01-15',
        valor: 1000,
        tipo: 'receita',
      });
      expect(result.success).toBe(true);
    });

    it('deve aplicar filtros (data, valor, tipo)', async () => {
      const mockLancamentos = [mockLancamento];

      (conciliacaoService.buscarLancamentosCandidatos as jest.Mock).mockResolvedValue(
        mockLancamentos
      );

      await actionBuscarLancamentosManuais({
        data: '2024-01-15',
        valor: 1000,
        tipo: 'receita',
      });

      const chamada = (conciliacaoService.buscarLancamentosCandidatos as jest.Mock)
        .mock.calls[0][0];

      expect(chamada.data).toBe('2024-01-15');
      expect(chamada.valor).toBe(1000);
      expect(chamada.tipo).toBe('receita');
    });
  });

  describe('actionConciliarAutomaticamente', () => {
    it('deve conciliar automaticamente', async () => {
      const result = await actionConciliarAutomaticamente();

      expect(revalidatePath).toHaveBeenCalledWith('/financeiro/conciliacao-bancaria');
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('deve tratar erros ao conciliar automaticamente', async () => {
      // Force an error by mocking revalidatePath to throw
      (revalidatePath as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Erro ao revalidar');
      });

      const result = await actionConciliarAutomaticamente();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionDesconciliar', () => {
    it('deve desconciliar transação', async () => {
      (conciliacaoService.desconciliar as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await actionDesconciliar(1);

      expect(conciliacaoService.desconciliar).toHaveBeenCalledWith(1);
      expect(revalidatePath).toHaveBeenCalledWith('/financeiro/conciliacao-bancaria');
      expect(result.success).toBe(true);
    });

    it('deve tratar erros ao desconciliar', async () => {
      (conciliacaoService.desconciliar as jest.Mock).mockRejectedValue(
        new Error('Erro ao desconciliar')
      );

      const result = await actionDesconciliar(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionBuscarTransacao', () => {
    it('deve buscar transação por ID e retornar dados completos', async () => {
      const mockTransacaoCompleta = {
        ...mockTransacao,
        conta_bancaria: {
          id: 1,
          nome: 'Conta Principal',
        },
        conciliacao: mockConciliacao,
      };

      (ConciliacaoRepository.buscarTransacaoPorId as jest.Mock).mockResolvedValue(
        mockTransacaoCompleta
      );

      const result = await actionBuscarTransacao(1);

      expect(ConciliacaoRepository.buscarTransacaoPorId).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTransacaoCompleta);
      }
    });

    it('deve retornar erro se transação não encontrada', async () => {
      (ConciliacaoRepository.buscarTransacaoPorId as jest.Mock).mockResolvedValue(null);

      const result = await actionBuscarTransacao(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrada');
    });

    it('deve tratar erros ao buscar transação', async () => {
      (ConciliacaoRepository.buscarTransacaoPorId as jest.Mock).mockRejectedValue(
        new Error('Erro ao buscar')
      );

      const result = await actionBuscarTransacao(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
