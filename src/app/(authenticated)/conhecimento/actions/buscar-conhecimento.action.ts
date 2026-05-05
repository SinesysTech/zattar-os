'use server';

import { BuscarConhecimentoInputSchema, type BuscarConhecimentoInput, type KnowledgeChunk } from '../domain';
import { buscarSemantico } from '../repository';
import { gerarEmbedding } from '@/lib/ai/embedding';
import { getCurrentUser } from '@/lib/auth/server';

export async function buscarConhecimento(input: BuscarConhecimentoInput): Promise<KnowledgeChunk[]> {
  const parsed = BuscarConhecimentoInputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado');

  const embedding = await gerarEmbedding(parsed.query);

  return buscarSemantico({
    embedding,
    threshold: parsed.threshold,
    limit: parsed.limit,
    baseIds: parsed.base_ids,
  });
}
