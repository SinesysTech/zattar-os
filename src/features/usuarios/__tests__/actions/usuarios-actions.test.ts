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

describe('Usuarios Actions - Unit Tests', () => {
  const mockUser = { id: 1, nome_completo: 'Admin', is_super_admin: false };
  const mockUsuario = criarUsuarioMock();

  const mockSupabase = {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser as any);
    mockCreateServiceClient.mockResolvedValue(mockSupabase as any);
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

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não encontrado');
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

      expect(result.success).toBe(true);
      expect(mockService.service.criarUsuario).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/usuarios');
    });

    it('deve criar usuário com auth (authUserId fornecido)', async () => {
      const mockAuthUser = { user: { id: 'auth-123' } };
      mockSupabase.auth.admin.createUser.mockResolvedValue(mockAuthUser as any);
      mockService.service.criarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: { ...mockUsuario, authUserId: 'auth-123' },
      });

      const dadosComSenha = { ...dadosUsuario, senha: 'Senha@123' };
      const result = await actionCriarUsuario(dadosComSenha);

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: dadosComSenha.emailCorporativo,
        password: dadosComSenha.senha,
        email_confirm: true,
      });
    });

    it('deve fazer rollback de auth user em caso de erro', async () => {
      const mockAuthUser = { user: { id: 'auth-123' } };
      mockSupabase.auth.admin.createUser.mockResolvedValue(mockAuthUser as any);
      mockService.service.criarUsuario.mockResolvedValue({
        sucesso: false,
        erro: 'Erro ao salvar no banco',
      });

      const dadosComSenha = { ...dadosUsuario, senha: 'Senha@123' };
      const result = await actionCriarUsuario(dadosComSenha);

      expect(result.success).toBe(false);
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-123');
    });

    it('deve retornar erro de validação Zod', async () => {
      const result = await actionCriarUsuario({ nomeCompleto: '' } as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
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
      expect(mockRevalidatePath).toHaveBeenCalledWith('/usuarios');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/usuarios/1');
    });

    it('deve desativar usuário quando ativo = false', async () => {
      mockService.service.desativarUsuario.mockResolvedValue({
        sucesso: true,
        usuario: { ...mockUsuario, ativo: false },
        itensDesatribuidos: { processos: 5, tarefas: 3 },
      });

      const result = await actionAtualizarUsuario(1, { ativo: false });

      expect(result.success).toBe(true);
      expect(mockService.service.desativarUsuario).toHaveBeenCalledWith(1);
      expect(result.data?.itensDesatribuidos).toBeDefined();
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

      expect(result.success).toBe(true);
      expect(result.data?.itensDesatribuidos).toEqual({ processos: 5 });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/usuarios');
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
      expect(mockRevalidatePath).toHaveBeenCalledWith('/usuarios');
    });
  });
});
