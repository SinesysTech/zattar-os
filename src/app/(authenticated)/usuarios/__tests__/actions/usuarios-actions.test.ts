import { revalidatePath } from 'next/cache';
import { requireAuth } from '../../actions/utils';
import * as service from '../../service';
import { createServiceClient } from '@/lib/supabase/service-client';
import {
  actionListarUsuarios,
  actionBuscarUsuario,
  actionBuscarPorCpf,
  actionBuscarPorEmail,
  actionCriarUsuario,
  actionAtualizarUsuario,
  actionDesativarUsuario,
  actionSincronizarUsuarios,
} from '../../actions/usuarios-actions';
import { criarUsuarioMock } from '../fixtures';

// Mocks
jest.mock('../../actions/utils');
jest.mock('../../service');
jest.mock('@/lib/supabase/service-client');
jest.mock('next/cache');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockService = service as jest.Mocked<typeof service>;
const mockCreateServiceClient = createServiceClient as jest.MockedFunction<typeof createServiceClient>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

interface MockSupabaseAuthAdmin {
  createUser: jest.Mock;
  deleteUser: jest.Mock;
}

interface MockSupabaseClient {
  auth: {
    admin: MockSupabaseAuthAdmin;
  };
}

describe('Usuarios Actions - Unit Tests', () => {
  const mockUser = { userId: 1 };
  const mockUsuario = criarUsuarioMock();

  const mockSupabase: MockSupabaseClient = {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser);
    mockCreateServiceClient.mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceClient>);
  });

  describe('actionListarUsuarios', () => {
    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionListarUsuarios({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });

    it('deve listar usuários com sucesso', async () => {
      const mockResult = {
        usuarios: [mockUsuario],
        total: 1,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };
      mockService.service.listarUsuarios.mockResolvedValue(mockResult);

      const result = await actionListarUsuarios({ pagina: 1, limite: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockRequireAuth).toHaveBeenCalledWith(['usuarios:visualizar']);
    });

    it('deve listar com filtros', async () => {
      const mockResult = {
        usuarios: [mockUsuario],
        total: 1,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      };
      mockService.service.listarUsuarios.mockResolvedValue(mockResult);

      await actionListarUsuarios({ ativo: true, busca: 'teste', cargoId: 1 });

      expect(mockService.service.listarUsuarios).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: true, busca: 'teste', cargoId: 1 })
      );
    });
  });

  describe('actionBuscarUsuario', () => {
    it('deve buscar usuário por ID', async () => {
      mockService.service.buscarUsuario.mockResolvedValue(mockUsuario);

      const result = await actionBuscarUsuario(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsuario);
      expect(mockService.service.buscarUsuario).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro quando usuário não encontrado', async () => {
      mockService.service.buscarUsuario.mockResolvedValue(null);

      const result = await actionBuscarUsuario(999);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('actionBuscarPorCpf', () => {
    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionBuscarPorCpf('12345678900');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });

    it('deve buscar usuário por CPF com sucesso', async () => {
      mockService.service.buscarPorCpf.mockResolvedValue(mockUsuario);

      const result = await actionBuscarPorCpf('12345678900');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsuario);
      expect(mockRequireAuth).toHaveBeenCalledWith(['usuarios:visualizar']);
      expect(mockService.service.buscarPorCpf).toHaveBeenCalledWith('12345678900');
    });

    it('deve retornar erro quando usuário não encontrado', async () => {
      mockService.service.buscarPorCpf.mockResolvedValue(null);

      const result = await actionBuscarPorCpf('99999999999');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('deve retornar erro quando service falha', async () => {
      mockService.service.buscarPorCpf.mockRejectedValue(new Error('Erro no banco de dados'));

      const result = await actionBuscarPorCpf('12345678900');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro no banco de dados');
    });
  });

  describe('actionBuscarPorEmail', () => {
    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionBuscarPorEmail('usuario@test.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permissão negada');
    });

    it('deve buscar usuário por email com sucesso', async () => {
      mockService.service.buscarPorEmail.mockResolvedValue(mockUsuario);

      const result = await actionBuscarPorEmail('usuario@test.com');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsuario);
      expect(mockRequireAuth).toHaveBeenCalledWith(['usuarios:visualizar']);
      expect(mockService.service.buscarPorEmail).toHaveBeenCalledWith('usuario@test.com');
    });

    it('deve retornar erro quando usuário não encontrado', async () => {
      mockService.service.buscarPorEmail.mockResolvedValue(null);

      const result = await actionBuscarPorEmail('naoexiste@test.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('deve retornar erro quando service falha', async () => {
      mockService.service.buscarPorEmail.mockRejectedValue(new Error('Erro no banco de dados'));

      const result = await actionBuscarPorEmail('usuario@test.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro no banco de dados');
    });
  });

  describe('actionCriarUsuario', () => {
    const dadosUsuario = {
      nomeCompleto: 'Novo Usuário',
      nomeExibicao: 'Novo',
      cpf: '12345678900',
      emailCorporativo: 'novo@test.com',
    };

    it('deve retornar erro quando sem permissão', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Permissão negada'));

      const result = await actionCriarUsuario(dadosUsuario);

      expect(result.success).toBe(false);
    });

    it('deve criar usuário sem auth com sucesso', async () => {
      mockService.service.criarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: mockUsuario,
      });

      const result = await actionCriarUsuario(dadosUsuario);

      expect(result.sucesso).toBe(true);
      expect(mockService.service.criarUsuario).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios');
    });

    it('deve criar usuário com auth (authUserId fornecido)', async () => {
      const mockAuthUser = { data: { user: { id: 'auth-123' } }, error: null };
      mockSupabase.auth.admin.createUser.mockResolvedValue(mockAuthUser);
      mockService.service.criarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: { ...mockUsuario, authUserId: 'auth-123' },
      });

      const dadosComSenha = { ...dadosUsuario, senha: 'Senha@123' };
      const result = await actionCriarUsuario(dadosComSenha);

      expect(result.sucesso).toBe(true);
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: dadosComSenha.emailCorporativo.toLowerCase(),
        password: dadosComSenha.senha,
        email_confirm: true,
        user_metadata: { name: dadosComSenha.nomeCompleto },
      });
    });

    it('deve fazer rollback de auth user em caso de erro', async () => {
      const mockAuthUser = { data: { user: { id: 'auth-123' } }, error: null };
      mockSupabase.auth.admin.createUser.mockResolvedValue(mockAuthUser as any);
      mockService.service.criarUsuario.mockResolvedValue({
        sucesso: false,
        erro: 'Erro ao salvar no banco',
      });

      const dadosComSenha = { ...dadosUsuario, senha: 'Senha@123' };
      const result = await actionCriarUsuario(dadosComSenha);

      expect(result.sucesso).toBe(false);
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-123');
    });

    it('deve retornar erro de validação Zod', async () => {
      const result = await actionCriarUsuario({ nomeCompleto: '' } as Parameters<typeof actionCriarUsuario>[0]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionAtualizarUsuario', () => {
    it('deve atualizar usuário com sucesso', async () => {
      mockService.service.atualizarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: mockUsuario,
      });

      const result = await actionAtualizarUsuario(1, { nomeCompleto: 'Nome Atualizado' });

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios/1');
    });

    it('deve desativar usuário quando ativo = false', async () => {
      mockService.service.desativarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: { ...mockUsuario, ativo: false },
        itensDesatribuidos: { processos: 5, tarefas: 3 },
      });

      const result = await actionAtualizarUsuario(1, { ativo: false });

      expect(result.success).toBe(true);
      expect(mockService.service.desativarUsuario).toHaveBeenCalledWith(1, 1);
      expect(result.itensDesatribuidos).toBeDefined();
    });
  });

  describe('actionDesativarUsuario', () => {
    it('deve desativar usuário com sucesso', async () => {
      mockService.service.desativarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: { ...mockUsuario, ativo: false },
        itensDesatribuidos: { processos: 5 },
      });

      const result = await actionDesativarUsuario(1);

      expect(result.sucesso).toBe(true);
      expect(result.itensDesatribuidos).toEqual({ processos: 5 });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios/1');
    });
  });

  describe('actionSincronizarUsuarios', () => {
    it('deve sincronizar usuários do Auth', async () => {
      mockService.service.sincronizarUsuariosAuth.mockResolvedValue({
        novos: 2,
        atualizados: 1,
        erros: 0,
      });

      const result = await actionSincronizarUsuarios();

      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/usuarios');
    });
  });
});
