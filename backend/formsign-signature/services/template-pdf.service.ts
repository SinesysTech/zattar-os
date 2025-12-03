import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';
import { decodeDataUrlToBuffer } from './base64';
import type { TemplateCampo, TipoVariavel, EstiloCampo } from '@/backend/types/template.types';
import type { ClienteBasico, FormularioBasico, SegmentoBasico, TemplateBasico } from './data.service';

interface PdfDataContext {
  cliente: ClienteBasico;
  segmento: SegmentoBasico;
  formulario: FormularioBasico;
  protocolo: string;
  ip?: string | null;
  user_agent?: string | null;
}

interface TemplateWithCampos extends TemplateBasico {
  campos_parsed: TemplateCampo[];
}

const CANVAS = { width: 540, height: 765 };

function convertX(x: number, pageWidth: number) {
  return (x / CANVAS.width) * pageWidth;
}

function convertWidth(width: number, pageWidth: number) {
  return (width / CANVAS.width) * pageWidth;
}

function convertHeight(height: number, pageHeight: number) {
  return (height / CANVAS.height) * pageHeight;
}

function convertY(y: number, height: number, pageHeight: number) {
  const scaledHeight = convertHeight(height, pageHeight);
  const scaledY = (y / CANVAS.height) * pageHeight;
  return pageHeight - scaledY - scaledHeight;
}

function parseCampos(template: TemplateBasico): TemplateWithCampos {
  let campos_parsed: TemplateCampo[] = [];
  try {
    campos_parsed = JSON.parse(template.campos || '[]');
  } catch {
    campos_parsed = [];
  }
  return { ...template, campos_parsed };
}

function resolveVariable(variable: TipoVariavel | undefined, ctx: PdfDataContext, extras: Record<string, unknown>) {
  if (!variable) return '';
  const map: Record<string, unknown> = {
    'cliente.nome_completo': ctx.cliente.nome,
    'cliente.cpf': ctx.cliente.cpf,
    'cliente.cnpj': ctx.cliente.cnpj,
    'segmento.id': ctx.segmento.id,
    'segmento.nome': ctx.segmento.nome,
    'segmento.slug': ctx.segmento.slug,
    'segmento.descricao': (ctx.segmento as SegmentoBasico & { descricao?: string }).descricao,
    'sistema.protocolo': ctx.protocolo,
    'sistema.ip_cliente': ctx.ip,
    'sistema.user_agent': ctx.user_agent,
    'formulario.nome': ctx.formulario.nome,
    'formulario.slug': ctx.formulario.slug,
    'formulario.id': ctx.formulario.id,
  };
  const value = map[variable] ?? extras[variable];
  return value === undefined || value === null ? '' : String(value);
}

function formatValue(tipo: string, raw: string) {
  const val = raw ?? '';
  switch (tipo) {
    case 'cpf': {
      const digits = val.replace(/\D/g, '');
      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      return val;
    }
    case 'cnpj': {
      const digits = val.replace(/\D/g, '');
      if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return val;
    }
    case 'data': {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString('pt-BR');
    }
    default:
      return val;
  }
}

async function loadTemplatePdf(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar template PDF: ${res.status} ${res.statusText}`);
  }
  const arr = new Uint8Array(await res.arrayBuffer());
  return arr;
}

function buildStyle(style?: EstiloCampo) {
  return {
    fontName: style?.fonte || StandardFonts.Helvetica,
    fontSize: style?.tamanho_fonte || 12,
    color: style?.cor ? hexToRgb(style.cor) : rgb(0, 0, 0),
    align: style?.alinhamento || 'left',
    bold: style?.negrito || false,
    italic: style?.italico || false,
  };
}

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const num = parseInt(sanitized, 16);
  if (Number.isNaN(num)) return rgb(0, 0, 0);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r / 255, g / 255, b / 255);
}

async function embedText(page: { drawText: (text: string, options: { x: number; y: number; size: number; font: PDFFont }) => void }, font: PDFFont, text: string, x: number, y: number, maxWidth: number, size: number) {
  const chunks = wrapText(font, text, size, maxWidth);
  let currentY = y;
  chunks.forEach((line) => {
    page.drawText(line, { x, y: currentY, size, font });
    currentY -= size + 2;
  });
}

function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth || !current) {
      current = tentative;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function renderRich(template: string, resolver: (variable: string) => string) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, v) => resolver(v));
}

export async function generatePdfFromTemplate(
  template: TemplateBasico,
  ctx: PdfDataContext,
  extras: Record<string, unknown>,
  images?: { assinaturaBase64?: string; fotoBase64?: string }
): Promise<Buffer> {
  const tpl = parseCampos(template);
  const pdfBytes = await loadTemplatePdf(template.arquivo_original);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const campo of tpl.campos_parsed) {
    const pageIndex = Math.max((campo.posicao?.pagina ?? 1) - 1, 0);
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pos = campo.posicao;
    if (!pos) continue;

    const x = convertX(pos.x, pageWidth);
    const y = convertY(pos.y, pos.height, pageHeight);
    const w = convertWidth(pos.width, pageWidth);
    const h = convertHeight(pos.height, pageHeight);

    const style = buildStyle(campo.estilo);
    const font = style.bold ? helveticaBold : helvetica;

    if (campo.tipo === 'assinatura' && images?.assinaturaBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(images.assinaturaBase64);
      const image = contentType.includes('png') ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    if (campo.tipo === 'foto' && images?.fotoBase64) {
      const { buffer, contentType } = decodeDataUrlToBuffer(images.fotoBase64);
      const image = contentType.includes('png') ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    const resolve = (v: string) => resolveVariable(v as TipoVariavel, ctx, extras);
    let value = '';
    if (campo.tipo === 'texto_composto' && campo.conteudo_composto?.template) {
      value = renderRich(campo.conteudo_composto.template, resolve);
    } else {
      value = resolveVariable(campo.variavel, ctx, extras);
    }
    if (!value && campo.valor_padrao) value = campo.valor_padrao;
    value = formatValue(campo.tipo, value);

    await embedText(page, font, value, x, y + h - style.fontSize, w, style.fontSize);
  }

  const result = await pdfDoc.save();
  return Buffer.from(result);
}
