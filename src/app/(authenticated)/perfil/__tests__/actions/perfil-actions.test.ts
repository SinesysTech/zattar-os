/**
 * Tests for Perfil Server Actions
 *
 * O módulo perfil NÃO usa `authenticatedAction` — as actions usam o Supabase client
 * diretamente para autenticação e delegam ao service de `usuarios` para atualizações.
 *
 * O arquivo perfil.service.test.ts já cobre os cenários principais de ambas as actions.
 * Este arquivo complementa com cenários adicionais focados na camada de actions:
 * - Validação de exports do módulo
 * - Cenários de borda para permissões
 * - Delegação correta ao service de usuarios
 * - Tratamento de erros não-Error
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
}));

const mockAtualizarUsuario = jest.fn();
jest.mock('@/app/(authenticated)/usuarios/service', () => ({
    service: { atualizarUsuario: (...args: unknown[]) => mockAtualizarUsuario(...args) },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

// Import after mocks
import { actionObterPerfil, actionAtualizarPerfil } from '../../actions/perfil-actions';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AUTH_USER = { id: 'auth-uuid-456' };

const USUARIO_DB = {
    id: 10,
    auth_user_id: 'auth-uuid-456',
    nome_completo: 'João Pereira',
    nome_exibicao: 'João',
    cpf: '98765432100',
    rg: '123456',
    data_nascimento: '1990-05-15',
    genero: 'M',
    oab: '12345',
    uf_oab: 'SP',
    email_pessoal: 'joao@pessoal.com',
    email_corporativo: 'joao@empresa.com',
    telefone: '11999998888',
    ramal: '100',
    endereco: 'Rua Teste, 123',
    cargo_id: 3,
    cargos: { id: 3, nome: 'Estagiário', descricao: 'Estagiário Jurídico', ativo: true },
    avatar_url: null,
    cover_url: null,
    is_super_admin: false,
    ativo: true,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupUsuarioQuery(data: unknown, error: unknown = null) {
    return {
        select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data, error }),
            }),
        }),
    };
}

function setupFromMock(usuarioData: unknown, permissoesData: unknown[] | null = []) {
    mockFrom.mockImplementation((table: string) => {
        if (table === 'usuarios') {
            return setupUsuarioQuery(usuarioData);
        }
        if (table === 'permissoes_usuarios') {
            return {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: permissoesData, error: null }),
                }),
            };
        }
        return { select: jest.fn() };
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Perfil Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    // Exports validation
    // -----------------------------------------------------------------------
    describe('exports', () => {
        it('deve exportar actionObterPerfil como função', () => {
            expect(typeof actionObterPerfil).toBe('function');
        });

        it('deve exportar actionAtualizarPerfil como função', () => {
            expect(typeof actionAtualizarPerfil).toBe('function');
        });
    });

    // -----------------------------------------------------------------------
    // actionObterPerfil — cenários complementares
    // -----------------------------------------------------------------------
    describe('actionObterPerfil', () => {
        it('deve tratar permissões null graciosamente (podeGerenciarPermissoes = false)', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
            setupFromMock(USUARIO_DB, null);

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.podeGerenciarPermissoes).toBe(false);
            }
        });

        it('deve tratar permissões vazia (podeGerenciarPermissoes = false)', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
            setupFromMock(USUARIO_DB, []);

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.podeGerenciarPermissoes).toBe(false);
            }
        });

        it('deve retornar todos os campos mapeados do banco', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
            setupFromMock(USUARIO_DB, []);

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toMatchObject({
                    id: 10,
                    authUserId: 'auth-uuid-456',
                    nomeCompleto: 'João Pereira',
                    nomeExibicao: 'João',
                    cpf: '98765432100',
                    rg: '123456',
                    dataNascimento: '1990-05-15',
                    genero: 'M',
                    oab: '12345',
                    ufOab: 'SP',
                    emailPessoal: 'joao@pessoal.com',
                    emailCorporativo: 'joao@empresa.com',
                    telefone: '11999998888',
                    ramal: '100',
                    endereco: 'Rua Teste, 123',
                    cargoId: 3,
                    ativo: true,
                });
            }
        });

        it('deve retornar erro genérico para exceções não-Error', async () => {
            mockGetUser.mockRejectedValue('string error');

            const result = await actionObterPerfil();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao obter perfil');
            }
        });

        it('deve retornar erro quando getUser retorna user null sem error', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

            const result = await actionObterPerfil();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Usuário não autenticado');
            }
        });
    });

    // -----------------------------------------------------------------------
    // actionAtualizarPerfil — cenários complementares
    // -----------------------------------------------------------------------
    describe('actionAtualizarPerfil', () => {
        beforeEach(() => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });
            mockFrom.mockImplementation(() => setupUsuarioQuery({ id: 10 }));
        });

        it('deve delegar ao service de usuarios com ID correto', async () => {
            mockAtualizarUsuario.mockResolvedValue({ sucesso: true, usuario: { id: 10 } });

            await actionAtualizarPerfil({ nomeCompleto: 'João P.' });

            expect(mockAtualizarUsuario).toHaveBeenCalledWith(10, { nomeCompleto: 'João P.' });
        });

        it('deve não revalidar path quando atualização falha', async () => {
            mockAtualizarUsuario.mockResolvedValue({ sucesso: false, erro: 'Dados inválidos' });

            const result = await actionAtualizarPerfil({ telefone: 'invalido' });

            expect(result.success).toBe(false);
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('deve retornar erro genérico para exceções não-Error', async () => {
            mockAtualizarUsuario.mockRejectedValue(42);

            const result = await actionAtualizarPerfil({ nomeExibicao: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao atualizar perfil');
            }
        });

        it('deve passar dados parciais ao service corretamente', async () => {
            const dadosParciais = { emailPessoal: 'novo@email.com', telefone: '11888887777' };
            mockAtualizarUsuario.mockResolvedValue({ sucesso: true, usuario: { id: 10, ...dadosParciais } });

            const result = await actionAtualizarPerfil(dadosParciais);

            expect(result.success).toBe(true);
            expect(mockAtualizarUsuario).toHaveBeenCalledWith(10, dadosParciais);
        });

        it('deve retornar dados do usuario atualizado no resultado', async () => {
            const usuarioAtualizado = { id: 10, nomeExibicao: 'JP', emailCorporativo: 'joao@empresa.com' };
            mockAtualizarUsuario.mockResolvedValue({ sucesso: true, usuario: usuarioAtualizado });

            const result = await actionAtualizarPerfil({ nomeExibicao: 'JP' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(usuarioAtualizado);
        });
    });
});
