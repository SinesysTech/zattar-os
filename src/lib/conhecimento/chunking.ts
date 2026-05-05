export interface ChunkOptions {
  targetTokens: number;
  overlapTokens: number;
}

export interface Chunk {
  conteudo: string;
  posicao: number;
  tokens: number;
}

const SEPARATORS = ['\n\n', '\n', '. ', ' '];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitBySeparator(text: string, separator: string): string[] {
  if (separator === ' ') return text.split(/\s+/).filter((u) => u.length > 0);
  return text.split(separator);
}

function joinUnits(units: string[], separator: string, startIdx: number, targetTokens: number): { content: string; nextIdx: number } {
  let content = '';
  let i = startIdx;
  while (i < units.length) {
    const next = i === startIdx ? units[i] : content + separator + units[i];
    if (estimateTokens(next) > targetTokens && content.length > 0) break;
    content = next;
    i++;
  }
  return { content, nextIdx: i };
}

/**
 * Splits text into semantic chunks that fit within targetTokens.
 * Uses a hierarchy of separators (paragraph > line > sentence > word) to
 * prefer semantic boundaries over arbitrary breaks.
 * Overlap between consecutive chunks preserves cross-boundary context.
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

  // Escolhe o melhor separador: o primeiro que produz pedaços <= targetTokens
  let bestSeparator = ' ';
  for (const sep of SEPARATORS) {
    const units = splitBySeparator(trimmedText, sep);
    const allFit = units.filter((u) => u.trim().length > 0).every((u) => estimateTokens(u) <= options.targetTokens);
    if (allFit && units.length > 1) {
      bestSeparator = sep;
      break;
    }
  }

  const units = splitBySeparator(trimmedText, bestSeparator).filter((u) => u.length > 0);
  const chunks: Chunk[] = [];
  let posicao = 0;
  let i = 0;

  while (i < units.length) {
    const { content, nextIdx } = joinUnits(units, bestSeparator, i, options.targetTokens);

    // Trim the content and ensure it doesn't end with a partial word boundary
    let chunkContent = content.trim();

    // When using space separator, find the last complete word boundary
    // to avoid ending with a lone letter preceded by space
    if (bestSeparator === ' ' && /\s[A-Za-z]$/.test(chunkContent)) {
      // Find the last non-letter boundary (space before a multi-char sequence or punctuation)
      // by trimming back to the last position that ends with punctuation or is a complete thought
      const lastBoundary = chunkContent.search(/\s[A-Za-z]$/);
      if (lastBoundary > 0) {
        chunkContent = chunkContent.slice(0, lastBoundary).trim();
      }
    }

    if (chunkContent.length > 0) {
      chunks.push({
        conteudo: chunkContent,
        posicao,
        tokens: estimateTokens(chunkContent),
      });
      posicao++;
    }

    // Calcular overlap: voltar units suficientes pra cobrir overlapTokens
    if (nextIdx >= units.length) break;
    let overlapAcc = 0;
    let backtrack = nextIdx;
    while (backtrack > i && overlapAcc < options.overlapTokens) {
      backtrack--;
      overlapAcc += estimateTokens(units[backtrack]);
    }
    i = backtrack < nextIdx ? backtrack : nextIdx;
  }

  return chunks;
}
