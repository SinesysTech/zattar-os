/**
 * @jest-environment node
 */
import { buscarConhecimento } from '../../actions/buscar-conhecimento.action';
import { buscarSemantico } from '../../repository';

jest.mock('@/lib/ai/embedding', () => ({
  gerarEmbedding: jest.fn(async () => Array(1536).fill(0.1)),
}));

jest.mock('../../repository', () => ({
  buscarSemantico: jest.fn(async () => [
    {
      chunk_id: 1,
      conteudo: 'Trecho de exemplo',
      similarity: 0.85,
      document_id: 10,
      document_nome: 'Súmula 331',
      base_id: 1,
      base_nome: 'Jurisprudência TST',
      posicao: 0,
    },
  ]),
}));

jest.mock('@/lib/auth/server', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 99, roles: [] })),
}));

describe('buscarConhecimento action', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('retorna chunks rankeados', async () => {
    const result = await buscarConhecimento({ query: 'horas in itinere' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      chunk_id: 1,
      similarity: 0.85,
      base_nome: 'Jurisprudência TST',
    });
  });

  it('rejeita query muito curta', async () => {
    await expect(buscarConhecimento({ query: 'ab' })).rejects.toThrow();
  });

  it('aceita filtro por base_ids', async () => {
    await buscarConhecimento({ query: 'teste válido aqui', base_ids: [1, 2] });
    expect(buscarSemantico as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ baseIds: [1, 2] })
    );
  });
});
