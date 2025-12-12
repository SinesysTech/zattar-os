
import {
  criar,
  atualizar,
  deletar,
  listar
} from '../../service';
import {
  findByNome,
  create,
  findById,
  update,
  isInUse,
  deleteById,
  findAll
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Tipos Expedientes Service', () => {
  const mockTipo = {
    id: 1,
    tipoExpediente: 'Despacho',
    ativo: true,
    created_at: '',
    updated_at: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criar', () => {
    const input = { tipoExpediente: 'Sentença' };
    const userId = 1;

    it('deve criar com sucesso', async () => {
      // Arrange
      (findByNome as jest.Mock).mockResolvedValue(null);
      (create as jest.Mock).mockResolvedValue({ id: 2, ...input });

      // Act
      const result = await criar(input, userId);

      // Assert
      expect(result.id).toBe(2);
      expect(create).toHaveBeenCalledWith(input, userId);
    });

    it('deve falhar se nome ja existe', async () => {
      // Arrange
      (findByNome as jest.Mock).mockResolvedValue(mockTipo);

      // Act & Assert
      await expect(criar({ tipoExpediente: 'Despacho' }, userId))
        .rejects
        .toThrow('Tipo de expediente já cadastrado');
    });
  });

  describe('atualizar', () => {
    it('deve atualizar com sucesso', async () => {
      // Arrange
      (findById as jest.Mock).mockResolvedValue(mockTipo);
      (findByNome as jest.Mock).mockResolvedValue(null);
      (update as jest.Mock).mockResolvedValue({ ...mockTipo, tipoExpediente: 'Novo' });

      // Act
      const result = await atualizar(1, { tipoExpediente: 'Novo' });

      // Assert
      expect(result.tipoExpediente).toBe('Novo');
    });
  });

  describe('deletar', () => {
    it('deve deletar se nao estiver em uso', async () => {
      // Arrange
      (findById as jest.Mock).mockResolvedValue(mockTipo);
      (isInUse as jest.Mock).mockResolvedValue(false);
      (deleteById as jest.Mock).mockResolvedValue(undefined);

      // Act
      await deletar(1);

      // Assert
      expect(deleteById).toHaveBeenCalledWith(1);
    });

    it('deve falhar se em uso', async () => {
      // Arrange
      (findById as jest.Mock).mockResolvedValue(mockTipo);
      (isInUse as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(deletar(1))
        .rejects
        .toThrow(/Tipo de expediente está em uso/);
    });
  });
});
