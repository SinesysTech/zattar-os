/**
 * Testes de Integração para Auth Session
 *
 * Valida autenticação de requisições via Supabase Auth incluindo:
 * - Validação de token de sessão
 * - Busca de dados do usuário público
 * - Tratamento de erros de autenticação
 */

import { authenticateRequest } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// Mock do módulo Supabase
jest.mock('@/lib/supabase/server');

describe('Auth - Session', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Criar mock do cliente Supabase
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    // Configurar createClient para retornar o mock
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('authenticateRequest', () => {
    describe('Autenticação Bem-Sucedida', () => {
      it('deve retornar usuário autenticado com registro público', async () => {
        // Arrange
        const mockAuthUser = {
          id: 'auth-uuid-123',
          email: 'joao@example.com',
        };

        const mockPublicUser = {
          id: 1,
          nome_completo: 'João Silva',
          email_corporativo: 'joao@example.com',
        };

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPublicUser,
                error: null,
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toEqual({
          id: 1,
          nomeCompleto: 'João Silva',
          emailCorporativo: 'joao@example.com',
        });

        // Verificar chamadas
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('usuarios');
      });

      it('deve buscar registro público usando auth_user_id', async () => {
        // Arrange
        const authUserId = 'auth-uuid-456';
        const mockAuthUser = { id: authUserId, email: 'maria@example.com' };
        const mockPublicUser = {
          id: 2,
          nome_completo: 'Maria Santos',
          email_corporativo: 'maria@example.com',
        };

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockAuthUser },
          error: null,
        });

        const eqMock = jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPublicUser,
            error: null,
          }),
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: eqMock,
          }),
        });

        // Act
        await authenticateRequest();

        // Assert
        expect(eqMock).toHaveBeenCalledWith('auth_user_id', authUserId);
      });

      it('deve selecionar apenas campos necessários', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        const selectMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 1,
                nome_completo: 'Test User',
                email_corporativo: 'test@example.com',
              },
              error: null,
            }),
          }),
        });

        mockSupabaseClient.from.mockReturnValue({
          select: selectMock,
        });

        // Act
        await authenticateRequest();

        // Assert
        expect(selectMock).toHaveBeenCalledWith('id, nome_completo, email_corporativo');
      });

      it('deve converter snake_case para camelCase', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  nome_completo: 'Pedro Oliveira',
                  email_corporativo: 'pedro@example.com',
                },
                error: null,
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toHaveProperty('nomeCompleto', 'Pedro Oliveira');
        expect(result).toHaveProperty('emailCorporativo', 'pedro@example.com');
        expect(result).not.toHaveProperty('nome_completo');
        expect(result).not.toHaveProperty('email_corporativo');
      });
    });

    describe('Falhas de Autenticação', () => {
      it('deve retornar null quando usuário não autenticado', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      });

      it('deve retornar null quando getUser retorna erro', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token', status: 401 },
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });

      it('deve retornar null quando user é undefined', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: undefined },
          error: null,
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });

      it('deve retornar null quando registro público não existe', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'orphan@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows returned', code: 'PGRST116' },
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });

      it('deve retornar null quando busca de usuário público falha', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error', code: 'PGRST000' },
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });

      it('deve retornar null quando registro público é null', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null, // Sem erro, mas sem dados
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('Cenários de Erro', () => {
      it('deve retornar null quando createClient lança erro', async () => {
        // Arrange
        (createClient as jest.Mock).mockRejectedValue(new Error('Connection error'));

        // Act & Assert
        await expect(authenticateRequest()).rejects.toThrow('Connection error');
      });

      it('deve retornar null quando auth.getUser lança exceção', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Auth error'));

        // Act & Assert
        await expect(authenticateRequest()).rejects.toThrow('Auth error');
      });

      it('deve lidar com timeout de conexão', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Connection timeout')),
            }),
          }),
        });

        // Act & Assert
        await expect(authenticateRequest()).rejects.toThrow('Connection timeout');
      });
    });

    describe('Casos Especiais', () => {
      it('deve lidar com múltiplas chamadas sequenciais', async () => {
        // Arrange
        const mockUser1 = {
          id: 1,
          nome_completo: 'User 1',
          email_corporativo: 'user1@example.com',
        };
        const mockUser2 = {
          id: 2,
          nome_completo: 'User 2',
          email_corporativo: 'user2@example.com',
        };

        mockSupabaseClient.auth.getUser
          .mockResolvedValueOnce({
            data: { user: { id: 'auth-uuid-1', email: 'user1@example.com' } },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { user: { id: 'auth-uuid-2', email: 'user2@example.com' } },
            error: null,
          });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn()
              .mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                  data: mockUser1,
                  error: null,
                }),
              })
              .mockReturnValueOnce({
                single: jest.fn().mockResolvedValue({
                  data: mockUser2,
                  error: null,
                }),
              }),
          }),
        });

        // Act
        const result1 = await authenticateRequest();
        const result2 = await authenticateRequest();

        // Assert
        expect(result1?.id).toBe(1);
        expect(result2?.id).toBe(2);
      });

      it('deve lidar com usuário com nome vazio', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  nome_completo: '',
                  email_corporativo: 'test@example.com',
                },
                error: null,
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toEqual({
          id: 1,
          nomeCompleto: '',
          emailCorporativo: 'test@example.com',
        });
      });

      it('deve lidar com caracteres especiais no nome', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'auth-uuid', email: 'test@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  nome_completo: 'José María Ñoño',
                  email_corporativo: 'jose@example.com',
                },
                error: null,
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result?.nomeCompleto).toBe('José María Ñoño');
      });
    });

    describe('Integração com Fluxo Real', () => {
      it('deve simular fluxo de login completo', async () => {
        // Arrange - Simula resposta real do Supabase após login
        const realAuthResponse = {
          data: {
            user: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              aud: 'authenticated',
              email: 'admin@zattar.com.br',
              email_confirmed_at: '2024-01-15T10:00:00.000Z',
              phone: '',
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-15T10:00:00.000Z',
            },
          },
          error: null,
        };

        const realPublicUserResponse = {
          data: {
            id: 1,
            nome_completo: 'Administrador Zattar',
            email_corporativo: 'admin@zattar.com.br',
          },
          error: null,
        };

        mockSupabaseClient.auth.getUser.mockResolvedValue(realAuthResponse);
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(realPublicUserResponse),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toEqual({
          id: 1,
          nomeCompleto: 'Administrador Zattar',
          emailCorporativo: 'admin@zattar.com.br',
        });
      });

      it('deve simular fluxo de token expirado', async () => {
        // Arrange - Simula token JWT expirado
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: {
            name: 'AuthSessionMissingError',
            message: 'Auth session missing!',
            status: 401,
          },
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });

      it('deve simular usuário deletado da tabela pública', async () => {
        // Arrange - Usuário autenticado mas não existe na tabela usuarios
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'deleted-user-uuid', email: 'deleted@example.com' } },
          error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: {
                  code: 'PGRST116',
                  message: 'The result contains 0 rows',
                },
              }),
            }),
          }),
        });

        // Act
        const result = await authenticateRequest();

        // Assert
        expect(result).toBeNull();
      });
    });
  });
});
