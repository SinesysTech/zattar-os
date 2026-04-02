
import {
  LancamentosService
} from '../../services/lancamentos';
import { LancamentosRepository } from '../../repository/lancamentos';
import {
  validarCriacaoLancamento,
  validarEfetivacaoLancamento,
  validarCancelamentoLancamento,
  type Lancamento,
} from '../../domain/lancamentos';

// Mock dependencies
jest.mock('../../repository/lancamentos');
jest.mock('../../domain/lancamentos');

describe('Financeiro - LancamentosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criar', () => {
    const validData = {
      descricao: 'Teste',
      valor: 100,
      tipo: 'receita',
    };

    it('deve criar lançamento com sucesso', async () => {
      // Arrange
      (validarCriacaoLancamento as jest.Mock).mockReturnValue({ valido: true });
      (LancamentosRepository.criar as jest.Mock).mockResolvedValue({ id: 1, ...validData });

      // Act
      const result = await LancamentosService.criar(validData as Partial<Lancamento>);

      // Assert
      expect(result.id).toBe(1);
      expect(LancamentosRepository.criar).toHaveBeenCalled();
      expect(validarCriacaoLancamento).toHaveBeenCalledWith(validData);
    });

    it('deve lançar erro se validação falhar', async () => {
      // Arrange
      (validarCriacaoLancamento as jest.Mock).mockReturnValue({ valido: false, erros: ['Erro de validação'] });

      // Act & Assert
      await expect(LancamentosService.criar(validData as Partial<Lancamento>)).rejects.toThrow('Erro de validação');
      expect(LancamentosRepository.criar).not.toHaveBeenCalled();
    });
  });

  describe('efetivar', () => {
    const existingLancamento = { id: 1, status: 'pendente', valor: 100 };
    const efetivarInput = { dataEfetivacao: '2023-01-01' };

    it('deve efetivar lançamento com sucesso', async () => {
      // Arrange
      (LancamentosRepository.buscarPorId as jest.Mock).mockResolvedValue(existingLancamento);
      (validarEfetivacaoLancamento as jest.Mock).mockReturnValue({ valido: true });
      (LancamentosRepository.atualizar as jest.Mock).mockResolvedValue({ ...existingLancamento, status: 'confirmado' });

      // Act
      const result = await LancamentosService.efetivar(1, efetivarInput);

      // Assert
      expect(result.status).toBe('confirmado');
      expect(LancamentosRepository.atualizar).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'confirmado' }));
    });

    it('deve lançar erro se lançamento não existir', async () => {
      // Arrange
      (LancamentosRepository.buscarPorId as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(LancamentosService.efetivar(99, efetivarInput)).rejects.toThrow('Lançamento não encontrado');
    });

    it('deve lançar erro se validação falhar', async () => {
      // Arrange
      (LancamentosRepository.buscarPorId as jest.Mock).mockResolvedValue(existingLancamento);
      (validarEfetivacaoLancamento as jest.Mock).mockReturnValue({ valido: false, erros: ['Erro de regra'] });

      // Act & Assert
      await expect(LancamentosService.efetivar(1, efetivarInput)).rejects.toThrow('Erro de regra');
    });
  });

  describe('cancelar', () => {
    const existingLancamento = { id: 1, status: 'pendente' };

    it('deve cancelar lançamento com sucesso', async () => {
      // Arrange
      (LancamentosRepository.buscarPorId as jest.Mock).mockResolvedValue(existingLancamento);
      (validarCancelamentoLancamento as jest.Mock).mockReturnValue({ valido: true });
      (LancamentosRepository.atualizar as jest.Mock).mockResolvedValue({ ...existingLancamento, status: 'cancelado' });

      // Act
      await LancamentosService.cancelar(1);

      // Assert
      expect(LancamentosRepository.atualizar).toHaveBeenCalledWith(1, { status: 'cancelado' });
    });
  });
});
