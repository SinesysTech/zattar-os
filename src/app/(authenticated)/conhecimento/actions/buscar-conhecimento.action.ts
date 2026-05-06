'use server';

import { BuscarConhecimentoInputSchema, type BuscarConhecimentoInput, type KnowledgeChunk } from '../domain';
import { buscarSemantico } from '../repository';
import { gerarEmbedding } from '@/lib/ai/embedding';
import { getCurrentUser } from '@/lib/auth/server';
import { getDefaultReranker } from '@/lib/conhecimento';

export async function buscarConhecimento(input: BuscarConhecimentoInput): Promise<KnowledgeChunk[]> {
  const parsed = BuscarConhecimentoInputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado');

  const embedding = await gerarEmbedding(parsed.query);

  const candidatos = await buscarSemantico({
    query: parsed.query,
    embedding,
    threshold: parsed.threshold,
    limit: parsed.limit * 5, // overfetch para rerank
    baseIds: parsed.base_ids,
  });

  const reranker = getDefaultReranker();
  const reranked = await reranker.rerank({
    query: parsed.query,
    documents: candidatos,
    topN: parsed.limit,
  });

  return reranked.map((r) => r.chunk);
}
