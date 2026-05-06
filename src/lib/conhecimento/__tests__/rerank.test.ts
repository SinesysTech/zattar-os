import { NoopReranker, CohereReranker } from '../rerank';
import type { KnowledgeChunk } from '@/app/(authenticated)/conhecimento/domain';

const fakeChunk = (id: number, conteudo: string): KnowledgeChunk => ({
  chunk_id: id,
  conteudo,
  similarity: 0.5,
  document_id: 1,
  document_nome: 'Doc',
  base_id: 1,
  base_nome: 'Base',
  posicao: id,
});

describe('NoopReranker', () => {
  it('retorna documentos na ordem original', async () => {
    const r = new NoopReranker();
    const docs = [fakeChunk(1, 'A'), fakeChunk(2, 'B'), fakeChunk(3, 'C')];
    const result = await r.rerank({ query: 'q', documents: docs });
    expect(result.map((x) => x.chunk.chunk_id)).toEqual([1, 2, 3]);
  });

  it('respeita topN', async () => {
    const r = new NoopReranker();
    const docs = [fakeChunk(1, 'A'), fakeChunk(2, 'B'), fakeChunk(3, 'C')];
    const result = await r.rerank({ query: 'q', documents: docs, topN: 2 });
    expect(result).toHaveLength(2);
  });

  it('retorna array vazio para entrada vazia', async () => {
    const r = new NoopReranker();
    const result = await r.rerank({ query: 'q', documents: [] });
    expect(result).toEqual([]);
  });
});

describe('CohereReranker', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('chama API Cohere com payload correto e mapeia resposta', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { index: 2, relevance_score: 0.95 },
          { index: 0, relevance_score: 0.7 },
        ],
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const r = new CohereReranker('fake-key');
    const docs = [fakeChunk(1, 'A'), fakeChunk(2, 'B'), fakeChunk(3, 'C')];
    const result = await r.rerank({ query: 'teste', documents: docs, topN: 2 });

    expect(result.map((x) => x.chunk.chunk_id)).toEqual([3, 1]);
    expect(result[0].rerankScore).toBe(0.95);

    const body = JSON.parse((mockFetch.mock.calls[0][1] as { body: string }).body);
    expect(body.model).toBe('rerank-multilingual-v3.0');
    expect(body.query).toBe('teste');
    expect(body.documents).toEqual(['A', 'B', 'C']);
    expect(body.top_n).toBe(2);
  });

  it('lança erro descritivo em falha HTTP', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":"unauthorized"}',
    }) as unknown as typeof fetch;

    const r = new CohereReranker('bad-key');
    await expect(
      r.rerank({ query: 'q', documents: [fakeChunk(1, 'A')] }),
    ).rejects.toThrow(/Cohere rerank 401/);
  });
});
