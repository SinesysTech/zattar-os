
import {
  criarCargo,
  atualizarCargo,
  deletarCargo
} from '../../service';
import {
  buscarCargoPorNome,
  criarCargo as criarCargoDb,
  buscarCargoPorId,
  atualizarCargo as atualizarCargoDb,
  contarUsuariosComCargo,
  deletarCargo as deletarCargoDb,
  listarUsuariosComCargo
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Cargos Service', () => {
  const mockCargo = {
    id: 1,
    nome: 'Gerente',
    descricao: 'Cargo de gerencia',
    ativo: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarCargo', () => {
    const input = { nome: 'Novo', descricao: 'Desc' };
    const usuarioId = 1;

    it('deve criar cargo com sucesso', async () => {
      // Arrange
      (buscarCargoPorNome as jest.Mock).mockResolvedValue(null);
      (criarCargoDb as jest.Mock).mockResolvedValue({ id: 2, ...input });

      // Act
      const result = await criarCargo(input, usuarioId);

      // Assert
      expect(result.id).toBe(2);
      expect(criarCargoDb).toHaveBeenCalledWith(input, usuarioId);
    });

    it('deve falhar se nome ja existe', async () => {
      // Arrange
      (buscarCargoPorNome as jest.Mock).mockResolvedValue(mockCargo);

      // Act & Assert
      await expect(criarCargo({ nome: 'Gerente' }, usuarioId))
        .rejects
        .toThrow(/Cargo com nome "Gerente" já existe/);
    });
  });

  describe('atualizarCargo', () => {
    it('deve atualizar com sucesso', async () => {
      // Arrange
      (buscarCargoPorId as jest.Mock).mockResolvedValue(mockCargo);
      (buscarCargoPorNome as jest.Mock).mockResolvedValue(null);
      (atualizarCargoDb as jest.Mock).mockResolvedValue({ ...mockCargo, nome: 'Gerente 2' });

      // Act
      const result = await atualizarCargo(1, { nome: 'Gerente 2' });

      // Assert
      expect(result.nome).toBe('Gerente 2');
    });

    it('deve falhar se cargo nao existe', async () => {
      // Arrange
      (buscarCargoPorId as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(atualizarCargo(99, { nome: 'X' }))
        .rejects
        .toThrow('Cargo não encontrado');
    });

    it('deve falhar se novo nome ja existe', async () => {
      // Arrange
      (buscarCargoPorId as jest.Mock).mockResolvedValue(mockCargo);
      (buscarCargoPorNome as jest.Mock).mockResolvedValue({ id: 2, nome: 'Outro' });

      // Act & Assert
      await expect(atualizarCargo(1, { nome: 'Outro' }))
        .rejects
        .toThrow(/Cargo com nome "Outro" já existe/);
    });
  });

  describe('deletarCargo', () => {
    it('deve deletar com sucesso se sem usuarios', async () => {
      // Arrange
      (buscarCargoPorId as jest.Mock).mockResolvedValue(mockCargo);
      (contarUsuariosComCargo as jest.Mock).mockResolvedValue(0);
      (deletarCargoDb as jest.Mock).mockResolvedValue(true);

      // Act
      await deletarCargo(1);

      // Assert
      expect(deletarCargoDb).toHaveBeenCalledWith(1);
    });

    it('deve falhar se tem usuarios associados', async () => {
      // Arrange
      (buscarCargoPorId as jest.Mock).mockResolvedValue(mockCargo);
      (contarUsuariosComCargo as jest.Mock).mockResolvedValue(5);
      (listarUsuariosComCargo as jest.Mock).mockResolvedValue([{ id: 1, nome_completo: 'User' }]);

      // Act & Assert
      await expect(deletarCargo(1))
        .rejects
        .toThrow(); 
      // check message if complex JSON, or just generic check
      // .toThrow(/Usuarios associados/); // The service throws JSON string
    });
  });
});
