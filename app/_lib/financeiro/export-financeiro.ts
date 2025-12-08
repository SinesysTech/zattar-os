/**
 * Helpers reutilizáveis para exportações financeiras
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ============================================================================
// Formatação
// ============================================================================

export const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

export const formatarData = (data: string | Date): string => {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const sanitizeFileName = (name: string, fallback: string = 'financeiro'): string => {
  const cleaned = name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100);
  return cleaned || fallback;
};

// ============================================================================
// CSV
// ============================================================================

export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function gerarCSV(cabecalhos: string[], linhas: (string | number | null | undefined)[][]): string {
  const header = cabecalhos.map(escapeCSV).join(',');
  const rows = linhas.map((linha) => linha.map(escapeCSV).join(','));
  return [header, ...rows].join('\n');
}

// ============================================================================
// PDF base
// ============================================================================

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

interface PDFBase {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  lineHeight: number;
}

export const gerarPDFBase = async (
  titulo: string,
  subtitulo?: string
): Promise<{ base: PDFBase; cursorY: number }> => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const lineHeight = 14;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  page.drawText(titulo, {
    x: margin,
    y: cursorY,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (subtitulo) {
    cursorY -= 20;
    page.drawText(subtitulo, {
      x: margin,
      y: cursorY,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  cursorY -= 24;

  return {
    base: { pdfDoc, page, font, boldFont, pageWidth, pageHeight, margin, lineHeight },
    cursorY,
  };
};

// ============================================================================
// Draw helpers
// ============================================================================

export const drawDRELine = (
  ctx: PDFBase & { y: number },
  descricao: string,
  valor: number,
  percentual: number | null,
  opts: { bold?: boolean; indent?: number; color?: ReturnType<typeof rgb> } = {}
): number => {
  const { page, font, boldFont, margin, lineHeight, pageWidth } = ctx;
  const y = ctx.y;
  const indent = opts.indent || 0;
  const textFont = opts.bold ? boldFont : font;

  page.drawText(descricao, {
    x: margin + indent,
    y,
    size: 10,
    font: textFont,
    color: opts.color || rgb(0, 0, 0),
  });

  page.drawText(formatarValor(valor), {
    x: margin + 260,
    y,
    size: 10,
    font: textFont,
  });

  if (percentual !== null) {
    page.drawText(formatarPercentual(percentual), {
      x: pageWidth - margin - 60,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return y - lineHeight;
};

export const drawTableRow = (
  ctx: PDFBase & { y: number },
  valores: string[],
  colunas: number[],
  opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}
): number => {
  const { page, font, boldFont, margin, lineHeight } = ctx;
  const y = ctx.y;
  const textFont = opts.bold ? boldFont : font;
  valores.forEach((valor, idx) => {
    page.drawText(valor, {
      x: margin + (colunas[idx] || 0),
      y,
      size: 9,
      font: textFont,
      color: opts.color || rgb(0, 0, 0),
    });
  });
  return y - lineHeight;
};
