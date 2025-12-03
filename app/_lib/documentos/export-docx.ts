/**
 * Utilitário para exportação de documentos para DOCX
 * Usa biblioteca docx para geração confiável de arquivos Word
 */

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
import { saveAs } from 'file-saver';

interface PlateNode {
  type?: string;
  children?: PlateNode[];
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  level?: number;
  listStyleType?: string;
  indent?: number;
}

/**
 * Exporta o conteúdo do editor para um arquivo DOCX
 */
export async function exportToDocx(
  content: PlateNode[],
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
    const fileName = sanitizeFileName(titulo) + '.docx';
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erro ao exportar DOCX:', error);
    throw new Error('Falha ao exportar documento para DOCX');
  }
}

/**
 * Converte nós Plate.js para elementos DOCX
 */
function convertPlateToDocx(nodes: PlateNode[]): (Paragraph | Table)[] {
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
function convertNode(node: PlateNode): Paragraph | Table | (Paragraph | Table)[] | null {
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
function convertList(node: PlateNode): Paragraph[] {
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
function convertTable(node: PlateNode): Table {
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
          new TableCell({
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Extrai TextRuns de nós filhos
 */
function getTextRuns(children: PlateNode[], defaultOptions?: Partial<TextRunOptions>): TextRun[] {
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
function createTextRun(node: PlateNode, options?: Partial<TextRunOptions>): TextRun {
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
