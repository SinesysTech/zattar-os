import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = text.replace(/\n/g, ' ').trim();

  if (!normalized) {
    throw new Error('Texto vazio não pode ser vetorizado');
  }

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: normalized,
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const normalized = texts.map((t) => t.replace(/\n/g, ' ').trim()).filter((t) => t.length > 0);

  if (normalized.length === 0) {
    return [];
  }

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: normalized,
  });

  return embeddings;
}
