import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configurar worker do PDF.js para Node.js
if (typeof window === 'undefined') {
  GlobalWorkerOptions.workerSrc = '';
}

interface TextItem {
  str: string;
  transform?: number[];
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocument({ data }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  // Implementação básica usando mammoth
  // Por ora, lançar erro indicando necessidade de implementação
  throw new Error(
    'Extração de DOCX não implementada ainda. Instale mammoth: npm install mammoth'
  );
}

export async function extractText(buffer: Buffer, contentType: string): Promise<string> {
  if (contentType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }

  if (
    contentType.includes('word') ||
    contentType.includes('docx') ||
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractTextFromDOCX(buffer);
  }

  // Texto puro
  if (contentType.includes('text') || contentType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Tipo de conteúdo não suportado para extração: ${contentType}`);
}

export function getSupportedContentTypes(): string[] {
  return [
    'application/pdf',
    'text/plain',
    'text/html',
    'text/markdown',
    // DOCX quando implementado:
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
}

export function isContentTypeSupported(contentType: string): boolean {
  const supported = getSupportedContentTypes();
  return supported.some((type) => contentType.includes(type) || type.includes(contentType));
}
