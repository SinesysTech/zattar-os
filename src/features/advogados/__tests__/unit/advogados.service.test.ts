// @ts-nocheck

import {
  criarAdvogado,
  buscarAdvogadoPorCpf,
  listarCredenciais,
  criarCredencial
} from '../../service';
import {
  criarAdvogado as criarAdvogadoDb,
  buscarAdvogadoPorCpf as buscarAdvogadoPorCpfDb,
  listarCredenciais as listarCredenciaisDb,
  criarCredencial as criarCredencialDb
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Advogados Service', () => {
  const mockAdvogado = {
    id: 1,
    nome_completo: 'Advogado Teste',
    cpf: '12345678900',
    oab: '12345',
    uf_oab: 'SP',
    ativo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarAdvogado', () => {
    const input = {
      nome_completo: 'Novo Advogado',
      cpf: '123.456.789-00', // formatted
      oab: '12345',
      uf_oab: 'SP',
      email: 'adv@test.com'
    };

    it('deve criar advogado com sucesso e limpar CPF', async () => {
      // Arrange
      (criarAdvogadoDb as jest.Mock).mockResolvedValue({ ...mockAdvogado, ...input, cpf: '12345678900' });

      // Act
      const result = await criarAdvogado(input);

      // Assert
      expect(result.cpf).toBe('12345678900');
      expect(criarAdvogadoDb).toHaveBeenCalledWith(expect.objectContaining({
        cpf: '12345678900',
        nome_completo: input.nome_completo
      }));
    });

    it('deve falhar se CPF invalido', async () => {
      // Act & Assert
      await expect(criarAdvogado({ ...input, cpf: '123' }))
        .rejects
        .toThrow('CPF inválido');
    });

    it('deve falhar se nome muito curto', async () => {
      // Act & Assert
      await expect(criarAdvogado({ ...input, nome_completo: 'Ab' }))
        .rejects
        .toThrow('Nome curto demais');
    });
  });

  describe('buscarAdvogadoPorCpf', () => {
    it('deve buscar por CPF limpo', async () => {
      // Arrange
      (buscarAdvogadoPorCpfDb as jest.Mock).mockResolvedValue(mockAdvogado);

      // Act
      await buscarAdvogadoPorCpf('123.456.789-00');

      // Assert
      expect(buscarAdvogadoPorCpfDb).toHaveBeenCalledWith('12345678900');
    });
  });

  describe('listarCredenciais', () => {
    it('deve permitir listar credenciais sem advogado_id (lista geral)', async () => {
      // Arrange
      (listarCredenciaisDb as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await listarCredenciais({});

      // Assert
      expect(result).toEqual([]);
      expect(listarCredenciaisDb).toHaveBeenCalledWith({});
    });
  });

  describe('criarCredencial', () => {
    const credInput = {
      advogado_id: 1,
      tribunal: 'TRT2',
      login: 'user',
      senha: '123'
    };

    it('deve criar credencial com sucesso', async () => {
      // Arrange
      (criarCredencialDb as jest.Mock).mockResolvedValue({ id: 1, ...credInput });

      // Act
      const result = await criarCredencial(credInput);

      // Assert
      expect(result.tribunal).toBe('TRT2');
      expect(criarCredencialDb).toHaveBeenCalledWith(credInput);
    });

    it('deve falhar se campo obrigatorio faltando', async () => {
      await expect(criarCredencial({ ...credInput, tribunal: '' }))
        .rejects
        .toThrow('Tribunal obrigatório');
    });
  });
});
