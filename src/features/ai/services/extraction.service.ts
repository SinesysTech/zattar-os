type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

async function getPdfJs(): Promise<PdfJs> {
  // Import lazy para evitar avaliar `pdfjs-dist` no SSR/Node (erro: DOMMatrix is not defined)
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJs;

  // No servidor, desabilitar worker explicitamente (evita dependências de ambiente/bundler).
  if (typeof window === 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '';
  }

  return pdfjs;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(buffer);
  // `disableWorker` não está tipado nas definições atuais do pdfjs-dist v5, mas é suportado em runtime.
  const pdf = await pdfjs.getDocument({ data, disableWorker: true } as unknown as Parameters<PdfJs['getDocument']>[0]).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as unknown[])
      .map((item) => {
        if (item && typeof item === 'object' && 'str' in item) {
          const str = (item as { str?: unknown }).str;
          return typeof str === 'string' ? str : '';
        }
        return '';
      })
      .filter((s) => s.length > 0)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

export async function extractTextFromDOCX(_buffer: Buffer): Promise<string> {
  // Implementação básica usando mammoth
  // Por ora, lançar erro indicando necessidade de implementação
  throw new Error(
    'Extração de DOCX não implementada ainda. Instale mammoth: npm install mammoth'
  );
}

export async function extractText(buffer: Buffer, contentType: string): Promise<string> {
  const normalized = contentType.toLowerCase().trim();

  try {
    if (normalized === 'application/pdf' || normalized.includes('pdf')) {
      return await extractTextFromPDF(buffer);
    }

    if (
      normalized.includes('word') ||
      normalized.includes('docx') ||
      normalized === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      normalized === 'application/msword' ||
      normalized === 'application/vnd.ms-word'
    ) {
      return await extractTextFromDOCX(buffer);
    }

    // Texto puro
    if (normalized.includes('text') || normalized === 'text/plain') {
      return buffer.toString('utf-8');
    }

    // HTML e Markdown também são texto
    if (normalized === 'text/html' || normalized === 'text/markdown') {
      return buffer.toString('utf-8');
    }

    // Se chegou aqui, o tipo não foi validado corretamente em isContentTypeSupported
    // Mas tentamos extrair como texto UTF-8 como fallback
    console.warn(
      `⚠️ [Extraction] Tipo de conteúdo não mapeado explicitamente: ${contentType}. Tentando extrair como texto UTF-8.`
    );
    return buffer.toString('utf-8');
  } catch (error) {
    console.error(`❌ [Extraction] Erro ao extrair texto de ${contentType}:`, error);
    throw new Error(
      `Erro ao extrair texto do tipo ${contentType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

export function getSupportedContentTypes(): string[] {
  return [
    'application/pdf',
    'text/plain',
    'text/html',
    'text/markdown',
    // DOCX quando implementado:
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Variantes comuns de DOCX:
    // 'application/msword',
    // 'application/vnd.ms-word',
  ];
}

/**
 * Verifica se um content-type é suportado para extração de texto.
 * Usa correspondência exata ou por substring para variantes comuns.
 */
export function isContentTypeSupported(contentType: string): boolean {
  if (!contentType || typeof contentType !== 'string') {
    return false;
  }

  const normalized = contentType.toLowerCase().trim();
  const supported = getSupportedContentTypes();

  // Verificar correspondência exata primeiro
  if (supported.includes(normalized)) {
    return true;
  }

  // Verificar por substring para variantes comuns
  // Ex: 'application/pdf' corresponde a 'application/pdf; charset=utf-8'
  for (const type of supported) {
    if (normalized.includes(type) || type.includes(normalized)) {
      return true;
    }
  }

  return false;
}
