import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import { criarAcordoMock, criarParcelaMock } from '../fixtures';

jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client');

describe('Acordos Flow Integration', () => {
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

  it('deve criar acordo e gerar parcelas automaticamente', async () => {
    // Arrange
    const dadosAcordo = {
      processoId: 100,
      tipo: 'acordo' as const,
      direcao: 'recebimento' as const,
      valorTotal: 10000,
      numeroParcelas: 2,
      dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
      percentualEscritorio: 30,
      intervaloVencimentoDias: 30,
    };

    const acordo = criarAcordoMock(dadosAcordo);
    const parcelas = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordo.id,
        numeroParcela: 1,
        valorBrutoCreditoPrincipal: 5000,
        valorLiquidoRepasse: 3500,
        valorLiquidoEscritorio: 1500,
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordo.id,
        numeroParcela: 2,
        valorBrutoCreditoPrincipal: 5000,
        valorLiquidoRepasse: 3500,
        valorLiquidoEscritorio: 1500,
      }),
    ];

    (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
    (repository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);

    // Act
    const result = await service.criarAcordoComParcelas(dadosAcordo);

    // Assert
    expect(result.acordo).toEqual(acordo);
    expect(result.parcelas).toHaveLength(2);
    expect(result.parcelas[0].numeroParcela).toBe(1);
    expect(result.parcelas[1].numeroParcela).toBe(2);
    expect(repository.criarAcordo).toHaveBeenCalledTimes(1);
    expect(repository.criarParcelas).toHaveBeenCalledTimes(1);
  });

  it('deve calcular valores de parcelas corretamente', async () => {
    // Arrange
    const dadosAcordo = {
      processoId: 100,
      tipo: 'acordo' as const,
      direcao: 'recebimento' as const,
      valorTotal: 15000,
      numeroParcelas: 3,
      dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
      percentualEscritorio: 40, // 40% escritório, 60% cliente
      intervaloVencimentoDias: 30,
    };

    const acordo = criarAcordoMock(dadosAcordo);

    // Valor por parcela: 15000 / 3 = 5000
    // Escritório: 5000 * 0.4 = 2000
    // Cliente: 5000 * 0.6 = 3000

    const parcelas = Array.from({ length: 3 }, (_, i) =>
      criarParcelaMock({
        id: i + 1,
        acordoCondenacaoId: acordo.id,
        numeroParcela: i + 1,
        valorBrutoCreditoPrincipal: 5000,
        valorLiquidoRepasse: 3000,
        valorLiquidoEscritorio: 2000,
      })
    );

    (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
    (repository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);

    // Act
    const result = await service.criarAcordoComParcelas(dadosAcordo);

    // Assert
    expect(result.parcelas).toHaveLength(3);

    result.parcelas.forEach((parcela) => {
      expect(parcela.valorBrutoCreditoPrincipal).toBe(5000);
      expect(parcela.valorLiquidoEscritorio).toBe(2000);
      expect(parcela.valorLiquidoRepasse).toBe(3000);
      expect(parcela.valorLiquidoEscritorio + parcela.valorLiquidoRepasse).toBe(
        5000
      );
    });
  });

  it('deve aplicar split de pagamento (escritório/cliente)', async () => {
    // Arrange
    const dadosAcordo = {
      processoId: 100,
      tipo: 'acordo' as const,
      direcao: 'recebimento' as const,
      valorTotal: 20000,
      numeroParcelas: 4,
      dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
      percentualEscritorio: 25, // 25% escritório, 75% cliente
      intervaloVencimentoDias: 15,
    };

    const acordo = criarAcordoMock(dadosAcordo);

    // Valor por parcela: 20000 / 4 = 5000
    // Escritório: 5000 * 0.25 = 1250
    // Cliente: 5000 * 0.75 = 3750

    const parcelas = Array.from({ length: 4 }, (_, i) =>
      criarParcelaMock({
        id: i + 1,
        acordoCondenacaoId: acordo.id,
        numeroParcela: i + 1,
        valorBrutoCreditoPrincipal: 5000,
        valorLiquidoRepasse: 3750,
        valorLiquidoEscritorio: 1250,
      })
    );

    (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
    (repository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);

    // Act
    const result = await service.criarAcordoComParcelas(dadosAcordo);

    // Assert
    const totalEscritorio = result.parcelas.reduce(
      (sum, p) => sum + p.valorLiquidoEscritorio,
      0
    );
    const totalCliente = result.parcelas.reduce(
      (sum, p) => sum + p.valorLiquidoRepasse,
      0
    );

    expect(totalEscritorio).toBe(5000); // 25% de 20000
    expect(totalCliente).toBe(15000); // 75% de 20000
    expect(totalEscritorio + totalCliente).toBe(20000);
  });

  it('deve atualizar acordo e recalcular parcelas', async () => {
    // Arrange
    const acordoId = 1;

    const acordoOriginal = criarAcordoMock({
      id: acordoId,
      valorTotal: 10000,
      numeroParcelas: 2,
      percentualEscritorio: 30,
    });

    const acordoAtualizado = criarAcordoMock({
      id: acordoId,
      valorTotal: 12000,
      numeroParcelas: 2,
      percentualEscritorio: 35,
    });

    const parcelasOriginais = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        status: 'pendente',
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        status: 'pendente',
      }),
    ];

    const parcelasRecalculadas = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        valorBrutoCreditoPrincipal: 6000,
        valorLiquidoEscritorio: 2100,
        valorLiquidoRepasse: 3900,
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        valorBrutoCreditoPrincipal: 6000,
        valorLiquidoEscritorio: 2100,
        valorLiquidoRepasse: 3900,
      }),
    ];

    (repository.obterAcordoPorId as jest.Mock).mockResolvedValue(acordoOriginal);
    (repository.atualizarAcordo as jest.Mock).mockResolvedValue(acordoAtualizado);
    (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
      parcelasOriginais
    );
    (repository.atualizarParcelas as jest.Mock).mockResolvedValue(
      parcelasRecalculadas
    );

    // Act
    const result = await service.atualizarAcordoERecalcular(acordoId, {
      valorTotal: 12000,
      percentualEscritorio: 35,
    });

    // Assert
    expect(result.acordo.valorTotal).toBe(12000);
    expect(result.acordo.percentualEscritorio).toBe(35);
    expect(result.parcelas[0].valorBrutoCreditoPrincipal).toBe(6000);
    expect(result.parcelas[0].valorLiquidoEscritorio).toBe(2100);
  });

  it('deve deletar acordo sem parcelas pagas', async () => {
    // Arrange
    const acordoId = 1;

    const parcelas = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        status: 'pendente',
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        status: 'pendente',
      }),
    ];

    (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(parcelas);
    (repository.deletarAcordo as jest.Mock).mockResolvedValue({ success: true });

    // Act
    await service.deletarAcordo(acordoId);

    // Assert
    expect(repository.listarParcelasPorAcordo).toHaveBeenCalledWith(acordoId);
    expect(repository.deletarAcordo).toHaveBeenCalledWith(acordoId);
  });

  it('deve impedir deleção de acordo com parcelas pagas', async () => {
    // Arrange
    const acordoId = 1;

    const parcelas = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        status: 'recebido',
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        status: 'pendente',
      }),
    ];

    (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(parcelas);

    // Act & Assert
    await expect(service.deletarAcordo(acordoId)).rejects.toThrow(
      'Não é possível deletar acordo com parcelas já pagas'
    );

    expect(repository.deletarAcordo).not.toHaveBeenCalled();
  });
});
