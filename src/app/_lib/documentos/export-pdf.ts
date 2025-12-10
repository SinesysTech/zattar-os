/**
 * Utilitário para exportação de documentos para PDF
 * Usa html2canvas-pro para captura e pdf-lib para geração
 */

import html2canvas from 'html2canvas-pro';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

type PdfNode = string | { text?: string; stack?: PdfNode[]; columns?: PdfNode[]; children?: PdfNode[] };

/**
 * Exporta o conteúdo do editor para um arquivo PDF
 * Captura a área do editor como imagem e converte para PDF
 */
export async function exportToPdf(
  editorElement: HTMLElement | null,
  titulo: string = 'documento'
): Promise<void> {
  if (!editorElement) {
    throw new Error('Elemento do editor não encontrado');
  }

  try {
    // Capturar o conteúdo como canvas
    const canvas = await html2canvas(editorElement, {
      scale: 2, // Maior qualidade
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Criar documento PDF
    const pdfDoc = await PDFDocument.create();

    // Converter canvas para PNG
    const imgData = canvas.toDataURL('image/png');
    const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(imgBytes);

    // Calcular dimensões para A4 (595 x 842 pontos)
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Calcular escala para ajustar à largura da página
    const scale = contentWidth / pngImage.width;
    const scaledHeight = pngImage.height * scale;

    // Dividir em páginas se necessário
    let remainingHeight = scaledHeight;

    while (remainingHeight > 0) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const contentHeight = Math.min(remainingHeight, pageHeight - (margin * 2));

      page.drawImage(pngImage, {
        x: margin,
        y: pageHeight - margin - contentHeight,
        width: contentWidth,
        height: contentHeight,
      });

      remainingHeight -= contentHeight;
    }

    // Gerar bytes do PDF
    const pdfBytes = await pdfDoc.save();

    // Criar blob e baixar (conversão explícita para ArrayBuffer)
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const fileName = sanitizeFileName(titulo) + '.pdf';
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao exportar documento para PDF');
  }
}

/**
 * Exporta o conteúdo como PDF a partir de texto puro
 * Alternativa quando a captura de elemento não está disponível
 */
export async function exportTextToPdf(
  content: PdfNode[],
  titulo: string = 'documento'
): Promise<void> {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const maxWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Adicionar título
    page.drawText(titulo, {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Extrair texto do conteúdo Plate
    const text = extractTextFromContent(content);
    const lines = text.split('\n');

    for (const line of lines) {
      // Quebrar linha se necessário
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width > maxWidth && currentLine) {
          // Nova página se necessário
          if (yPosition < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }

          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Desenhar linha restante
      if (currentLine) {
        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }

      // Espaço extra para parágrafos
      yPosition -= lineHeight * 0.5;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const fileName = sanitizeFileName(titulo) + '.pdf';
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao exportar documento para PDF');
  }
}

/**
 * Extrai texto puro do conteúdo Plate
 */
function extractTextFromContent(nodes: PdfNode[]): string {
  const lines: string[] = [];

  function processNode(node: PdfNode): string {
    if (typeof node === 'string') return node;
    if (node.text !== undefined) return node.text;
    if (node.children) {
      return node.children.map(processNode).join('');
    }
    return '';
  }

  for (const node of nodes) {
    const text = processNode(node);
    if (text) lines.push(text);
  }

  return lines.join('\n\n');
}

/**
 * Sanitiza o nome do arquivo removendo caracteres inválidos
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100)
    || 'documento';
}
