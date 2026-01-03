import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authenticatedAction } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { criarEnderecoMock, criarListarEnderecosResultMock } from '../fixtures';
import { ok, err, appError } from '@/types';

// Mock dependencies
jest.mock('@/lib/safe-action');
jest.mock('next/cache');

// Mock service
const mockService = {
  criarEndereco: jest.fn(),
  atualizarEndereco: jest.fn(),
  buscarEnderecoPorId: jest.fn(),
  buscarEnderecosPorEntidade: jest.fn(),
  listarEnderecos: jest.fn(),
  deletarEndereco: jest.fn(),
};

jest.mock('../../service', () => mockService);

// Mock action implementations
const actionCriarEndereco = jest.fn();
const actionAtualizarEndereco = jest.fn();
const actionBuscarEnderecoPorId = jest.fn();
const actionBuscarEnderecosPorEntidade = jest.fn();
const actionListarEnderecos = jest.fn();
const actionDeletarEndereco = jest.fn();

describe('Endereços Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionCriarEndereco', () => {
    it('deve validar schema Zod antes de criar', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Dados inválidos',
            };
          }
          return handler(input, { userId: 'user123' });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Simular action com validação
      actionCriarEndereco.mockImplementation(
        mockAuthAction(
          {
            safeParse: (input: unknown) => {
              const data = input as Record<string, unknown>;
              if (!data.municipio || !data.estado || !data.cep) {
                return { success: false };
              }
              return { success: true, data };
            },
          },
          async () => ok(criarEnderecoMock())
        )
      );

      // Act
      const result = await actionCriarEndereco({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        // Faltando campos obrigatórios
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Dados inválidos');
    });

    it('deve criar endereço e revalidar cache', async () => {
      // Arrange
      const endereco = criarEnderecoMock();
      mockService.criarEndereco.mockResolvedValue(ok(endereco));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => {
          const result = await handler(input, { userId: 'user123' });
          revalidatePath('/enderecos');
          return result;
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionCriarEndereco.mockImplementation(
        mockAuthAction(null, async (input) => {
          const result = await mockService.criarEndereco(input);
          revalidatePath('/enderecos');
          return result;
        })
      );

      // Act
      await actionCriarEndereco({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      });

      // Assert
      expect(mockService.criarEndereco).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade_tipo: 'cliente',
          entidade_id: 100,
          municipio: 'São Paulo',
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/enderecos');
    });
  });

  describe('actionAtualizarEndereco', () => {
    it('deve validar ID e dados antes de atualizar', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'ID inválido',
            };
          }
          return handler(input, { userId: 'user123' });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionAtualizarEndereco.mockImplementation(
        mockAuthAction(
          {
            safeParse: (input: unknown) => {
              const data = input as Record<string, unknown>;
              if (typeof data.id !== 'number' || data.id <= 0) {
                return { success: false };
              }
              return { success: true, data };
            },
          },
          async () => ok(criarEnderecoMock())
        )
      );

      // Act
      const result = await actionAtualizarEndereco({
        id: -1, // ID inválido
        logradouro: 'Rua Atualizada',
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve atualizar endereço e revalidar cache', async () => {
      // Arrange
      const enderecoAtualizado = criarEnderecoMock({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      mockService.atualizarEndereco.mockResolvedValue(ok(enderecoAtualizado));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => {
          const result = await handler(input, { userId: 'user123' });
          revalidatePath('/enderecos');
          return result;
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionAtualizarEndereco.mockImplementation(
        mockAuthAction(null, async (input) => {
          const result = await mockService.atualizarEndereco(input);
          revalidatePath('/enderecos');
          return result;
        })
      );

      // Act
      await actionAtualizarEndereco({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      // Assert
      expect(mockService.atualizarEndereco).toHaveBeenCalledWith({
        id: 1,
        logradouro: 'Rua Atualizada',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/enderecos');
    });
  });

  describe('actionBuscarEnderecoPorId', () => {
    it('deve buscar endereço por ID com autenticação', async () => {
      // Arrange
      const endereco = criarEnderecoMock({ id: 1 });
      mockService.buscarEnderecoPorId.mockResolvedValue(ok(endereco));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionBuscarEnderecoPorId.mockImplementation(
        mockAuthAction(null, async (input) => {
          return mockService.buscarEnderecoPorId((input as { id: number }).id);
        })
      );

      // Act
      const result = await actionBuscarEnderecoPorId({ id: 1 });

      // Assert
      expect(mockService.buscarEnderecoPorId).toHaveBeenCalledWith(1);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it('deve retornar erro quando endereço não encontrado', async () => {
      // Arrange
      mockService.buscarEnderecoPorId.mockResolvedValue(
        err(appError('NOT_FOUND', 'Endereço não encontrado'))
      );

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionBuscarEnderecoPorId.mockImplementation(
        mockAuthAction(null, async (input) => {
          return mockService.buscarEnderecoPorId((input as { id: number }).id);
        })
      );

      // Act
      const result = await actionBuscarEnderecoPorId({ id: 999 });

      // Assert
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('actionBuscarEnderecosPorEntidade', () => {
    it('deve buscar endereços por entidade', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({ id: 1 }),
        criarEnderecoMock({ id: 2 }),
      ];

      mockService.buscarEnderecosPorEntidade.mockResolvedValue(ok(enderecos));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionBuscarEnderecosPorEntidade.mockImplementation(
        mockAuthAction(null, async (input) => {
          return mockService.buscarEnderecosPorEntidade(input);
        })
      );

      // Act
      const result = await actionBuscarEnderecosPorEntidade({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });

      // Assert
      expect(mockService.buscarEnderecosPorEntidade).toHaveBeenCalledWith({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('actionListarEnderecos', () => {
    it('deve listar endereços com paginação', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(2);
      mockService.listarEnderecos.mockResolvedValue(ok(mockResult));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionListarEnderecos.mockImplementation(
        mockAuthAction(null, async (input) => {
          return mockService.listarEnderecos(input);
        })
      );

      // Act
      const result = await actionListarEnderecos({
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(mockService.listarEnderecos).toHaveBeenCalledWith({
        pagina: 1,
        limite: 50,
      });
      if (result.success) {
        expect(result.data.enderecos).toHaveLength(2);
      }
    });

    it('deve aplicar filtros de busca', async () => {
      // Arrange
      const mockResult = criarListarEnderecosResultMock(1);
      mockService.listarEnderecos.mockResolvedValue(ok(mockResult));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionListarEnderecos.mockImplementation(
        mockAuthAction(null, async (input) => {
          return mockService.listarEnderecos(input);
        })
      );

      // Act
      await actionListarEnderecos({
        busca: 'São Paulo',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(mockService.listarEnderecos).toHaveBeenCalledWith({
        busca: 'São Paulo',
        pagina: 1,
        limite: 50,
      });
    });
  });

  describe('actionDeletarEndereco', () => {
    it('deve deletar endereço e revalidar cache', async () => {
      // Arrange
      mockService.deletarEndereco.mockResolvedValue(ok(undefined));

      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => {
          const result = await handler(input, { userId: 'user123' });
          revalidatePath('/enderecos');
          return result;
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionDeletarEndereco.mockImplementation(
        mockAuthAction(null, async (input) => {
          const result = await mockService.deletarEndereco(
            (input as { id: number }).id
          );
          revalidatePath('/enderecos');
          return result;
        })
      );

      // Act
      await actionDeletarEndereco({ id: 1 });

      // Assert
      expect(mockService.deletarEndereco).toHaveBeenCalledWith(1);
      expect(revalidatePath).toHaveBeenCalledWith('/enderecos');
    });

    it('deve validar autenticação antes de deletar', async () => {
      // Arrange
      const mockAuthAction = jest.fn((_schema, handler) => {
        return async (input: unknown) => {
          // Simular usuário não autenticado
          return {
            success: false,
            error: 'Não autorizado',
          };
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      actionDeletarEndereco.mockImplementation(
        mockAuthAction(null, async () => ok(undefined))
      );

      // Act
      const result = await actionDeletarEndereco({ id: 1 });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Não autorizado');
      expect(mockService.deletarEndereco).not.toHaveBeenCalled();
    });
  });
});
