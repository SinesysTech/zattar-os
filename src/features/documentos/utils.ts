/**
 * Utilitários para a feature de documentos
 * Inclui funções de exportação (PDF, DOCX) e formatação de conteúdo Plate.js
 */

import html2canvas from 'html2canvas-pro';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
  ExternalHyperlink,
} from 'docx';
import type { Value } from './types'; // Importando Value do types.ts

// ============================================================================ 
// UTILS DE FORMATAÇÃO E CONVERSÃO
// ============================================================================ 

/**
 * Sanitiza o nome do arquivo removendo caracteres inválidos
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100)
    || 'documento';
}

/**
 * Extrai texto puro do conteúdo Plate.js (recursivamente)
 */
export function extractTextFromPlate(nodes: Value): string {
  if (!Array.isArray(nodes)) {
    return '';
  }

  let text = '';
  for (const node of nodes) {
    if (node.text) {
      text += node.text;
    } else if (node.children) {
      text += extractTextFromPlate(node.children);
    }
  }
  return text;
}

/**
 * Formata o conteúdo Plate.js para uma representação de texto mais legível,
 * preservando quebras de linha e estrutura básica.
 */
export function formatPlateContent(nodes: Value): string {
  if (!Array.isArray(nodes)) {
    return '';
  }

  let formattedText = '';
  for (const node of nodes) {
    if (node.type && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.type)) {
      formattedText += '\n' + extractTextFromPlate([node]).toUpperCase() + '\n';
    } else if (node.type === 'blockquote') {
      formattedText += '\n> ' + extractTextFromPlate([node]) + '\n';
    } else if (node.type === 'code_block') {
      formattedText += '\n```\n' + extractTextFromPlate([node]) + '\n```\n';
    } else if (node.type === 'ul' || node.type === 'ol') {
      formattedText += '\n' + formatList(node.children || [], node.type === 'ol') + '\n';
    } else if (node.type === 'p') {
      formattedText += '\n' + extractTextFromPlate([node]) + '\n';
    } else if (node.children) {
      formattedText += formatPlateContent(node.children);
    }
  }
  return formattedText.trim();
}

function formatList(nodes: Value, ordered: boolean, level: number = 0): string {
  let listText = '';
  nodes.forEach((node, index) => {
    if (node.type === 'li' || node.type === 'lic') {
      const prefix = '  '.repeat(level) + (ordered ? `${index + 1}. ` : '- ');
      listText += prefix + extractTextFromPlate([node]) + '\n';
      if (node.children) {
        // Check for nested lists within list item children
        const nestedLists = node.children.filter((child: any) => child.type === 'ul' || child.type === 'ol');
        if (nestedLists.length > 0) {
          nestedLists.forEach((nestedList: any) => {
            listText += formatList(nestedList.children || [], nestedList.type === 'ol', level + 1);
          });
        }
      }
    }
  });
  return listText;
}

// ============================================================================ 
// EXPORTAÇÃO PARA PDF
// ============================================================================ 

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
    const fileName = sanitizeFilename(titulo) + '.pdf';
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
  content: Value,
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
    const text = extractTextFromPlate(content);
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
    const fileName = sanitizeFilename(titulo) + '.pdf';
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao exportar documento para PDF');
  }
}

// ============================================================================ 
// EXPORTAÇÃO PARA DOCX
// ============================================================================ 

/**
 * Exporta o conteúdo do editor para um arquivo DOCX
 */
export async function exportToDocx(
  content: Value,
  titulo: string = 'documento'
): Promise<void> {
  try {
    // Converter conteúdo Plate para elementos DOCX
    const children = convertPlateToDocx(content);

    // Criar documento
    const doc = new Document({
      creator: 'Sinesys',
      title: titulo,
      description: 'Documento exportado do Sinesys',
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          children,
        },
      ],
    });

    // Gerar blob e baixar
    const blob = await Packer.toBlob(doc);
    const fileName = sanitizeFilename(titulo) + '.docx';
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erro ao exportar DOCX:', error);
    throw new Error('Falha ao exportar documento para DOCX');
  }
}

/**
 * Converte nós Plate.js para elementos DOCX
 */
function convertPlateToDocx(nodes: Value): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    const element = convertNode(node);
    if (element) {
      if (Array.isArray(element)) {
        elements.push(...element);
      } else {
        elements.push(element);
      }
    }
  }

  return elements;
}

