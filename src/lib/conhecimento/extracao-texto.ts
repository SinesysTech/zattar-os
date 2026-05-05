export type FormatoArquivo = 'txt' | 'md' | 'html' | 'pdf' | 'docx';

const FORMATOS_VALIDOS: ReadonlyArray<FormatoArquivo> = ['txt', 'md', 'html', 'pdf', 'docx'];

function isFormatoValido(f: string): f is FormatoArquivo {
  return (FORMATOS_VALIDOS as ReadonlyArray<string>).includes(f);
}

function stripHtml(html: string): string {
  // Remove scripts e styles inteiros (incluindo conteúdo)
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Decode entidades HTML básicas
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Colapsa whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

async function extrairPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2+ usa PDFParse como classe (ver src/lib/ai/services/extraction.service.ts)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParseModule = require('pdf-parse');
  const PDFParse = pdfParseModule.PDFParse;

  if (!PDFParse || typeof PDFParse !== 'function') {
    throw new Error('pdf-parse.PDFParse não encontrado');
  }

  try {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    await parser.load();
    const result = await parser.getText();
    return result.text || '';
  } catch (err) {
    throw new Error(`Falha ao extrair PDF: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function extrairDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new Error(`Falha ao extrair DOCX: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function extrairTexto(buffer: Buffer, formato: FormatoArquivo): Promise<string> {
  if (!isFormatoValido(formato)) {
    throw new Error(`Formato não suportado: ${formato}`);
  }

  let texto: string;
  switch (formato) {
    case 'txt':
    case 'md':
      texto = buffer.toString('utf-8');
      break;
    case 'html':
      texto = stripHtml(buffer.toString('utf-8'));
      break;
    case 'pdf':
      texto = await extrairPdf(buffer);
      break;
    case 'docx':
      texto = await extrairDocx(buffer);
      break;
  }

  if (!texto || texto.trim().length === 0) {
    throw new Error('Texto extraído está vazio');
  }

  return texto.trim();
}
