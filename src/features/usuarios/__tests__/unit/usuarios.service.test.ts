
import { service } from '../../service';
import { usuarioRepository } from '../../repository';

// Mock repository
jest.mock('../../repository', () => ({
  usuarioRepository: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findByEmail: jest.fn(),
    getCargoById: jest.fn(),
  },
}));

describe('Usuarios Service', () => {
  const mockUsuarioId = 123;
  const mockUsuario = {
    id: mockUsuarioId,
    nomeCompleto: 'Usuario Teste',
    emailCorporativo: 'teste@empresa.com',
    cpf: '12345678900',
    ativo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarUsuario', () => {
    const input = {
      nomeCompleto: 'Novo Usuario',
      nomeExibicao: 'Novo',
      emailCorporativo: 'novo@empresa.com',
      cpf: '98765432100',
      ativo: true,
    };

    it('deve criar usuario com sucesso', async () => {
      // Arrange
      (usuarioRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.create as jest.Mock).mockResolvedValue({ ...mockUsuario, ...input, id: 2 });

      // Act
      const result = await service.criarUsuario(input);

      // Assert
      expect(result.sucesso).toBe(true);
      expect(result.usuario).toBeDefined();
      expect(usuarioRepository.create).toHaveBeenCalled();
    });

    it('deve falhar se CPF ja existir', async () => {
      // Arrange
      (usuarioRepository.findByCpf as jest.Mock).mockResolvedValue(mockUsuario);

      // Act
      const result = await service.criarUsuario(input);

      // Assert
      expect(result.sucesso).toBe(false);
      expect(result.erro).toMatch(/CPF já cadastrado/);
      expect(usuarioRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('buscarUsuario', () => {
    it('deve buscar usuario com sucesso', async () => {
      // Arrange
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);

      // Act
      const result = await service.buscarUsuario(mockUsuarioId);

      // Assert
      expect(result).toEqual(mockUsuario);
      expect(usuarioRepository.findById).toHaveBeenCalledWith(mockUsuarioId);
    });

    it('deve lançar erro se usuario nao encontrado', async () => {
      // Arrange
      (usuarioRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.buscarUsuario(999))
        .rejects
        .toThrow(/Usuário com ID 999 não encontrado/);
    });
  });
});
