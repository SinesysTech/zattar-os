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
  // Normalizar mantendo o mesmo comprimento do array original
  // Não filtrar aqui - o filtro deve ser feito antes de chamar esta função
  const normalized = texts.map((t) => t.replace(/\n/g, ' ').trim());

  if (normalized.length === 0) {
    return [];
  }

  // Verificar se há textos vazios - se sim, lançar erro para forçar filtro prévio
  const emptyIndices = normalized
    .map((t, i) => (t.length === 0 ? i : -1))
    .filter((i) => i !== -1);
  if (emptyIndices.length > 0) {
    throw new Error(
      `generateEmbeddings recebeu ${emptyIndices.length} texto(s) vazio(s) nos índices: ${emptyIndices.join(', ')}. Filtre textos vazios antes de chamar esta função.`
    );
  }

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: normalized,
  });

  return embeddings;
}
