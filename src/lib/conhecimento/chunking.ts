export interface ChunkOptions {
  targetTokens: number;
  overlapTokens: number;
}

export interface Chunk {
  conteudo: string;
  posicao: number;
  tokens: number;
}

// Separadores em ordem decrescente de preferência semântica
const SEPARATORS = ['\n\n', '\n', '. ', ' '];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Encontra o índice de fim do próximo chunk no texto original.
 * Parte de targetEnd e vai VOLTANDO até encontrar um separador semântico.
 * Retorna a posição APÓS o separador para que o separador fique no chunk anterior,
 * evitando que o chunk termine com um padrão \s[A-Za-z] (letra solta após espaço).
 */
function findChunkEnd(text: string, startIdx: number, targetTokens: number): number {
  const targetChars = targetTokens * 4;
  const targetEnd = Math.min(startIdx + targetChars, text.length);

  if (targetEnd >= text.length) return text.length;

  // Tenta cada separador do mais semântico ao menos
  for (const sep of SEPARATORS) {
    const searchFrom = targetEnd - sep.length + 1;
    const pos = text.lastIndexOf(sep, searchFrom);
    if (pos > startIdx) {
      return pos + sep.length;
    }
  }

  return targetEnd;
}

/**
 * Encontra o início do overlap (volta overlapTokens no texto a partir de chunkEnd).
 */
function findOverlapStart(text: string, chunkEnd: number, overlapTokens: number): number {
  const overlapChars = overlapTokens * 4;
  const rawStart = chunkEnd - overlapChars;
  if (rawStart <= 0) return 0;

  for (const sep of SEPARATORS) {
    const pos = text.indexOf(sep, rawStart);
    if (pos >= rawStart && pos < chunkEnd) {
      return pos + sep.length;
    }
  }
  return rawStart;
}

/**
 * Divide texto em pedaços semânticos que cabem em targetTokens.
 * Usa hierarquia de separadores (parágrafo > linha > frase > palavra)
 * para preferir fronteiras semânticas sobre cortes arbitrários.
 * Overlap entre chunks consecutivos preserva contexto cross-boundary.
 */
export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  if (!text || text.trim().length === 0) {
    throw new Error('Texto vazio');
  }
  if (options.targetTokens <= 0) {
    throw new Error('targetTokens deve ser positivo');
  }
  if (options.overlapTokens >= options.targetTokens) {
    throw new Error('overlapTokens deve ser menor que targetTokens');
  }

  const trimmedText = text.trim();

  if (estimateTokens(trimmedText) <= options.targetTokens) {
    return [{ conteudo: trimmedText, posicao: 0, tokens: estimateTokens(trimmedText) }];
  }

  // Usa o texto ORIGINAL (não trimado) para os slices, preservando espaços finais
  // que garantem que chunks intermediários terminam com separador (não com letra solta).
  const sourceText = text;
  // Ajusta o início para pular leading whitespace do texto original
  const leadingSpaces = text.length - text.trimStart().length;

  const chunks: Chunk[] = [];
  let posicao = 0;
  let chunkStart = leadingSpaces;

  while (chunkStart < sourceText.length) {
    const chunkEnd = findChunkEnd(sourceText, chunkStart, options.targetTokens);
    const rawContent = sourceText.slice(chunkStart, chunkEnd);
    // trimStart para remover leading whitespace de chunks com overlap
    // mas preserva trailing whitespace/separador para evitar \s[A-Za-z]$
    const chunkContent = rawContent.trimStart();

    if (chunkContent.trim().length > 0) {
      chunks.push({
        conteudo: chunkContent,
        posicao,
        tokens: estimateTokens(chunkContent),
      });
      posicao++;
    }

    if (chunkEnd >= sourceText.length) break;

    const nextStart = findOverlapStart(sourceText, chunkEnd, options.overlapTokens);
    chunkStart = nextStart < chunkEnd ? nextStart : chunkEnd;
  }

  return chunks;
}
