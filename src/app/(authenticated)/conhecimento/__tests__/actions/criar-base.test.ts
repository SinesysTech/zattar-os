import { criarBase } from '../../actions/criar-base.action';
import { getCurrentUser } from '@/lib/auth/server';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('../../repository', () => ({
  inserirBase: jest.fn(async (input: { nome: string; slug: string }, userId: number) => ({
    id: 1,
    nome: input.nome,
    slug: input.slug,
    descricao: null,
    cor: null,
    icone: null,
    total_documentos: 0,
    total_chunks: 0,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
}));

jest.mock('@/lib/auth/server', () => ({
  getCurrentUser: jest.fn(async () => ({
    id: 99,
    nomeCompleto: 'Admin',
    nomeExibicao: 'Admin',
    emailCorporativo: 'admin@example.com',
    roles: ['admin'],
  })),
}));

describe('criarBase action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a base criada quando super_admin', async () => {
    const result = await criarBase({
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      descricao: 'Súmulas e OJs',
    });
    expect(result).toMatchObject({
      id: 1,
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      created_by: 99,
    });
  });

  it('rejeita usuário sem role admin', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({
      id: 99,
      roles: [],
    });

    await expect(criarBase({ nome: 'X', slug: 'x' }))
      .rejects.toThrow(/super_admin|permissão/i);
  });

  it('rejeita slug inválido', async () => {
    await expect(criarBase({ nome: 'X', slug: 'tem espaço' } as never))
      .rejects.toThrow();
  });
});
