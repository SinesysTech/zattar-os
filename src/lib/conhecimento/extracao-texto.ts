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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
  try {
    const data = await pdfParse(buffer);
    return data.text;
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
