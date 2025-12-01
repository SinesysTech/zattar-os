/**
 * Extrai o buffer de um data URL base64 (ex: data:image/png;base64,...).
 */
export function decodeDataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato base64 inválido: esperado data:<mime>;base64,<dados>');
  }
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return { buffer, contentType };
}

/**
 * Gera um nome de arquivo com timestamp para armazenar artefatos.
 */
export function buildFileName(prefix: string, ext: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${ts}.${ext}`;
}
