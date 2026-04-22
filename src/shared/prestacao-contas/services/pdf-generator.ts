import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, RootContent, PhrasingContent } from 'mdast';
import crypto from 'crypto';

export interface GerarPdfInput {
  markdownResolvido: string;
  assinaturaPngBase64: string;
  metadados: {
    protocolo: string;
    dataAssinatura: string;
    clienteNome: string;
    clienteCpf: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    geolocation?: { latitude: number; longitude: number } | null;
    hashOriginal: string;
    termosAceiteVersao: string;
  };
}

export interface GerarPdfOutput {
  buffer: Buffer;
  hashFinal: string;
}

const MARGIN = 50;
const PAGE_W = 595;
const PAGE_H = 842;
const BODY_SIZE = 11;
const LINE_HEIGHT = 16;
const H1_SIZE = 18;
const H2_SIZE = 14;

function nodeToPlainText(node: RootContent | PhrasingContent): string {
  if ('value' in node && typeof node.value === 'string') return node.value;
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as Array<RootContent | PhrasingContent>)
      .map(nodeToPlainText)
      .join('');
  }
  return '';
}

export async function gerarPdfPrestacaoContas(
  input: GerarPdfInput,
): Promise<GerarPdfOutput> {
  const { markdownResolvido, assinaturaPngBase64, metadados } = input;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Declaração de Prestação de Contas');
  pdfDoc.setAuthor('ZattarOS');
  pdfDoc.setSubject(`Protocolo ${metadados.protocolo}`);
  pdfDoc.setCreationDate(new Date());

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number): void => {
    if (y - needed < MARGIN + 60) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawWrappedText = (text: string, font: PDFFont, size: number): void => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    const maxWidth = PAGE_W - MARGIN * 2;
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(test, size);
      if (width > maxWidth && line) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, {
          x: MARGIN,
          y,
          size,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= LINE_HEIGHT;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(line, {
        x: MARGIN,
        y,
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_HEIGHT;
    }
  };

  const tree = unified().use(remarkParse).parse(markdownResolvido) as Root;

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const text = nodeToPlainText(node);
      const size = node.depth === 1 ? H1_SIZE : H2_SIZE;
      ensureSpace(size + 8);
      y -= 6;
      drawWrappedText(text, helveticaBold, size);
      y -= 4;
    } else if (node.type === 'paragraph') {
      drawWrappedText(nodeToPlainText(node), helvetica, BODY_SIZE);
      y -= 6;
    } else if (node.type === 'list') {
      for (const item of node.children) {
        drawWrappedText(`• ${nodeToPlainText(item)}`, helvetica, BODY_SIZE);
      }
      y -= 4;
    } else if (node.type === 'table') {
      for (const row of node.children) {
        const cells = row.children
          .map((c) => nodeToPlainText(c))
          .filter(Boolean)
          .join('  |  ');
        drawWrappedText(cells, helvetica, BODY_SIZE);
      }
      y -= 4;
    } else {
      drawWrappedText(nodeToPlainText(node), helvetica, BODY_SIZE);
    }
  }

  // Bloco de assinatura
  ensureSpace(110);
  y -= 16;
  try {
    const clean = assinaturaPngBase64.replace(/^data:image\/png;base64,/, '');
    const pngBytes = Buffer.from(clean, 'base64');
    const img = await pdfDoc.embedPng(pngBytes);
    const scale = Math.min(0.4, 180 / img.width);
    const dims = img.scale(scale);
    page.drawImage(img, {
      x: MARGIN,
      y: y - dims.height,
      width: dims.width,
      height: dims.height,
    });
    y -= dims.height + 6;
  } catch {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + 200, y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 10;
  }
  drawWrappedText(
    `${metadados.clienteNome} — CPF ${metadados.clienteCpf}`,
    helvetica,
    10,
  );

  // Rodapé de auditoria em todas as páginas
  const pages = pdfDoc.getPages();
  const footer = `Protocolo ${metadados.protocolo} · Assinado em ${metadados.dataAssinatura} · MP 2.200-2/2001 (${metadados.termosAceiteVersao})`;
  pages.forEach((p, idx) => {
    p.drawText(footer, {
      x: MARGIN,
      y: 30,
      size: 8,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    p.drawText(`Página ${idx + 1} de ${pages.length}`, {
      x: PAGE_W - MARGIN - 80,
      y: 30,
      size: 8,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
  const hashFinal = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, hashFinal };
}
