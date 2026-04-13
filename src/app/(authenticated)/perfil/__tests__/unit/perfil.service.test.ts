import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/**
 * Testes de "service" do módulo perfil.
 *
 * O módulo perfil não possui service.ts nem repository.ts.
 * A lógica de negócio está diretamente nas actions (actionObterPerfil, actionAtualizarPerfil),
 * que usam o Supabase client diretamente e delegam ao service de `usuarios`.
 *
 * Estes testes validam a lógica de orquestração das actions com mocks do Supabase e do service de usuarios.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn().mockImplementation(async () => ({
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

const AUTH_USER = { id: 'auth-uuid-123' };

const USUARIO_DB = {
    id: 1,
    auth_user_id: 'auth-uuid-123',
    nome_completo: 'Maria Silva',
    nome_exibicao: 'Maria',
    cpf: '12345678901',
    rg: null,
    data_nascimento: null,
    genero: null,
    oab: null,
    uf_oab: null,
    email_pessoal: null,
    email_corporativo: 'maria@empresa.com',
    telefone: null,
    ramal: null,
    endereco: null,
    cargo_id: 2,
    cargos: { id: 2, nome: 'Advogado', descricao: 'Advogado Pleno', ativo: true },
    avatar_url: null,
    cover_url: null,
    is_super_admin: false,
    ativo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

const PERMISSOES_DATA = [
    { permissao: 'usuarios:gerenciar_permissoes' },
    { permissao: 'processos:visualizar' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _setupSupabaseChain(data: unknown, error: unknown = null) {
    mockSingle.mockResolvedValue({ data, error });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
}

function _setupPermissoes(data: unknown) {
    // The second call to mockFrom (for permissoes_usuarios) needs different chain
    let _callCount = 0;
    mockFrom.mockImplementation((table: string) => {
        if (table === 'usuarios') {
            _callCount++;
            return { select: mockSelect };
        }
        if (table === 'permissoes_usuarios') {
            const permEq = jest.fn().mockResolvedValue({ data, error: null });
            const permSelect = jest.fn().mockReturnValue({ eq: permEq });
            return { select: permSelect };
        }
        return { select: mockSelect };
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Perfil Service (Actions)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    // actionObterPerfil
    // -----------------------------------------------------------------------
    describe('actionObterPerfil', () => {
        it('deve retornar perfil com sucesso quando usuário autenticado', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            // Setup from() to handle both tables
            mockFrom.mockImplementation((table: string) => {
                if (table === 'usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: USUARIO_DB, error: null }),
                            }),
                        }),
                    };
                }
                if (table === 'permissoes_usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: PERMISSOES_DATA, error: null }),
                        }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.nomeCompleto).toBe('Maria Silva');
                expect(result.data.emailCorporativo).toBe('maria@empresa.com');
                expect(result.data.cargo).toEqual({ id: 2, nome: 'Advogado', descricao: 'Advogado Pleno' });
                expect(result.data.podeGerenciarPermissoes).toBe(true);
            }
        });

        it('deve retornar podeGerenciarPermissoes false quando sem permissão', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            mockFrom.mockImplementation((table: string) => {
                if (table === 'usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: USUARIO_DB, error: null }),
                            }),
                        }),
                    };
                }
                if (table === 'permissoes_usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: [{ permissao: 'processos:visualizar' }], error: null }),
                        }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.podeGerenciarPermissoes).toBe(false);
            }
        });

        it('deve retornar erro quando usuário não autenticado', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') });

            const result = await actionObterPerfil();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Usuário não autenticado');
            }
        });

        it('deve retornar erro quando perfil não encontrado no banco', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            mockFrom.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                    }),
                }),
            }));

            const result = await actionObterPerfil();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Perfil não encontrado');
            }
        });

        it('deve tratar exceções inesperadas', async () => {
            mockGetUser.mockRejectedValue(new Error('Conexão perdida'));

            const result = await actionObterPerfil();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Conexão perdida');
            }
        });

        it('deve mapear campos snake_case para camelCase corretamente', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            const dbRow = {
                ...USUARIO_DB,
                avatar_url: 'https://example.com/avatar.png',
                cover_url: 'https://example.com/cover.png',
                is_super_admin: true,
            };

            mockFrom.mockImplementation((table: string) => {
                if (table === 'usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: dbRow, error: null }),
                            }),
                        }),
                    };
                }
                if (table === 'permissoes_usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.avatarUrl).toBe('https://example.com/avatar.png');
                expect(result.data.coverUrl).toBe('https://example.com/cover.png');
                expect(result.data.isSuperAdmin).toBe(true);
                expect(result.data.authUserId).toBe('auth-uuid-123');
            }
        });

        it('deve tratar cargo null quando usuário não tem cargo', async () => {
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            const dbRowSemCargo = { ...USUARIO_DB, cargos: null, cargo_id: null };

            mockFrom.mockImplementation((table: string) => {
                if (table === 'usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: dbRowSemCargo, error: null }),
                            }),
                        }),
                    };
                }
                if (table === 'permissoes_usuarios') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await actionObterPerfil();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.cargo).toBeNull();
                expect(result.data.cargoId).toBeNull();
            }
        });
    });

    // -----------------------------------------------------------------------
    // actionAtualizarPerfil
    // -----------------------------------------------------------------------
    describe('actionAtualizarPerfil', () => {
        beforeEach(() => {
            // Default: authenticated user with DB record
            mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null });

            mockFrom.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
                    }),
                }),
            }));
        });

        it('deve atualizar perfil com sucesso e revalidar path', async () => {
            const usuarioAtualizado = { id: 1, nomeExibicao: 'Maria S.' };
            mockAtualizarUsuario.mockResolvedValue({ sucesso: true, usuario: usuarioAtualizado });

            const result = await actionAtualizarPerfil({ nomeExibicao: 'Maria S.' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(usuarioAtualizado);
            expect(mockAtualizarUsuario).toHaveBeenCalledWith(1, { nomeExibicao: 'Maria S.' });
            expect(revalidatePath).toHaveBeenCalledWith('/app/perfil');
        });

        it('deve retornar erro quando service falha', async () => {
            mockAtualizarUsuario.mockResolvedValue({ sucesso: false, erro: 'CPF já cadastrado' });

            const result = await actionAtualizarPerfil({ cpf: '99999999999' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('CPF já cadastrado');
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando usuário não autenticado', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

            const result = await actionAtualizarPerfil({ nomeExibicao: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Usuário não autenticado');
            }
            expect(mockAtualizarUsuario).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando perfil não encontrado', async () => {
            mockFrom.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            }));

            const result = await actionAtualizarPerfil({ nomeExibicao: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Perfil não encontrado');
            }
            expect(mockAtualizarUsuario).not.toHaveBeenCalled();
        });

        it('deve tratar exceções inesperadas', async () => {
            mockAtualizarUsuario.mockRejectedValue(new Error('Timeout'));

            const result = await actionAtualizarPerfil({ nomeExibicao: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Timeout');
            }
        });
    });
});