/**
 * Converte um nó Plate individual para elemento DOCX
 */
function convertNode(node: any): Paragraph | Table | (Paragraph | Table)[] | null {
  if (!node) return null;

  // Texto simples
  if (node.text !== undefined) {
    return new Paragraph({
      children: [createTextRun(node)],
    });
  }

  const type = node.type || 'p';

  switch (type) {
    case 'h1':
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'h2':
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'h3':
      return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'h4':
      return new Paragraph({
        heading: HeadingLevel.HEADING_4,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'h5':
      return new Paragraph({
        heading: HeadingLevel.HEADING_5,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'h6':
      return new Paragraph({
        heading: HeadingLevel.HEADING_6,
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
      });

    case 'blockquote':
      return new Paragraph({
        children: getTextRuns(node.children || []),
        indent: { left: convertInchesToTwip(0.5) },
        style: 'Quote',
      });

    case 'code_block':
      return new Paragraph({
        children: getTextRuns(node.children || [], { font: 'Courier New' }),
        spacing: { before: 100, after: 100 },
      });

    case 'ul':
    case 'ol':
      return convertList(node);

    case 'li':
      return new Paragraph({
        children: getTextRuns(node.children || []),
        bullet: { level: 0 },
      });

    case 'table':
      return convertTable(node);

    case 'a':
      if (node.url) {
        return new Paragraph({
          children: [
            new ExternalHyperlink({
              link: node.url,
              children: getTextRuns(node.children || [], { color: '0000FF', underline: {} }),
            }),
          ],
        });
      }
      return new Paragraph({
        children: getTextRuns(node.children || []),
      });

    case 'p':
    default:
      return new Paragraph({
        children: getTextRuns(node.children || []),
        alignment: getAlignment(node.align),
        indent: node.indent ? { left: convertInchesToTwip(node.indent * 0.5) } : undefined,
      });
  }
}

/**
 * Converte lista Plate para elementos DOCX
 */
function convertList(node: any): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'li' || child.type === 'lic') {
        paragraphs.push(
          new Paragraph({
            children: getTextRuns(child.children || []),
            bullet: { level: 0 },
          })
        );
      } else if (child.children) {
        paragraphs.push(
          new Paragraph({
            children: getTextRuns(child.children),
            bullet: { level: 0 },
          })
        );
      }
    }
  }

  return paragraphs;
}

/**
 * Converte tabela Plate para Table DOCX
 */
function convertTable(node: any): Table {
  const rows: TableRow[] = [];

  if (node.children) {
    for (const row of node.children) {
      if (row.type === 'tr' && row.children) {
        const cells: TableCell[] = [];
        for (const cell of row.children) {
          if ((cell.type === 'td' || cell.type === 'th') && cell.children) {
            cells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: getTextRuns(cell.children),
                  }),
                ],
                width: { size: 100 / row.children.length, type: WidthType.PERCENTAGE },
              })
            );
          }
        }
        if (cells.length > 0) {
          rows.push(new TableRow({ children: cells }));
        }
      }
    }
  }

  return new Table({
    rows: rows.length > 0 ? rows : [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [] })] }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Extrai TextRuns de nós filhos
 */
function getTextRuns(children: any[], defaultOptions?: Partial<TextRunOptions>): TextRun[] {
  const runs: TextRun[] = [];

  for (const child of children) {
    if (child.text !== undefined) {
      runs.push(createTextRun(child, defaultOptions));
    } else if (child.children) {
      runs.push(...getTextRuns(child.children, defaultOptions));
    }
  }

  return runs;
}

interface TextRunOptions {
  font?: string;
  color?: string;
  underline?: object;
}

/**
 * Cria um TextRun a partir de um nó de texto
 */
function createTextRun(node: any, options?: Partial<TextRunOptions>): TextRun {
  return new TextRun({
    text: node.text || '',
    bold: node.bold,
    italics: node.italic,
    underline: node.underline ? {} : options?.underline,
    strike: node.strikethrough,
    font: node.code ? 'Courier New' : options?.font,
    color: options?.color,
  });
}

/**
 * Converte alinhamento Plate para AlignmentType DOCX
 */
function getAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    case 'left':
    default:
      return undefined;
  }
}
