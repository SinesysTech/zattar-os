import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import * as utils from '../../utils';
import * as partesRepository from '@/features/partes/repositories';
import * as processosService from '@/features/processos/service';
import {
  criarAcordoMock,
  criarParcelaMock,
  criarAcordoComParcelasMock,
} from '../fixtures';

jest.mock('../../repository');
jest.mock('../../utils');
jest.mock('@/features/partes/repositories');
jest.mock('@/features/processos/service');

describe('Obrigações Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarAcordoComParcelas', () => {
    it('deve criar acordo e parcelas com sucesso', async () => {
      // Arrange
      const acordo = criarAcordoMock();
      const parcelas = [
        criarParcelaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2 }),
      ];

      (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);
      (utils.calcularDataVencimento as jest.Mock).mockImplementation(
        (data, numero, intervalo) => {
          const resultado = new Date(data);
          resultado.setDate(resultado.getDate() + (numero - 1) * intervalo);
          return resultado;
        }
      );

      // Act
      const result = await service.criarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      });

      // Assert
      expect(result.acordo).toEqual(acordo);
      expect(result.parcelas).toEqual(parcelas);
      expect(repository.criarAcordo).toHaveBeenCalledTimes(1);
      expect(repository.criarParcelas).toHaveBeenCalledTimes(1);
    });

    it('deve calcular parcelas corretamente', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        valorTotal: 9000,
        numeroParcelas: 3,
      });

      (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.criarParcelas as jest.Mock).mockResolvedValue([]);
      (utils.calcularDataVencimento as jest.Mock).mockImplementation(
        (data, numero, intervalo) => new Date(data)
      );
      (utils.calcularValorParcela as jest.Mock).mockReturnValue(3000);

      // Act
      await service.criarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 9000,
        numeroParcelas: 3,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
      });

      // Assert
      expect(utils.calcularValorParcela).toHaveBeenCalledWith(9000, 3);
      expect(repository.criarParcelas).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            numeroParcela: 1,
            valorBrutoCreditoPrincipal: 3000,
          }),
          expect.objectContaining({
            numeroParcela: 2,
            valorBrutoCreditoPrincipal: 3000,
          }),
          expect.objectContaining({
            numeroParcela: 3,
            valorBrutoCreditoPrincipal: 3000,
          }),
        ])
      );
    });

    it('deve aplicar percentual de escritório', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        percentualEscritorio: 40,
      });

      (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.criarParcelas as jest.Mock).mockResolvedValue([]);
      (utils.calcularDataVencimento as jest.Mock).mockImplementation(
        (data) => new Date(data)
      );
      (utils.calcularValorParcela as jest.Mock).mockReturnValue(5000);

      // Act
      await service.criarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 40,
      });

      // Assert
      expect(repository.criarParcelas).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            valorLiquidoEscritorio: 2000, // 40% de 5000
            valorLiquidoRepasse: 3000, // 60% de 5000
          }),
        ])
      );
    });

    it('deve distribuir honorários sucumbenciais', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        incluirHonorariosSucumbenciais: true,
        valorHonorariosSucumbenciais: 2000,
        numeroParcelas: 2,
      });

      (repository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.criarParcelas as jest.Mock).mockResolvedValue([]);
      (utils.calcularDataVencimento as jest.Mock).mockImplementation(
        (data) => new Date(data)
      );
      (utils.calcularValorParcela as jest.Mock).mockReturnValue(5000);

      // Act
      await service.criarAcordoComParcelas({
        processoId: 100,
        tipo: 'acordo',
        direcao: 'recebimento',
        valorTotal: 10000,
        numeroParcelas: 2,
        dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
        percentualEscritorio: 30,
        incluirHonorariosSucumbenciais: true,
        valorHonorariosSucumbenciais: 2000,
      });

      // Assert
      expect(repository.criarParcelas).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            valorHonorariosSucumbenciaisEscritorio: 1000, // 2000 / 2 parcelas
          }),
        ])
      );
    });
  });

  describe('listarAcordos', () => {
    it('deve listar acordos com paginação', async () => {
      // Arrange
      const mockAcordos = [
        criarAcordoMock({ id: 1 }),
        criarAcordoMock({ id: 2 }),
      ];

      const mockResponse = {
        data: mockAcordos,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      };

      (repository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await service.listarAcordos({
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result).toEqual(mockResponse);
      expect(repository.listarAcordos).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
    });

    it('deve filtrar por processo', async () => {
      // Arrange
      const mockResponse = {
        data: [criarAcordoMock({ processoId: 100 })],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (repository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await service.listarAcordos({
        processoId: 100,
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(repository.listarAcordos).toHaveBeenCalledWith({
        processoId: 100,
        page: 1,
        pageSize: 10,
      });
    });

    it('deve filtrar por tipo e status', async () => {
      // Arrange
      const mockResponse = {
        data: [criarAcordoMock({ tipo: 'acordo' })],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (repository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await service.listarAcordos({
        tipo: 'acordo',
        status: 'pago_parcial',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(repository.listarAcordos).toHaveBeenCalledWith({
        tipo: 'acordo',
        status: 'pago_parcial',
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('marcarParcelaRecebida', () => {
    it('deve marcar parcela como recebida', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaMock({
        id: 1,
        status: 'recebido',
        dataEfetivacao: new Date('2024-01-16'),
      });

      (repository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      const result = await service.marcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
      });

      // Assert
      expect(result.status).toBe('recebido');
      expect(repository.marcarParcelaComoRecebida).toHaveBeenCalledWith({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'pix',
      });
    });

    it('deve atualizar data de efetivação', async () => {
      // Arrange
      const dataEfetivacao = new Date('2024-01-20');
      const parcelaRecebida = criarParcelaMock({
        id: 1,
        status: 'recebido',
        dataEfetivacao,
      });

      (repository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      const result = await service.marcarParcelaRecebida({
        parcelaId: 1,
        valorEfetivado: 5000,
        formaPagamento: 'transferencia',
        dataEfetivacao,
      });

      // Assert
      expect(result.dataEfetivacao).toEqual(dataEfetivacao);
    });

    it('deve lançar erro se parcela não existe', async () => {
      // Arrange
      (repository.marcarParcelaComoRecebida as jest.Mock).mockRejectedValue(
        new Error('Parcela não encontrada')
      );

      // Act & Assert
      await expect(
        service.marcarParcelaRecebida({
          parcelaId: 999,
          valorEfetivado: 5000,
          formaPagamento: 'pix',
        })
      ).rejects.toThrow('Parcela não encontrada');
    });
  });

  describe('recalcularDistribuicao', () => {
    it('deve recalcular parcelas não pagas', async () => {
      // Arrange
      const acordoId = 1;

      const { acordo, parcelas } = criarAcordoComParcelasMock(3);

      (repository.obterAcordoPorId as jest.Mock).mockResolvedValue(acordo);
      (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
        parcelas
      );
      (repository.atualizarParcelas as jest.Mock).mockResolvedValue(parcelas);

      // Act
      const result = await service.recalcularDistribuicao(acordoId);

      // Assert
      expect(result).toHaveLength(3);
      expect(repository.obterAcordoPorId).toHaveBeenCalledWith(acordoId);
      expect(repository.atualizarParcelas).toHaveBeenCalled();
    });

    it('deve lançar erro se há parcelas pagas', async () => {
      // Arrange
      const acordoId = 1;
      const { acordo, parcelas } = criarAcordoComParcelasMock(2);

      parcelas[0].status = 'recebido';

      (repository.obterAcordoPorId as jest.Mock).mockResolvedValue(acordo);
      (repository.listarParcelasPorAcordo as jest.Mock).mockResolvedValue(
        parcelas
      );

      // Act & Assert
      await expect(service.recalcularDistribuicao(acordoId)).rejects.toThrow(
        'Não é possível recalcular distribuição com parcelas já pagas'
      );
    });
  });

  describe('buscarAcordosPorClienteCPF', () => {
    it('deve buscar acordos por CPF do cliente', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfNormalizado = '12345678900';

      const mockCliente = {
        id: 50,
        cpf: cpfNormalizado,
        nome: 'João Silva',
      };

      const mockProcessos = [
        { id: 100, numero_processo: '0001234-56.2023.5.02.0001' },
      ];

      const mockAcordos = [criarAcordoMock({ processoId: 100 })];

      (utils.normalizarCPF as jest.Mock).mockReturnValue(cpfNormalizado);
      (partesRepository.buscarClientePorCPF as jest.Mock).mockResolvedValue(
        mockCliente
      );
      (processosService.buscarProcessosPorCliente as jest.Mock).mockResolvedValue(
        mockProcessos
      );
      (repository.listarAcordosPorProcessos as jest.Mock).mockResolvedValue(
        mockAcordos
      );

      // Act
      const result = await service.buscarAcordosPorClienteCPF(cpf);

      // Assert
      expect(result).toEqual(mockAcordos);
      expect(utils.normalizarCPF).toHaveBeenCalledWith(cpf);
      expect(partesRepository.buscarClientePorCPF).toHaveBeenCalledWith(
        cpfNormalizado
      );
      expect(processosService.buscarProcessosPorCliente).toHaveBeenCalledWith(
        mockCliente.id
      );
      expect(repository.listarAcordosPorProcessos).toHaveBeenCalledWith([100]);
    });

    it('deve normalizar CPF antes de buscar', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfNormalizado = '12345678900';

      (utils.normalizarCPF as jest.Mock).mockReturnValue(cpfNormalizado);
      (partesRepository.buscarClientePorCPF as jest.Mock).mockResolvedValue(null);

      // Act
      await service.buscarAcordosPorClienteCPF(cpf);

      // Assert
      expect(utils.normalizarCPF).toHaveBeenCalledWith(cpf);
      expect(partesRepository.buscarClientePorCPF).toHaveBeenCalledWith(
        cpfNormalizado
      );
    });

    it('deve retornar erro se CPF inválido', async () => {
      // Arrange
      const cpf = 'invalido';

      (utils.normalizarCPF as jest.Mock).mockReturnValue('');

      // Act & Assert
      await expect(service.buscarAcordosPorClienteCPF(cpf)).rejects.toThrow(
        'CPF inválido'
      );
    });

    it('deve retornar array vazio se cliente não tem processos', async () => {
      // Arrange
      const cpf = '123.456.789-00';
      const cpfNormalizado = '12345678900';

      const mockCliente = {
        id: 50,
        cpf: cpfNormalizado,
        nome: 'João Silva',
      };

      (utils.normalizarCPF as jest.Mock).mockReturnValue(cpfNormalizado);
      (partesRepository.buscarClientePorCPF as jest.Mock).mockResolvedValue(
        mockCliente
      );
      (processosService.buscarProcessosPorCliente as jest.Mock).mockResolvedValue(
        []
      );

      // Act
      const result = await service.buscarAcordosPorClienteCPF(cpf);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
