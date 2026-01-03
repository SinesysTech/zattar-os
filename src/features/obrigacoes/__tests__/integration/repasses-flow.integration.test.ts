// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  criarRepasseMock,
  criarRepassePendenteMock,
  criarRepasseEfetivadoMock,
} from '../fixtures';

jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client');

describe('Repasses Flow Integration', () => {
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

  it('deve listar repasses pendentes', async () => {
    // Arrange
    const repassesPendentes = [
      criarRepassePendenteMock({
        id: 1,
        processoId: 100,
        clienteId: 50,
        valorRepasse: 3500,
        statusRepasse: 'pendente',
      }),
      criarRepassePendenteMock({
        id: 2,
        processoId: 101,
        clienteId: 51,
        valorRepasse: 7000,
        statusRepasse: 'pendente',
      }),
    ];

    (repository.listarRepassesPendentes as jest.Mock).mockResolvedValue(
      repassesPendentes
    );

    // Act
    const result = await service.listarRepassesPendentes();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].statusRepasse).toBe('pendente');
    expect(result[1].statusRepasse).toBe('pendente');
    expect(repository.listarRepassesPendentes).toHaveBeenCalled();
  });

  it('deve anexar declaração de prestação de contas', async () => {
    // Arrange
    const repasseId = 1;
    const declaracaoUrl = 'https://storage.example.com/declaracao.pdf';

    const repasseOriginal = criarRepassePendenteMock({
      id: repasseId,
      declaracaoPrestacaoContasUrl: null,
    });

    const repasseComDeclaracao = criarRepassePendenteMock({
      id: repasseId,
      declaracaoPrestacaoContasUrl: declaracaoUrl,
    });

    (repository.obterRepassePorId as jest.Mock).mockResolvedValue(
      repasseOriginal
    );
    (repository.anexarDeclaracaoPrestacaoContas as jest.Mock).mockResolvedValue(
      repasseComDeclaracao
    );

    // Act
    const result = await service.anexarDeclaracaoPrestacaoContas(
      repasseId,
      declaracaoUrl
    );

    // Assert
    expect(result.declaracaoPrestacaoContasUrl).toBe(declaracaoUrl);
    expect(repository.anexarDeclaracaoPrestacaoContas).toHaveBeenCalledWith(
      repasseId,
      declaracaoUrl
    );
  });

  it('deve registrar repasse com comprovante', async () => {
    // Arrange
    const repasseId = 1;
    const dadosRepasse = {
      dataRepasseEfetivado: new Date('2024-01-22'),
      comprovanteRepasseUrl: 'https://storage.example.com/comprovante-repasse.pdf',
      observacoes: 'Repasse efetuado via PIX',
    };

    const repassePendente = criarRepassePendenteMock({
      id: repasseId,
      declaracaoPrestacaoContasUrl: 'https://storage.example.com/declaracao.pdf',
    });

    const repasseEfetivado = criarRepasseEfetivadoMock({
      id: repasseId,
      dataRepasseEfetivado: new Date('2024-01-22'),
      comprovanteRepasseUrl:
        'https://storage.example.com/comprovante-repasse.pdf',
      observacoes: 'Repasse efetuado via PIX',
      statusRepasse: 'efetivado',
    });

    (repository.obterRepassePorId as jest.Mock).mockResolvedValue(
      repassePendente
    );
    (repository.registrarRepasse as jest.Mock).mockResolvedValue(
      repasseEfetivado
    );

    // Act
    const result = await service.registrarRepasse(repasseId, dadosRepasse);

    // Assert
    expect(result.statusRepasse).toBe('efetivado');
    expect(result.dataRepasseEfetivado).toEqual(new Date('2024-01-22'));
    expect(result.comprovanteRepasseUrl).toBe(
      'https://storage.example.com/comprovante-repasse.pdf'
    );
    expect(repository.registrarRepasse).toHaveBeenCalledWith(
      repasseId,
      dadosRepasse
    );
  });

  it('deve validar declaração anexada antes de repasse', async () => {
    // Arrange
    const repasseId = 1;

    const repasseSemDeclaracao = criarRepassePendenteMock({
      id: repasseId,
      declaracaoPrestacaoContasUrl: null,
    });

    (repository.obterRepassePorId as jest.Mock).mockResolvedValue(
      repasseSemDeclaracao
    );

    // Act & Assert
    await expect(
      service.registrarRepasse(repasseId, {
        dataRepasseEfetivado: new Date('2024-01-22'),
        comprovanteRepasseUrl:
          'https://storage.example.com/comprovante-repasse.pdf',
      })
    ).rejects.toThrow(
      'Declaração de prestação de contas deve ser anexada antes de registrar o repasse'
    );

    expect(repository.registrarRepasse).not.toHaveBeenCalled();
  });

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

    (repository.listarRepassesPorCliente as jest.Mock).mockResolvedValue(
      repassesCliente
    );

    // Act
    const result = await service.listarRepassesPorCliente(clienteId);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].clienteId).toBe(clienteId);
    expect(result[1].clienteId).toBe(clienteId);
    expect(repository.listarRepassesPorCliente).toHaveBeenCalledWith(clienteId);
  });

  it('deve listar repasses por processo', async () => {
    // Arrange
    const processoId = 100;

    const repassesProcesso = [
      criarRepasseEfetivadoMock({
        id: 1,
        processoId,
        valorRepasse: 5000,
      }),
    ];

    (repository.listarRepassesPorProcesso as jest.Mock).mockResolvedValue(
      repassesProcesso
    );

    // Act
    const result = await service.listarRepassesPorProcesso(processoId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].processoId).toBe(processoId);
    expect(repository.listarRepassesPorProcesso).toHaveBeenCalledWith(processoId);
  });

  it('deve calcular total de repasses por período', async () => {
    // Arrange
    const dataInicio = new Date('2024-01-01');
    const dataFim = new Date('2024-01-31');

    const repassesPeriodo = [
      criarRepasseEfetivadoMock({
        id: 1,
        valorRepasse: 3500,
        dataRepasseEfetivado: new Date('2024-01-15'),
      }),
      criarRepasseEfetivadoMock({
        id: 2,
        valorRepasse: 7000,
        dataRepasseEfetivado: new Date('2024-01-20'),
      }),
      criarRepasseEfetivadoMock({
        id: 3,
        valorRepasse: 4500,
        dataRepasseEfetivado: new Date('2024-01-25'),
      }),
    ];

    (repository.listarRepassesPorPeriodo as jest.Mock).mockResolvedValue(
      repassesPeriodo
    );

    // Act
    const result = await service.calcularTotalRepassesPeriodo(
      dataInicio,
      dataFim
    );

    // Assert
    expect(result.total).toBe(15000); // 3500 + 7000 + 4500
    expect(result.quantidade).toBe(3);
    expect(result.repasses).toEqual(repassesPeriodo);
    expect(repository.listarRepassesPorPeriodo).toHaveBeenCalledWith(
      dataInicio,
      dataFim
    );
  });

  it('deve cancelar repasse pendente', async () => {
    // Arrange
    const repasseId = 1;
    const motivo = 'Acordo cancelado';

    const repassePendente = criarRepassePendenteMock({
      id: repasseId,
    });

    const repasseCancelado = criarRepasseMock({
      id: repasseId,
      statusRepasse: 'cancelado',
      observacoes: motivo,
    });

    (repository.obterRepassePorId as jest.Mock).mockResolvedValue(
      repassePendente
    );
    (repository.cancelarRepasse as jest.Mock).mockResolvedValue(
      repasseCancelado
    );

    // Act
    const result = await service.cancelarRepasse(repasseId, motivo);

    // Assert
    expect(result.statusRepasse).toBe('cancelado');
    expect(result.observacoes).toBe(motivo);
    expect(repository.cancelarRepasse).toHaveBeenCalledWith(repasseId, motivo);
  });

  it('deve impedir cancelamento de repasse já efetivado', async () => {
    // Arrange
    const repasseId = 1;

    const repasseEfetivado = criarRepasseEfetivadoMock({
      id: repasseId,
    });

    (repository.obterRepassePorId as jest.Mock).mockResolvedValue(
      repasseEfetivado
    );

    // Act & Assert
    await expect(
      service.cancelarRepasse(repasseId, 'Motivo')
    ).rejects.toThrow('Não é possível cancelar repasse já efetivado');

    expect(repository.cancelarRepasse).not.toHaveBeenCalled();
  });

  it('deve gerar relatório de repasses pendentes', async () => {
    // Arrange
    const repassesPendentes = [
      criarRepassePendenteMock({
        id: 1,
        processoId: 100,
        clienteId: 50,
        valorRepasse: 3500,
        dataRepassePrevista: new Date('2024-01-20'),
      }),
      criarRepassePendenteMock({
        id: 2,
        processoId: 101,
        clienteId: 51,
        valorRepasse: 7000,
        dataRepassePrevista: new Date('2024-01-25'),
      }),
    ];

    (repository.listarRepassesPendentes as jest.Mock).mockResolvedValue(
      repassesPendentes
    );

    // Act
    const result = await service.gerarRelatorioRepassesPendentes();

    // Assert
    expect(result.totalPendente).toBe(10500); // 3500 + 7000
    expect(result.quantidadePendente).toBe(2);
    expect(result.repasses).toEqual(repassesPendentes);
  });
});
