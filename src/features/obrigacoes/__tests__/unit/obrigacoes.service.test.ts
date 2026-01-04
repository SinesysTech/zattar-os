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

      (repository.ObrigacoesRepository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);
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
        dataVencimentoPrimeiraParcela: '2024-01-15',
        percentualEscritorio: 30,
        formaPagamentoPadrao: 'transferencia_direta',
        intervaloEntreParcelas: 30,
        formaDistribuicao: 'igual',
        honorariosSucumbenciaisTotal: 0,
      });

      // Assert
      expect(result.id).toBe(acordo.id);
      expect(result.acordo).toEqual(acordo);
      expect(result.parcelas).toEqual(parcelas);
      expect(repository.ObrigacoesRepository.criarAcordo).toHaveBeenCalledTimes(1);
      expect(repository.ObrigacoesRepository.criarParcelas).toHaveBeenCalledTimes(1);
    });

    it('deve calcular parcelas corretamente', async () => {
      // Arrange
      const acordo = criarAcordoMock({
        valorTotal: 9000,
        numeroParcelas: 3,
      });

      (repository.ObrigacoesRepository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.criarParcelas as jest.Mock).mockResolvedValue([]);
      (utils.calcularDataVencimento as jest.Mock).mockImplementation(
        (data) => new Date(data)
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
      expect(repository.ObrigacoesRepository.criarParcelas).toHaveBeenCalledWith(
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

      (repository.ObrigacoesRepository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.criarParcelas as jest.Mock).mockResolvedValue([]);
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
      expect(repository.ObrigacoesRepository.criarParcelas).toHaveBeenCalledWith(
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

      (repository.ObrigacoesRepository.criarAcordo as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.criarParcelas as jest.Mock).mockResolvedValue([]);
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
      expect(repository.ObrigacoesRepository.criarParcelas).toHaveBeenCalledWith(
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
      const mockResponse = {
        acordos: [
          criarAcordoMock({ id: 1 }),
          criarAcordoMock({ id: 2 }),
        ],
        total: 2,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };

      (repository.ObrigacoesRepository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await service.listarAcordos({
        pagina: 1,
        limite: 10,
      });

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.acordos).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(repository.ObrigacoesRepository.listarAcordos).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
      });
    });

    it('deve filtrar por processo', async () => {
      // Arrange
      const mockResponse = {
        acordos: [criarAcordoMock({ processoId: 100 })],
        total: 1,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };

      (repository.ObrigacoesRepository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await service.listarAcordos({
        processoId: 100,
        pagina: 1,
        limite: 10,
      });

      // Assert
      expect(repository.ObrigacoesRepository.listarAcordos).toHaveBeenCalledWith({
        processoId: 100,
        pagina: 1,
        limite: 10,
      });
    });

    it('deve filtrar por tipo e status', async () => {
      // Arrange
      const mockResponse = {
        acordos: [criarAcordoMock({ tipo: 'acordo' })],
        total: 1,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };

      (repository.ObrigacoesRepository.listarAcordos as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await service.listarAcordos({
        tipo: 'acordo',
        status: 'pago_parcial',
        pagina: 1,
        limite: 10,
      });

      // Assert
      expect(repository.ObrigacoesRepository.listarAcordos).toHaveBeenCalledWith({
        tipo: 'acordo',
        status: 'pago_parcial',
        pagina: 1,
        limite: 10,
      });
    });
  });

  describe('marcarParcelaRecebida', () => {
    it('deve marcar parcela como recebida', async () => {
      // Arrange
      const parcelaId = 1;
      const parcelaRecebida = criarParcelaMock({
        id: parcelaId,
        status: 'recebida',
      });

      (repository.buscarParcelaPorId as jest.Mock).mockResolvedValue(
        criarParcelaMock({ id: parcelaId })
      );
      (repository.ObrigacoesRepository.buscarParcelaPorId as jest.Mock).mockResolvedValue(
        criarParcelaMock({ id: 1 })
      );
      (repository.ObrigacoesRepository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      const result = await service.marcarParcelaRecebida(parcelaId, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 5000,
      });

      // Assert
      expect(result.status).toBe('recebida');
      expect(repository.marcarParcelaComoRecebida).toHaveBeenCalledWith(parcelaId, {
        dataEfetivacao: '2024-01-16',
        valor: 5000,
      });
    });

    it('deve atualizar data de efetivação', async () => {
      // Arrange
      const parcelaId = 1;
      const parcelaRecebida = criarParcelaMock({
        id: parcelaId,
        status: 'recebida',
        dataEfetivacao: new Date('2024-01-20'),
      });

      (repository.buscarParcelaPorId as jest.Mock).mockResolvedValue(
        criarParcelaMock({ id: parcelaId })
      );
      (repository.ObrigacoesRepository.buscarParcelaPorId as jest.Mock).mockResolvedValue(
        criarParcelaMock({ id: 1 })
      );
      (repository.ObrigacoesRepository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      const result = await service.marcarParcelaRecebida(parcelaId, {
        dataRecebimento: '2024-01-20',
      });

      // Assert
      expect(result.dataEfetivacao).toEqual(new Date('2024-01-20'));
      expect(repository.marcarParcelaComoRecebida).toHaveBeenCalledWith(parcelaId, {
        dataEfetivacao: '2024-01-20',
        valor: undefined,
      });
    });

    it('deve lançar erro se parcela não existe', async () => {
      // Arrange
      (repository.ObrigacoesRepository.buscarParcelaPorId as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.marcarParcelaRecebida(999, {
          dataRecebimento: '2024-01-16',
        })
      ).rejects.toThrow('Parcela não encontrada');
    });
  });

  describe('recalcularDistribuicao', () => {
    it('deve recalcular parcelas não pagas', async () => {
      // Arrange
      const acordoId = 1;

      const { acordo, parcelas } = criarAcordoComParcelasMock(3);

      (repository.ObrigacoesRepository.buscarAcordoPorId as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.buscarParcelasPorAcordo as jest.Mock).mockResolvedValue(
        parcelas
      );
      (repository.ObrigacoesRepository.deletarParcelasDoAcordo as jest.Mock).mockResolvedValue(undefined);
      (repository.ObrigacoesRepository.criarParcelas as jest.Mock).mockResolvedValue(parcelas);

      // Act
      const result = await service.recalcularDistribuicao(acordoId);

      // Assert
      expect(result).toHaveLength(3);
      expect(repository.ObrigacoesRepository.buscarAcordoPorId).toHaveBeenCalledWith(acordoId);
      expect(repository.ObrigacoesRepository.criarParcelas).toHaveBeenCalled();
    });

    it('deve lançar erro se há parcelas pagas', async () => {
      // Arrange
      const acordoId = 1;
      const { acordo, parcelas } = criarAcordoComParcelasMock(2);

      parcelas[0].status = 'recebido';

      (repository.ObrigacoesRepository.buscarAcordoPorId as jest.Mock).mockResolvedValue(acordo);
      (repository.ObrigacoesRepository.buscarParcelasPorAcordo as jest.Mock).mockResolvedValue(
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

      jest.spyOn(await import('@/features/partes/repositories'), 'findClienteByCPF').mockResolvedValue({
        success: true,
        data: mockCliente,
      });
      jest.spyOn(await import('@/features/processos/service'), 'buscarProcessosPorClienteCPF').mockResolvedValue({
        success: true,
        data: mockProcessos,
      });
      (repository.ObrigacoesRepository.listarAcordos as jest.Mock).mockResolvedValue({
        acordos: mockAcordos,
        total: mockAcordos.length,
        pagina: 1,
        limite: 200,
        totalPaginas: 1,
      });

      // Act
      const result = await service.buscarAcordosPorClienteCPF(cpf);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAcordos);
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
