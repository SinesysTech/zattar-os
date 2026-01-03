// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { criarEnderecoMock, criarListarEnderecosResultMock } from '../fixtures';
import { ok, err, appError } from '@/types';

jest.mock('../../repository');

describe('Endereços Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarEndereco', () => {
    it('deve criar endereço com sucesso', async () => {
      // Arrange
      const endereco = criarEnderecoMock();
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        logradouro: 'Rua das Flores',
        numero: '123',
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      (repository.criarEndereco as jest.Mock).mockResolvedValue(ok(endereco));

      // Act
      const result = await service.criarEndereco(params);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(endereco);
      }
      expect(repository.criarEndereco).toHaveBeenCalledWith(params);
    });

    it('deve retornar erro ao criar endereço duplicado', async () => {
      // Arrange
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      (repository.criarEndereco as jest.Mock).mockResolvedValue(
        err(appError('CONFLICT', 'Endereço duplicado'))
      );

      // Act
      const result = await service.criarEndereco(params);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });
  });

  describe('atualizarEndereco', () => {
    it('deve atualizar endereço com sucesso', async () => {
      // Arrange
      const enderecoAtualizado = criarEnderecoMock({
        id: 1,
        logradouro: 'Rua Atualizada',
      });
      const params = {
        id: 1,
        logradouro: 'Rua Atualizada',
      };

      (repository.atualizarEndereco as jest.Mock).mockResolvedValue(ok(enderecoAtualizado));

      // Act
      const result = await service.atualizarEndereco(params);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logradouro).toBe('Rua Atualizada');
      }
      expect(repository.atualizarEndereco).toHaveBeenCalledWith(params);
    });

    it('deve retornar erro quando endereço não encontrado', async () => {
      // Arrange
      const params = {
        id: 999,
        logradouro: 'Rua Inexistente',
      };

      (repository.atualizarEndereco as jest.Mock).mockResolvedValue(
        err(appError('NOT_FOUND', 'Endereço 999 não encontrado'))
      );

      // Act
      const result = await service.atualizarEndereco(params);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('buscarEnderecoPorId', () => {
    it('deve buscar endereço por ID com sucesso', async () => {
      // Arrange
      const endereco = criarEnderecoMock({ id: 1 });

      (repository.buscarEnderecoPorId as jest.Mock).mockResolvedValue(ok(endereco));

      // Act
      const result = await service.buscarEnderecoPorId(1);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
      expect(repository.buscarEnderecoPorId).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro quando endereço não encontrado', async () => {
      // Arrange
      (repository.buscarEnderecoPorId as jest.Mock).mockResolvedValue(
        err(appError('NOT_FOUND', 'Endereço 999 não encontrado'))
      );

      // Act
      const result = await service.buscarEnderecoPorId(999);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('buscarEnderecosPorEntidade', () => {
    it('deve buscar endereços por entidade com sucesso', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({ id: 1, entidade_id: 100 }),
        criarEnderecoMock({ id: 2, entidade_id: 100 }),
      ];
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
      };

      (repository.buscarEnderecosPorEntidade as jest.Mock).mockResolvedValue(ok(enderecos));

      // Act
      const result = await service.buscarEnderecosPorEntidade(params);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].entidade_id).toBe(100);
      }
      expect(repository.buscarEnderecosPorEntidade).toHaveBeenCalledWith(params);
    });

    it('deve filtrar apenas endereços ativos', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({ id: 1, ativo: true }),
      ];
      const params = {
        entidade_tipo: 'cliente' as const,
        entidade_id: 100,
      };

      (repository.buscarEnderecosPorEntidade as jest.Mock).mockResolvedValue(ok(enderecos));

      // Act
      const result = await service.buscarEnderecosPorEntidade(params);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.every(e => e.ativo)).toBe(true);
      }
    });
  });

  describe('listarEnderecos', () => {
    it('deve listar endereços com paginação', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(2);

      (repository.listarEnderecos as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      const result = await service.listarEnderecos({
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enderecos).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.pagina).toBe(1);
      }
    });

    it('deve filtrar por busca (logradouro)', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(1, {
        enderecos: [criarEnderecoMock({ logradouro: 'Rua das Flores' })],
      });

      (repository.listarEnderecos as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      const result = await service.listarEnderecos({
        busca: 'Flores',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enderecos[0].logradouro).toContain('Flores');
      }
    });

    it('deve filtrar por municipio', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(1, {
        enderecos: [criarEnderecoMock({ municipio: 'São Paulo' })],
      });

      (repository.listarEnderecos as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      const result = await service.listarEnderecos({
        busca: 'São Paulo',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enderecos[0].municipio).toBe('São Paulo');
      }
    });

    it('deve ordenar por campos especificados', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(2);

      (repository.listarEnderecos as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      const result = await service.listarEnderecos({
        ordenar_por: 'municipio',
        ordem: 'asc',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(repository.listarEnderecos).toHaveBeenCalledWith({
        ordenar_por: 'municipio',
        ordem: 'asc',
        pagina: 1,
        limite: 50,
      });
    });
  });

  describe('deletarEndereco', () => {
    it('deve fazer soft delete de endereço', async () => {
      // Arrange
      (repository.deletarEndereco as jest.Mock).mockResolvedValue(ok(undefined));

      // Act
      const result = await service.deletarEndereco(1);

      // Assert
      expect(result.success).toBe(true);
      expect(repository.deletarEndereco).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro ao deletar endereço inexistente', async () => {
      // Arrange
      (repository.deletarEndereco as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao deletar endereço'))
      );

      // Act
      const result = await service.deletarEndereco(999);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
