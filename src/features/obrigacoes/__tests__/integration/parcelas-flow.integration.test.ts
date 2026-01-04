import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  criarAcordoMock,
  criarParcelaMock,
  criarParcelaRecebidaMock,
} from '../fixtures';

jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client');

describe('Parcelas Flow Integration', () => {
  let mockSupabaseClient: {
    from: jest.MockedFunction<(table: string) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('deve marcar parcela como recebida', async () => {
    // Arrange
    const parcelaId = 1;
    const dadosRecebimento = {
      valorEfetivado: 5000,
      formaPagamento: 'pix' as const,
      dataEfetivacao: new Date('2024-01-16'),
      comprovantePagamentoUrl: 'https://storage.example.com/comprovante.pdf',
    };

    const parcelaOriginal = criarParcelaMock({
      id: parcelaId,
      status: 'pendente',
      valorBrutoCreditoPrincipal: 5000,
    });

    const parcelaRecebida = criarParcelaRecebidaMock({
      id: parcelaId,
      status: 'recebido',
      valorEfetivado: 5000,
      formaPagamento: 'pix',
      dataEfetivacao: new Date('2024-01-16'),
      comprovantePagamentoUrl: 'https://storage.example.com/comprovante.pdf',
    });

    (repository.obterParcelaPorId as jest.Mock).mockResolvedValue(
      parcelaOriginal
    );
    (repository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
      parcelaRecebida
    );

    // Act
    const result = await service.marcarParcelaRecebida({
      parcelaId,
      ...dadosRecebimento,
    });

    // Assert
    expect(result.status).toBe('recebido');
    expect(result.valorEfetivado).toBe(5000);
    expect(result.formaPagamento).toBe('pix');
    expect(result.dataEfetivacao).toEqual(new Date('2024-01-16'));
    expect(result.comprovantePagamentoUrl).toBe(
      'https://storage.example.com/comprovante.pdf'
    );
    expect(repository.marcarParcelaComoRecebida).toHaveBeenCalledWith({
      parcelaId,
      ...dadosRecebimento,
    });
  });

  it('deve atualizar valores de parcela manualmente', async () => {
    // Arrange
    const parcelaId = 1;

    const parcelaOriginal = criarParcelaMock({
      id: parcelaId,
      valorBrutoCreditoPrincipal: 5000,
      valorLiquidoRepasse: 3500,
      valorLiquidoEscritorio: 1500,
    });

    const parcelaAtualizada = criarParcelaMock({
      id: parcelaId,
      valorBrutoCreditoPrincipal: 4800,
      valorLiquidoRepasse: 3360,
      valorLiquidoEscritorio: 1440,
    });

    (repository.obterParcelaPorId as jest.Mock).mockResolvedValue(
      parcelaOriginal
    );
    (repository.atualizarParcela as jest.Mock).mockResolvedValue(
      parcelaAtualizada
    );

    // Act
    const result = await service.atualizarValoresParcela(parcelaId, {
      valorBrutoCreditoPrincipal: 4800,
    });

    // Assert
    expect(result.valorBrutoCreditoPrincipal).toBe(4800);
    expect(result.valorLiquidoRepasse).toBe(3360);
    expect(result.valorLiquidoEscritorio).toBe(1440);
    expect(repository.atualizarParcela).toHaveBeenCalledWith(
      parcelaId,
      expect.objectContaining({
        valorBrutoCreditoPrincipal: 4800,
      })
    );
  });

  it('deve recalcular distribuição de acordo', async () => {
    // Arrange
    const acordoId = 1;

    const acordo = criarAcordoMock({
      id: acordoId,
      valorTotal: 12000,
      numeroParcelas: 3,
      percentualEscritorio: 30,
    });

    const parcelasOriginais = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
      criarParcelaMock({
        id: 3,
        acordoCondenacaoId: acordoId,
        numeroParcela: 3,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
    ];

    const parcelasRecalculadas = parcelasOriginais.map((p) =>
      criarParcelaMock({
        ...p,
        valorBrutoCreditoPrincipal: 4000,
        valorLiquidoRepasse: 2800,
        valorLiquidoEscritorio: 1200,
      })
    );

    (repository.obterAcordoPorId as jest.Mock).mockResolvedValue(acordo);
    (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
      parcelasOriginais
    );
    (repository.atualizarParcelas as jest.Mock).mockResolvedValue(
      parcelasRecalculadas
    );

    // Act
    const result = await service.recalcularDistribuicao(acordoId);

    // Assert
    expect(result).toHaveLength(3);

    result.forEach((parcela) => {
      expect(parcela.valorBrutoCreditoPrincipal).toBe(4000);
      expect(parcela.valorLiquidoRepasse).toBe(2800); // 70% de 4000
      expect(parcela.valorLiquidoEscritorio).toBe(1200); // 30% de 4000
    });

    expect(repository.atualizarParcelas).toHaveBeenCalled();
  });

  it('deve impedir recálculo com parcelas pagas', async () => {
    // Arrange
    const acordoId = 1;

    const acordo = criarAcordoMock({
      id: acordoId,
      valorTotal: 10000,
      numeroParcelas: 2,
      percentualEscritorio: 30,
    });

    const parcelas = [
      criarParcelaRecebidaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        status: 'recebido',
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        status: 'pendente',
      }),
    ];

    (repository.obterAcordoPorId as jest.Mock).mockResolvedValue(acordo);
    (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(parcelas);

    // Act & Assert
    await expect(service.recalcularDistribuicao(acordoId)).rejects.toThrow(
      'Não é possível recalcular distribuição com parcelas já pagas'
    );

    expect(repository.atualizarParcelas).not.toHaveBeenCalled();
  });

  it('deve cancelar parcela', async () => {
    // Arrange
    const parcelaId = 1;
    const motivo = 'Acordo cancelado por descumprimento';

    const parcelaOriginal = criarParcelaMock({
      id: parcelaId,
      status: 'pendente',
    });

    const parcelaCancelada = criarParcelaMock({
      id: parcelaId,
      status: 'cancelado',
      observacoes: motivo,
    });

    (repository.obterParcelaPorId as jest.Mock).mockResolvedValue(
      parcelaOriginal
    );
    (repository.cancelarParcela as jest.Mock).mockResolvedValue(
      parcelaCancelada
    );

    // Act
    const result = await service.cancelarParcela(parcelaId, motivo);

    // Assert
    expect(result.status).toBe('cancelado');
    expect(result.observacoes).toBe(motivo);
    expect(repository.cancelarParcela).toHaveBeenCalledWith(parcelaId, motivo);
  });

  it('deve listar parcelas vencidas', async () => {
    // Arrange
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const parcelasVencidas = [
      criarParcelaMock({
        id: 1,
        status: 'atrasado',
        dataVencimento: ontem,
      }),
    ];

    (repository.listarParcelasVencidas as jest.Mock).mockResolvedValue(
      parcelasVencidas
    );

    // Act
    const result = await service.listarParcelasVencidas();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('atrasado');
    expect(result[0].dataVencimento.getTime()).toBeLessThan(hoje.getTime());
  });

  it('deve marcar parcelas vencidas como atrasadas', async () => {
    // Arrange
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const parcelasPendentes = [
      criarParcelaMock({
        id: 1,
        status: 'pendente',
        dataVencimento: ontem,
      }),
    ];

    const parcelasAtualizadas = [
      criarParcelaMock({
        id: 1,
        status: 'atrasado',
        dataVencimento: ontem,
      }),
    ];

    (repository.listarParcelasPendentesVencidas as jest.Mock).mockResolvedValue(
      parcelasPendentes
    );
    (repository.marcarParcelasComoAtrasadas as jest.Mock).mockResolvedValue(
      parcelasAtualizadas
    );

    // Act
    const result = await service.atualizarStatusParcelasVencidas();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('atrasado');
    expect(repository.marcarParcelasComoAtrasadas).toHaveBeenCalledWith([1]);
  });
});
