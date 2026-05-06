/**
 * Normaliza texto extraído de PDF/DOCX para uso em chunking + embedding + render.
 *
 * Remove ruído sistemático que degrada qualidade de embeddings:
 * - Marcadores de página tipo "-- 492 of 579 --"
 * - Hifenizações de quebra de linha ("empre-\ngados" → "empregados")
 * - Múltiplos espaços/tabs em um só
 * - Quebras de linha simples (linhas visuais do PDF) viram espaço
 * - Mantém parágrafos (\n\n) preservados
 *
 * Aplicar IGUALMENTE no ingest (antes de chunkar/embeddar) e na UI
 * (resultado-chunk-card.tsx) para garantir consistência.
 */
export function normalizarTextoExtraido(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    .replace(/ *\n\n */g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
