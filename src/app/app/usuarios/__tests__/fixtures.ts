import type { Usuario, Permissao, UsuarioDetalhado } from '../domain';

export function criarUsuarioMock(overrides?: Partial<Usuario>): Usuario {
  return {
    id: 1,
    authUserId: 'auth-123-uuid',
    nomeCompleto: 'Usuário Teste',
    nomeExibicao: 'Teste',
    cpf: '12345678900',
    rg: null,
    dataNascimento: null,
    genero: null,
    oab: null,
    ufOab: null,
    emailPessoal: null,
    emailCorporativo: 'usuario@test.com',
    telefone: null,
    ramal: null,
    endereco: null,
    cargoId: 1,
    cargo: {
      id: 1,
      nome: 'Advogado',
      descricao: 'Cargo de advogado',
    },
    avatarUrl: null,
    coverUrl: null,
    isSuperAdmin: false,
    ativo: true,
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    ...overrides,
  };
}

export function criarPermissaoMock(overrides?: Partial<Permissao>): Permissao {
  return {
    recurso: 'processos',
    operacao: 'visualizar',
    permitido: true,
    ...overrides,
  };
}

export function criarUsuarioDetalhadoMock(
  overrides?: Partial<UsuarioDetalhado>
): UsuarioDetalhado {
  return {
    ...criarUsuarioMock(),
    permissoes: [
      criarPermissaoMock(),
      criarPermissaoMock({ recurso: 'processos', operacao: 'criar' }),
      criarPermissaoMock({ recurso: 'processos', operacao: 'editar' }),
    ],
    ...overrides,
  };
}

export function criarSuperAdminMock(overrides?: Partial<Usuario>): Usuario {
  return criarUsuarioMock({
    id: 999,
    nomeCompleto: 'Super Admin',
    nomeExibicao: 'Admin',
    emailCorporativo: 'admin@test.com',
    isSuperAdmin: true,
    ...overrides,
  });
}
