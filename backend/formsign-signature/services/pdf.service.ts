import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { decodeDataUrlToBuffer } from './base64';

interface PdfPayload {
  cliente: {
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
  };
  acaoId?: number;
  templateId: string;
  preview?: boolean;
  assinaturaBase64?: string;
  fotoBase64?: string | null;
  metadata?: Record<string, string | number | undefined | null>;
}

/**
 * Gera um PDF simples (placeholder) com dados básicos e imagens de assinatura/foto.
 * Este gerador não aplica templates; serve como base mínima até integrar o pipeline completo.
 */
export async function generateSimplePdf(payload: PdfPayload): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  let cursorY = height - margin;

  const addLine = (text: string, bold = false, size = 12) => {
    cursorY -= size + 4;
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  addLine(payload.preview ? 'Preview de Assinatura Digital' : 'Documento Assinado Digitalmente', true, 16);
  addLine(`Cliente: ${payload.cliente.nome} (ID ${payload.cliente.id})`);
  if (payload.cliente.cpf) addLine(`CPF: ${payload.cliente.cpf}`);
  if (payload.cliente.cnpj) addLine(`CNPJ: ${payload.cliente.cnpj}`);
  if (payload.acaoId) addLine(`Ação ID: ${payload.acaoId}`);
  addLine(`Template: ${payload.templateId}`);
  addLine(`Data: ${new Date().toISOString()}`);
  addLine('');

  if (payload.metadata) {
    addLine('Metadados:', true);
    Object.entries(payload.metadata).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      addLine(`${key}: ${value}`);
    });
    addLine('');
  }

  // Assinatura
  if (payload.assinaturaBase64) {
    const { buffer, contentType } = decodeDataUrlToBuffer(payload.assinaturaBase64);
    let image;
    if (contentType.includes('png')) {
      image = await pdfDoc.embedPng(buffer);
    } else {
      image = await pdfDoc.embedJpg(buffer);
    }
    const pngDims = image.scale(0.5);
    page.drawText('Assinatura:', { x: margin, y: cursorY - 20, size: 12, font: fontBold });
    page.drawImage(image, {
      x: margin,
      y: cursorY - 150,
      width: Math.min(pngDims.width, width - margin * 2),
      height: Math.min(pngDims.height, 120),
    });
    cursorY -= 180;
  }

  // Foto
  if (payload.fotoBase64) {
    const { buffer, contentType } = decodeDataUrlToBuffer(payload.fotoBase64);
    let image;
    if (contentType.includes('png')) {
      image = await pdfDoc.embedPng(buffer);
    } else {
      image = await pdfDoc.embedJpg(buffer);
    }
    const dims = image.scale(0.4);
    page.drawText('Foto:', { x: margin, y: cursorY - 20, size: 12, font: fontBold });
    page.drawImage(image, {
      x: margin,
      y: cursorY - 200,
      width: Math.min(dims.width, width - margin * 2),
      height: Math.min(dims.height, 180),
    });
    cursorY -= 220;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
