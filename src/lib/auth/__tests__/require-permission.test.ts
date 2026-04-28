import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../api-auth';
import { checkPermission } from '../authorization';
import { requirePermission, requireAuthentication } from '../require-permission';

// Mock dependências
jest.mock('next/server', () => {
  // Criar uma classe mockada para NextResponse que o instanceof possa usar
  class MockNextResponse {
    status: number;
    body: any;

    constructor(body: any, init?: any) {
      this.status = init?.status || 200;
      this.body = body;
    }

    static json(body: any, init?: any) {
      return new MockNextResponse(body, init);
    }
  }

  return {
    NextRequest: jest.fn().mockImplementation(() => ({})),
    NextResponse: MockNextResponse,
  };
});

jest.mock('../api-auth', () => ({
  authenticateRequest: jest.fn(),
}));

jest.mock('../authorization', () => ({
  checkPermission: jest.fn(),
}));

describe('require-permission', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost');
  });

  describe('requirePermission', () => {
    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: false,
      });

      // Execução
      const result = await requirePermission(mockRequest, 'contratos', 'criar');

      // Verificação
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect((result as any).status).toBe(401);
      expect((result as any).body).toEqual({ error: 'Não autenticado. Faça login para acessar este recurso.' });
      expect(checkPermission).not.toHaveBeenCalled();
    });

    it('deve retornar 403 se o usuário estiver autenticado mas não tiver permissão', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 123,
        source: 'session',
      });
      (checkPermission as jest.Mock).mockResolvedValue(false);

      // Execução
      const result = await requirePermission(mockRequest, 'contratos', 'criar');

      // Verificação
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect(checkPermission).toHaveBeenCalledWith(123, 'contratos', 'criar');
      expect((result as any).status).toBe(403);
      expect((result as any).body).toEqual({
        error: 'Você não tem permissão para criar contratos.',
        recurso: 'contratos',
        operacao: 'criar',
        required_permission: 'contratos.criar',
      });
    });

    it('deve retornar AuthorizedRequest se autenticado e autorizado', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 123,
        userId: 'uuid-123',
        source: 'bearer',
      });
      (checkPermission as jest.Mock).mockResolvedValue(true);

      // Execução
      const result = await requirePermission(mockRequest, 'contratos', 'criar');

      // Verificação
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect(checkPermission).toHaveBeenCalledWith(123, 'contratos', 'criar');
      expect(result).toEqual({
        usuarioId: 123,
        userId: 'uuid-123',
        source: 'bearer',
      });
    });

    it('deve usar default source "session" se não for fornecido', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 456,
      });
      (checkPermission as jest.Mock).mockResolvedValue(true);

      // Execução
      const result = await requirePermission(mockRequest, 'audiencias', 'editar');

      // Verificação
      expect(result).toEqual({
        usuarioId: 456,
        userId: undefined,
        source: 'session',
      });
    });
  });

  describe('requireAuthentication', () => {
    it('deve retornar 401 se não estiver autenticado', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: false,
      });

      // Execução
      const result = await requireAuthentication(mockRequest);

      // Verificação
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect((result as any).status).toBe(401);
    });

    it('deve retornar AuthorizedRequest se estiver autenticado, sem verificar permissão', async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 789,
      });

      // Execução
      const result = await requireAuthentication(mockRequest);

      // Verificação
      expect(authenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect(checkPermission).not.toHaveBeenCalled();
      expect(result).toEqual({
        usuarioId: 789,
        userId: undefined,
        source: 'session',
      });
    });
  });
});
