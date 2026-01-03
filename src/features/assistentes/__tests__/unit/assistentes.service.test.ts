// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { criarAssistenteMock } from '../fixtures';

jest.mock('../../repository');

describe('Assistentes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarAssistentes', () => {
    it('deve listar assistentes ativos por padrão', async () => {
      // Arrange
      const assistentes = [
        criarAssistenteMock({ id: 1 }),
        criarAssistenteMock({ id: 2 }),
      ];
      (repository.findAll as jest.Mock).mockResolvedValue(assistentes);

      // Act
      const result = await service.listarAssistentes({ ativo: true });

      // Assert
      expect(result).toHaveLength(2);
      expect(repository.findAll).toHaveBeenCalledWith({ ativo: true });
    });

    it('deve aplicar filtro de busca', async () => {
      // Arrange
      const assistentes = [criarAssistenteMock({ nome: 'Teste Busca' })];
      (repository.findAll as jest.Mock).mockResolvedValue(assistentes);

      // Act
      await service.listarAssistentes({ busca: 'Teste', ativo: true });

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith({
        busca: 'Teste',
        ativo: true,
      });
    });

    it('deve listar assistentes inativos quando especificado', async () => {
      // Arrange
      const assistentes = [criarAssistenteMock({ ativo: false })];
      (repository.findAll as jest.Mock).mockResolvedValue(assistentes);

      // Act
      await service.listarAssistentes({ ativo: false });

      // Assert
      expect(repository.findAll).toHaveBeenCalledWith({ ativo: false });
    });
  });

  describe('buscarAssistentePorId', () => {
    it('deve buscar assistente por ID', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1 });
      (repository.findById as jest.Mock).mockResolvedValue(assistente);

      // Act
      const result = await service.buscarAssistentePorId(1);

      // Assert
      expect(result).toEqual(assistente);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('deve retornar null quando assistente não encontrado', async () => {
      // Arrange
      (repository.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.buscarAssistentePorId(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('criarAssistente', () => {
    it('deve criar assistente com dados válidos', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      const input = {
        nome: 'Assistente Teste',
        descricao: 'Descrição teste',
        iframe_code: '<iframe src="https://example.com"></iframe>',
      };

      (repository.create as jest.Mock).mockResolvedValue(assistente);

      // Act
      const result = await service.criarAssistente(input, 1);

      // Assert
      expect(result).toEqual(assistente);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Assistente Teste',
          criado_por: 1,
        })
      );
    });

    it('deve validar schema Zod - nome obrigatório', async () => {
      // Arrange
      const input = {
        descricao: 'Descrição',
        iframe_code: '<iframe src="https://example.com"></iframe>',
      };

      // Act & Assert
      await expect(service.criarAssistente(input, 1)).rejects.toThrow(
        'Dados inválidos'
      );
    });

    it('deve validar schema Zod - iframe_code obrigatório', async () => {
      // Arrange
      const input = {
        nome: 'Assistente',
        descricao: 'Descrição',
      };

      // Act & Assert
      await expect(service.criarAssistente(input, 1)).rejects.toThrow(
        'Dados inválidos'
      );
    });

    it('deve validar schema Zod - nome com tamanho máximo', async () => {
      // Arrange
      const input = {
        nome: 'A'.repeat(201), // Excede 200 caracteres
        iframe_code: '<iframe src="https://example.com"></iframe>',
      };

      // Act & Assert
      await expect(service.criarAssistente(input, 1)).rejects.toThrow(
        'Dados inválidos'
      );
    });

    it('deve sanitizar iframe_code removendo scripts', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      const input = {
        nome: 'Teste',
        iframe_code: '<iframe src="test"></iframe><script>alert("xss")</script>',
      };

      (repository.create as jest.Mock).mockResolvedValue(assistente);

      // Act
      await service.criarAssistente(input, 1);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          iframe_code: expect.not.stringContaining('script'),
        })
      );
    });

    it('deve rejeitar iframe_code inválido', async () => {
      // Arrange
      const input = {
        nome: 'Teste',
        iframe_code: '<div>Não é iframe</div>',
      };

      // Act & Assert
      await expect(service.criarAssistente(input, 1)).rejects.toThrow(
        'Código do iframe inválido'
      );
    });
  });

  describe('atualizarAssistente', () => {
    it('deve atualizar assistente existente', async () => {
      // Arrange
      const existente = criarAssistenteMock({ id: 1 });
      const atualizado = criarAssistenteMock({ id: 1, nome: 'Nome Atualizado' });

      (repository.findById as jest.Mock).mockResolvedValue(existente);
      (repository.update as jest.Mock).mockResolvedValue(atualizado);

      // Act
      const result = await service.atualizarAssistente(1, {
        nome: 'Nome Atualizado',
      });

      // Assert
      expect(result).toEqual(atualizado);
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nome: 'Nome Atualizado' })
      );
    });

    it('deve retornar erro quando assistente não encontrado', async () => {
      // Arrange
      (repository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.atualizarAssistente(999, { nome: 'Teste' })
      ).rejects.toThrow('Assistente não encontrado');
    });

    it('deve validar schema Zod - dados inválidos', async () => {
      // Arrange
      const existente = criarAssistenteMock({ id: 1 });
      (repository.findById as jest.Mock).mockResolvedValue(existente);

      // Act & Assert
      await expect(
        service.atualizarAssistente(1, { nome: 'A'.repeat(201) })
      ).rejects.toThrow('Dados inválidos');
    });

    it('deve permitir atualização parcial', async () => {
      // Arrange
      const existente = criarAssistenteMock({ id: 1 });
      const atualizado = criarAssistenteMock({ id: 1, ativo: false });

      (repository.findById as jest.Mock).mockResolvedValue(existente);
      (repository.update as jest.Mock).mockResolvedValue(atualizado);

      // Act
      await service.atualizarAssistente(1, { ativo: false });

      // Assert
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ ativo: false })
      );
    });

    it('deve sanitizar iframe_code quando fornecido', async () => {
      // Arrange
      const existente = criarAssistenteMock({ id: 1 });
      const atualizado = criarAssistenteMock({ id: 1 });

      (repository.findById as jest.Mock).mockResolvedValue(existente);
      (repository.update as jest.Mock).mockResolvedValue(atualizado);

      // Act
      await service.atualizarAssistente(1, {
        iframe_code: '<iframe src="test"></iframe><script>bad</script>',
      });

      // Assert
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          iframe_code: expect.not.stringContaining('script'),
        })
      );
    });
  });

  describe('deletarAssistente', () => {
    it('deve deletar assistente existente', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1 });
      (repository.findById as jest.Mock).mockResolvedValue(assistente);
      (repository.deleteAssistente as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.deletarAssistente(1);

      // Assert
      expect(result).toBe(true);
      expect(repository.deleteAssistente).toHaveBeenCalledWith(1);
    });

    it('deve retornar false quando assistente não encontrado', async () => {
      // Arrange
      (repository.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.deletarAssistente(999);

      // Assert
      expect(result).toBe(false);
      expect(repository.deleteAssistente).not.toHaveBeenCalled();
    });
  });
});
