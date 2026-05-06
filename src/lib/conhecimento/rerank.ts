import type { KnowledgeChunk } from '@/app/(authenticated)/conhecimento/domain';

export interface RerankerOptions {
  query: string;
  documents: KnowledgeChunk[];
  topN?: number;
}

export interface RerankResult {
  chunk: KnowledgeChunk;
  rerankScore: number;
}

/**
 * Interface comum para rerankers (cross-encoder).
 * Permite trocar provedor (Cohere/Voyage/Jina/null) sem mudar callers.
 */
export interface Reranker {
  /** Identificador para logs */
  readonly name: string;
  /** Reordena os documents por relevância à query e retorna top-N (default: todos) */
  rerank(opts: RerankerOptions): Promise<RerankResult[]>;
}

/** No-op reranker: retorna documents na ordem original. Fallback quando provedor não está configurado. */
export class NoopReranker implements Reranker {
  readonly name = 'noop';
  async rerank({ documents, topN }: RerankerOptions): Promise<RerankResult[]> {
    return documents.slice(0, topN ?? documents.length).map((c, i) => ({
      chunk: c,
      rerankScore: 1 - i / documents.length, // score sintético decrescente
    }));
  }
}

/**
 * Cohere Rerank 3.5 — multilingual, ~600ms, $2/1M tokens.
 * Docs: https://docs.cohere.com/reference/rerank
 */
export class CohereReranker implements Reranker {
  readonly name = 'cohere-rerank-3.5';

  constructor(private apiKey: string) {}

  async rerank({ query, documents, topN }: RerankerOptions): Promise<RerankResult[]> {
    if (documents.length === 0) return [];
    const top = topN ?? documents.length;

    const response = await fetch('https://api.cohere.com/v2/rerank', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'rerank-multilingual-v3.0',
        query,
        documents: documents.map((c) => c.conteudo),
        top_n: Math.min(top, documents.length),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cohere rerank ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      results: Array<{ index: number; relevance_score: number }>;
    };

    return data.results.map((r) => ({
      chunk: documents[r.index],
      rerankScore: r.relevance_score,
    }));
  }
}

/**
 * Resolve qual reranker usar com base nas env vars disponíveis.
 * Ordem de prioridade: COHERE_API_KEY → fallback Noop.
 *
 * Para forçar provedor específico, use COHERE_API_KEY (ou no futuro VOYAGE_API_KEY).
 * Se nenhuma key estiver presente, retorna NoopReranker — pipeline continua funcionando
 * sem rerank (degradação graciosa).
 */
export function getDefaultReranker(): Reranker {
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) return new CohereReranker(cohereKey);
  return new NoopReranker();
}
