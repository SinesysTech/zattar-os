/**
 * Testes de Integração para Safe Action Wrappers
 *
 * Valida o comportamento de wrappers de Server Actions incluindo:
 * - Autenticação e autorização
 * - Validação com Zod
 * - Tratamento de erros
 * - Extração de dados de FormData
 */

import { z } from 'zod';
import {
  authenticatedAction,
  publicAction,
  authenticatedFormAction,
  publicFormAction,
  type ActionResult,
} from '@/lib/safe-action';
import { authenticateRequest } from '@/lib/auth/session';

// Mock do módulo de autenticação
jest.mock('@/lib/auth/session');

describe('Safe Action - Integration Tests', () => {
  const mockUser = {
    id: 1,
    nomeCompleto: 'João Silva',
    emailCorporativo: 'joao@example.com',
  };

  // Schema de teste simples
  const testSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    idade: z.number().min(18, 'Idade deve ser maior que 18'),
    email: z.string().email('Email inválido').optional(),
  });

  type TestInput = z.infer<typeof testSchema>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Silencia console.error para não poluir output dos testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticatedAction', () => {
    describe('Autenticação', () => {
      it('deve executar action com usuário autenticado e dados válidos', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn().mockResolvedValue({ id: 1, status: 'criado' });
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ id: 1, status: 'criado' });
          expect(result.message).toBe('Operação realizada com sucesso');
        }
        expect(handler).toHaveBeenCalledWith(
          { nome: 'João Silva', idade: 30 },
          { user: mockUser }
        );
      });

      it('deve retornar erro quando usuário não autenticado', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(null);
        const handler = jest.fn();
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Não autenticado');
          expect(result.message).toBe('Você precisa estar autenticado para realizar esta ação');
        }
        expect(handler).not.toHaveBeenCalled();
      });

      it('deve injetar contexto do usuário no handler', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data, context) => {
          expect(context.user).toEqual(mockUser);
          return { userId: context.user.id };
        });
        const action = authenticatedAction(testSchema, handler);

        // Act
        await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(handler).toHaveBeenCalledWith(
          { nome: 'João Silva', idade: 30 },
          { user: mockUser }
        );
      });
    });

    describe('Validação Zod', () => {
      it('deve retornar erros de validação para dados inválidos', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn();
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'Jo', idade: 15 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Erro de validação');
          expect(result.errors).toBeDefined();
          expect(result.errors?.nome).toContain('Nome deve ter no mínimo 3 caracteres');
          expect(result.errors?.idade).toContain('Idade deve ser maior que 18');
        }
        expect(handler).not.toHaveBeenCalled();
      });

      it('deve formatar erros do Zod corretamente', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn();
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'A', idade: 10, email: 'invalid-email' });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toBeDefined();
          expect(result.errors?.nome).toContain('Nome deve ter no mínimo 3 caracteres');
          expect(result.errors?.idade).toContain('Idade deve ser maior que 18');
          expect(result.errors?.email).toContain('Email inválido');
        }
      });

      it('deve passar dados validados para o handler', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          // Tipos devem ser corretos após validação
          expect(typeof data.nome).toBe('string');
          expect(typeof data.idade).toBe('number');
          return { success: true };
        });
        const action = authenticatedAction(testSchema, handler);

        // Act
        await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(handler).toHaveBeenCalled();
      });

      it('deve validar campos opcionais corretamente', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn().mockResolvedValue({ id: 1 });
        const action = authenticatedAction(testSchema, handler);

        // Act - sem email (opcional)
        const result1 = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result1.success).toBe(true);

        // Act - com email
        const result2 = await action({
          nome: 'João Silva',
          idade: 30,
          email: 'joao@example.com'
        });

        // Assert
        expect(result2.success).toBe(true);
      });
    });

    describe('FormData Handling', () => {
      it('deve extrair dados de FormData corretamente', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn().mockResolvedValue({ id: 1 });
        const action = authenticatedAction(testSchema, handler);

        const formData = new FormData();
        formData.append('nome', 'João Silva');
        formData.append('idade', '30');

        // Act
        const result = await action(formData);

        // Assert
        expect(result.success).toBe(true);
        expect(handler).toHaveBeenCalledWith(
          { nome: 'João Silva', idade: 30 },
          { user: mockUser }
        );
      });

      it('deve converter strings numéricas para números', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          expect(typeof data.idade).toBe('number');
          expect(data.idade).toBe(25);
          return { id: 1 };
        });
        const action = authenticatedAction(testSchema, handler);

        const formData = new FormData();
        formData.append('nome', 'Maria Santos');
        formData.append('idade', '25');

        // Act
        await action(formData);

        // Assert
        expect(handler).toHaveBeenCalled();
      });

      it('deve converter "true"/"false" para booleanos', async () => {
        // Arrange
        const schemaComBoolean = z.object({
          nome: z.string(),
          ativo: z.boolean(),
        });
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          expect(typeof data.ativo).toBe('boolean');
          return { id: 1 };
        });
        const action = authenticatedAction(schemaComBoolean, handler);

        const formData = new FormData();
        formData.append('nome', 'João');
        formData.append('ativo', 'true');

        // Act
        await action(formData);

        // Assert
        expect(handler).toHaveBeenCalledWith(
          { nome: 'João', ativo: true },
          { user: mockUser }
        );
      });

      it('deve lidar com campos vazios como undefined', async () => {
        // Arrange
        const schemaComOpcional = z.object({
          nome: z.string(),
          email: z.string().optional(),
        });
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          expect(data.email).toBeUndefined();
          return { id: 1 };
        });
        const action = authenticatedAction(schemaComOpcional, handler);

        const formData = new FormData();
        formData.append('nome', 'João');
        formData.append('email', '');

        // Act
        await action(formData);

        // Assert
        expect(handler).toHaveBeenCalled();
      });

      it('deve lidar com arrays (múltiplos valores com mesma chave)', async () => {
        // Arrange
        const schemaComArray = z.object({
          nome: z.string(),
          tags: z.array(z.string()),
        });
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          expect(Array.isArray(data.tags)).toBe(true);
          expect(data.tags).toEqual(['tag1', 'tag2', 'tag3']);
          return { id: 1 };
        });
        const action = authenticatedAction(schemaComArray, handler);

        const formData = new FormData();
        formData.append('nome', 'João');
        formData.append('tags', 'tag1');
        formData.append('tags', 'tag2');
        formData.append('tags', 'tag3');

        // Act
        await action(formData);

        // Assert
        expect(handler).toHaveBeenCalled();
      });

      it('deve preservar strings com zeros à esquerda', async () => {
        // Arrange
        const schemaComCodigo = z.object({
          codigo: z.string(),
        });
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn(async (data) => {
          expect(data.codigo).toBe('00123');
          return { id: 1 };
        });
        const action = authenticatedAction(schemaComCodigo, handler);

        const formData = new FormData();
        formData.append('codigo', '00123');

        // Act
        await action(formData);

        // Assert
        expect(handler).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('deve capturar e retornar erros lançados pelo handler', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn().mockRejectedValue(new Error('Erro no banco de dados'));
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Erro no banco de dados');
          expect(result.message).toBe('Erro no banco de dados');
        }
      });

      it('deve retornar erro genérico para erros desconhecidos', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const handler = jest.fn().mockRejectedValue('String error');
        const action = authenticatedAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Erro interno do servidor');
          expect(result.message).toBe('Ocorreu um erro inesperado. Tente novamente.');
        }
      });

      it('deve logar erros no console', async () => {
        // Arrange
        const consoleErrorSpy = jest.spyOn(console, 'error');
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        const error = new Error('Test error');
        const handler = jest.fn().mockRejectedValue(error);
        const action = authenticatedAction(testSchema, handler);

        // Act
        await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith('[SafeAction] Erro:', error);
      });
    });
  });

  describe('publicAction', () => {
    describe('Sem Autenticação', () => {
      it('deve executar action sem verificar autenticação', async () => {
        // Arrange
        const handler = jest.fn().mockResolvedValue({ results: [] });
        const action = publicAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ results: [] });
        }
        expect(authenticateRequest).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith({ nome: 'João Silva', idade: 30 });
      });

      it('deve validar dados com Zod', async () => {
        // Arrange
        const handler = jest.fn();
        const action = publicAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'Jo', idade: 15 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Erro de validação');
          expect(result.errors?.nome).toBeDefined();
          expect(result.errors?.idade).toBeDefined();
        }
        expect(handler).not.toHaveBeenCalled();
      });

      it('deve processar FormData corretamente', async () => {
        // Arrange
        const handler = jest.fn().mockResolvedValue({ id: 1 });
        const action = publicAction(testSchema, handler);

        const formData = new FormData();
        formData.append('nome', 'João Silva');
        formData.append('idade', '30');

        // Act
        const result = await action(formData);

        // Assert
        expect(result.success).toBe(true);
        expect(handler).toHaveBeenCalledWith({ nome: 'João Silva', idade: 30 });
      });

      it('deve capturar erros lançados pelo handler', async () => {
        // Arrange
        const handler = jest.fn().mockRejectedValue(new Error('Public error'));
        const action = publicAction(testSchema, handler);

        // Act
        const result = await action({ nome: 'João Silva', idade: 30 });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Public error');
        }
      });
    });
  });

  describe('authenticatedFormAction', () => {
    it('deve criar wrapper compatível com useActionState', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
      const handler = jest.fn().mockResolvedValue({ id: 1 });
      const formAction = authenticatedFormAction(testSchema, handler);

      const formData = new FormData();
      formData.append('nome', 'João Silva');
      formData.append('idade', '30');

      // Act
      const result = await formAction(null, formData);

      // Assert
      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledWith(
        { nome: 'João Silva', idade: 30 },
        { user: mockUser }
      );
    });

    it('deve ignorar prevState e processar formData', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
      const handler = jest.fn().mockResolvedValue({ id: 2 });
      const formAction = authenticatedFormAction(testSchema, handler);

      const prevState: ActionResult<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };

      const formData = new FormData();
      formData.append('nome', 'Maria Santos');
      formData.append('idade', '25');

      // Act
      const result = await formAction(prevState, formData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(2); // Novo ID, não o do prevState
      }
    });
  });

  describe('publicFormAction', () => {
    it('deve criar wrapper compatível com useActionState', async () => {
      // Arrange
      const handler = jest.fn().mockResolvedValue({ results: [] });
      const formAction = publicFormAction(testSchema, handler);

      const formData = new FormData();
      formData.append('nome', 'João Silva');
      formData.append('idade', '30');

      // Act
      const result = await formAction(null, formData);

      // Assert
      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledWith({ nome: 'João Silva', idade: 30 });
      expect(authenticateRequest).not.toHaveBeenCalled();
    });
  });

  describe('Casos Reais de Integração', () => {
    it('deve processar criação de usuário completo', async () => {
      // Arrange
      const userSchema = z.object({
        nomeCompleto: z.string().min(3),
        emailCorporativo: z.string().email(),
        cpf: z.string().length(11),
        dataNascimento: z.string(),
        telefone: z.string().optional(),
      });

      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
      const handler = jest.fn(async (data, { user }) => {
        return {
          id: 2,
          ...data,
          criadoPor: user.id,
          criadoEm: new Date().toISOString(),
        };
      });
      const action = authenticatedAction(userSchema, handler);

      // Act
      const result = await action({
        nomeCompleto: 'Maria Santos',
        emailCorporativo: 'maria@example.com',
        cpf: '12345678901',
        dataNascimento: '1995-05-15',
        telefone: '11987654321',
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(2);
        expect(result.data.nomeCompleto).toBe('Maria Santos');
        expect(result.data.criadoPor).toBe(1);
      }
    });

    it('deve processar busca pública com filtros', async () => {
      // Arrange
      const searchSchema = z.object({
        query: z.string().min(3),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      });

      const handler = jest.fn(async (data) => {
        return {
          results: [{ id: 1, nome: 'Resultado 1' }],
          total: 1,
          query: data.query,
        };
      });
      const action = publicAction(searchSchema, handler);

      // Act
      const result = await action({ query: 'teste', limit: 10, offset: 0 });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results).toHaveLength(1);
        expect(result.data.query).toBe('teste');
      }
    });

    it('deve lidar com erro de constraint do banco de dados', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
      const handler = jest.fn().mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );
      const action = authenticatedAction(testSchema, handler);

      // Act
      const result = await action({ nome: 'João Silva', idade: 30 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('duplicate key value');
      }
    });
  });
});
