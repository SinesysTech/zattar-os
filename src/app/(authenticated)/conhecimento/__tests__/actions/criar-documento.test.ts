/**
 * @jest-environment node
 */
import { criarDocumento } from '../../actions/criar-documento.action';
import { getCurrentUser } from '@/lib/auth/server';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('../../repository', () => ({
  buscarBasePorSlug: jest.fn(async (slug: string) => ({ id: 1, slug, nome: 'Base de Teste' })),
}));

jest.mock('../../service', () => ({
  processarUpload: jest.fn(async (args: { baseId: number; nomeOriginal: string; arquivoTipo: string }) => ({
    id: 42,
    base_id: args.baseId,
    nome: args.nomeOriginal,
    arquivo_tipo: args.arquivoTipo,
    status: 'pending',
  })),
}));

jest.mock('@/lib/auth/server', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 99, roles: ['admin'] })),
}));

describe('criarDocumento action', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  function makeFormData(opts: { baseSlug: string; nome: string; bytes: Buffer; mimeType: string }): FormData {
    const fd = new FormData();
    fd.append('base_slug', opts.baseSlug);
    fd.append('nome', opts.nome);
    fd.append('arquivo', new Blob([opts.bytes], { type: opts.mimeType }), opts.nome);
    return fd;
  }

  it('processa upload com sucesso', async () => {
    const fd = makeFormData({
      baseSlug: 'jurisprudencia-tst',
      nome: 'sumula.pdf',
      bytes: Buffer.from('fake'),
      mimeType: 'application/pdf',
    });
    const result = await criarDocumento(fd);
    expect(result).toMatchObject({ id: 42, status: 'pending' });
  });

  it('rejeita arquivo > 50MB', async () => {
    const big = Buffer.alloc(51 * 1024 * 1024);
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'big.pdf',
      bytes: big,
      mimeType: 'application/pdf',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/50/);
  });

  it('rejeita formato não suportado', async () => {
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'arquivo.xls',
      bytes: Buffer.from('a'),
      mimeType: 'application/vnd.ms-excel',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/formato/i);
  });

  it('rejeita não super_admin', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({ id: 99, roles: [] });
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'a.pdf',
      bytes: Buffer.from('a'),
      mimeType: 'application/pdf',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/super_admin|permissão/i);
  });
});
