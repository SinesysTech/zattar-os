/**
 * Utilitários de exportação para Orçamentos
 * Suporta exportação em CSV e PDF
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type {
  OrcamentoComDetalhes,
  AnaliseOrcamentaria,
  ResumoOrcamentario,
  EvolucaoMensal,
  ProjecaoItem,
} from '@/backend/types/financeiro/orcamento.types';
import type {
  RelatorioCompleto,
  RelatorioComparativo,
  RelatorioExecutivo,
  AnaliseParaUI,
} from '@/backend/financeiro/orcamento/services/orcamento/relatorios-orcamento.service';

// ============================================================================
// Tipos para API Response
// ============================================================================

/**
 * Estrutura do relatório retornado pela API (formato UI)
 */
export interface RelatorioParaExportacao {
  orcamento: OrcamentoComDetalhes;
  analise: AnaliseParaUI | null;
  resumo?: ResumoOrcamentario | null;
  alertas?: Array<{ mensagem: string; severidade: string }>;
  evolucao?: EvolucaoMensal[];
  projecao?: ProjecaoItem[] | null;
  geradoEm: string;
}

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100) || 'orcamento';
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  em_execucao: 'Em Execução',
  encerrado: 'Encerrado',
  dentro_orcamento: 'Dentro do Orçamento',
  atencao: 'Atenção',
  estourado: 'Estourado',
};

const PERIODO_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Escapa valor para CSV (adiciona aspas se necessário)
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Gera CSV a partir de dados tabulares
 */
function gerarCSV(cabecalhos: string[], linhas: (string | number | null)[][]): string {
  const header = cabecalhos.map(escapeCSV).join(',');
  const rows = linhas.map(linha => linha.map(escapeCSV).join(','));
  return [header, ...rows].join('\n');
}

/**
 * Exporta orçamento básico para CSV
 */
export function exportarOrcamentoCSV(orcamento: OrcamentoComDetalhes): void {
  const cabecalhos = [
    'Conta Contábil',
    'Código',
    'Centro de Custo',
    'Mês',
    'Valor Orçado',
    'Observações',
  ];

  const linhas = orcamento.itens.map(item => [
    item.contaContabil?.nome || '',
    item.contaContabil?.codigo || '',
    item.centroCusto?.nome || '-',
    item.mes ? String(item.mes) : 'Todos',
    item.valorOrcado,
    item.observacoes || '',
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName(`${orcamento.nome}_${orcamento.ano}`) + '.csv');
}

/**
 * Exporta análise orçamentária para CSV
 */
export function exportarAnaliseCSV(
  orcamento: OrcamentoComDetalhes,
  analise: AnaliseOrcamentaria
): void {
  const cabecalhos = [
    'Conta Contábil',
    'Código',
    'Tipo',
    'Centro de Custo',
    'Mês',
    'Valor Orçado',
    'Valor Realizado',
    'Variação (R$)',
    'Variação (%)',
    'Status',
  ];

  const linhas = analise.itensPorConta.map(item => [
    item.contaContabilNome,
    item.contaContabilCodigo,
    item.tipoConta,
    item.centroCustoNome || '-',
    item.mes ? String(item.mes) : 'Todos',
    item.valorOrcado,
    item.valorRealizado,
    item.variacao,
    item.variacaoPercentual,
    STATUS_LABELS[item.status] || item.status,
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName(`analise_${orcamento.nome}_${orcamento.ano}`) + '.csv');
}

/**
 * Exporta comparativo de orçamentos para CSV
 */
export function exportarComparativoCSV(comparativo: RelatorioComparativo): void {
  const cabecalhos = [
    'Nome',
    'Ano',
    'Período',
    'Total Orçado',
    'Total Realizado',
    'Variação (R$)',
    '% Realização',
  ];

  const linhas = comparativo.orcamentos.map(o => {
    return [
      o.orcamentoNome,
      o.ano,
      PERIODO_LABELS[o.periodo] || o.periodo,
      o.totalOrcado,
      o.totalRealizado,
      o.variacao,
      o.percentualRealizacao,
    ];
  });

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName('comparativo_orcamentos') + '.csv');
}

/**
 * Exporta evolução mensal para CSV
 */
export function exportarEvolucaoCSV(
  orcamento: OrcamentoComDetalhes,
  evolucao: EvolucaoMensal[]
): void {
  const cabecalhos = [
    'Mês',
    'Orçado Mês',
    'Realizado Mês',
    'Variação Mês (R$)',
    'Variação Mês (%)',
    'Orçado Acumulado',
    'Realizado Acumulado',
    'Variação Acumulada (R$)',
    'Variação Acumulada (%)',
  ];

  const linhas = evolucao.map(item => [
    item.mesNome || `Mês ${item.mes}`,
    item.valorOrcado,
    item.valorRealizado,
    item.variacao,
    item.variacaoPercentual,
    item.acumuladoOrcado,
    item.acumuladoRealizado,
    item.acumuladoRealizado - item.acumuladoOrcado,
    item.acumuladoOrcado > 0
      ? (((item.acumuladoRealizado - item.acumuladoOrcado) / item.acumuladoOrcado) * 100)
      : 0,
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName(`evolucao_${orcamento.nome}_${orcamento.ano}`) + '.csv');
}

// ============================================================================
// PDF Export
// ============================================================================

interface PDFStyle {
  fontSize: number;
  lineHeight: number;
  margin: number;
}

const PDF_CONFIG: PDFStyle = {
  fontSize: 10,
  lineHeight: 14,
  margin: 50,
};

/**
 * Exporta relatório completo para PDF
 * Aceita tanto RelatorioCompleto (do serviço) quanto RelatorioParaExportacao (da API)
 */
export async function exportarRelatorioPDF(relatorio: RelatorioCompleto | RelatorioParaExportacao): Promise<void> {
  // Normalizar a estrutura para o formato esperado internamente
  const resumoNormalizado = relatorio.resumo || (relatorio.analise && 'resumo' in relatorio.analise ? relatorio.analise.resumo : null);
  const alertasNormalizados: Array<{ mensagem: string; severidade: string }> =
    relatorio.alertas ||
    (relatorio.analise && 'alertas' in relatorio.analise ? relatorio.analise.alertas : []) ||
    [];

  // Normalizar itens de análise
  let itensAnalise: Array<{
    contaContabilNome: string;
    contaContabilCodigo?: string;
    valorOrcado: number;
    valorRealizado: number;
    variacao: number;
    variacaoPercentual: number;
    status: string;
  }> = [];

  if (relatorio.analise) {
    if ('itensPorConta' in relatorio.analise && relatorio.analise.itensPorConta) {
      // Formato antigo (AnaliseOrcamentaria)
      itensAnalise = relatorio.analise.itensPorConta.map((item) => ({
        contaContabilNome: item.contaContabilNome,
        contaContabilCodigo: item.contaContabilCodigo,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacao: item.variacao,
        variacaoPercentual: item.variacaoPercentual,
        status: item.status,
      }));
    } else if ('itens' in relatorio.analise && relatorio.analise.itens) {
      // Formato novo (AnaliseParaUI)
      itensAnalise = relatorio.analise.itens.map((item) => ({
        contaContabilNome: item.contaContabil?.nome || '',
        contaContabilCodigo: item.contaContabil?.codigo,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacao: item.variacao,
        variacaoPercentual: item.variacaoPercentual,
        status: item.status,
      }));
    }
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const { margin, fontSize, lineHeight } = PDF_CONFIG;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Helper: Nova página se necessário
  const checkNewPage = (requiredSpace: number = lineHeight * 3) => {
    if (y < margin + requiredSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // Helper: Desenhar texto
  const drawText = (text: string, options: {
    size?: number;
    font?: typeof font;
    color?: ReturnType<typeof rgb>;
    x?: number;
    indent?: number;
  } = {}) => {
    checkNewPage();
    const {
      size = fontSize,
      font: textFont = font,
      color = rgb(0, 0, 0),
      x = margin,
      indent = 0,
    } = options;

    // Quebra de linha automática
    const words = text.split(' ');
    let currentLine = '';
    const lines: string[] = [];
    const maxWidth = contentWidth - indent;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const width = textFont.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (const line of lines) {
      checkNewPage();
      page.drawText(line, {
        x: x + indent,
        y,
        size,
        font: textFont,
        color,
      });
      y -= size * 1.5;
    }
  };

  // Helper: Linha horizontal
  const drawHorizontalLine = () => {
    checkNewPage();
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= lineHeight;
  };

  // ==================== CABEÇALHO ====================
  drawText('RELATÓRIO DE ORÇAMENTO', { size: 18, font: boldFont });
  y -= 5;
  drawText(relatorio.orcamento.nome, { size: 14, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
  y -= 10;

  // Informações básicas
  const statusLabel = STATUS_LABELS[relatorio.orcamento.status] || relatorio.orcamento.status;
  const periodoLabel = PERIODO_LABELS[relatorio.orcamento.periodo] || relatorio.orcamento.periodo;

  drawText(`Ano: ${relatorio.orcamento.ano} | Período: ${periodoLabel} | Status: ${statusLabel}`);
  drawText(`Gerado em: ${formatarData(relatorio.geradoEm)}`);

  y -= 10;
  drawHorizontalLine();

  // ==================== RESUMO FINANCEIRO ====================
  if (resumoNormalizado) {
    drawText('RESUMO FINANCEIRO', { size: 14, font: boldFont });
    y -= 5;

    const resumo = resumoNormalizado;
    drawText(`Total Orçado: ${formatarValor(resumo.totalOrcado)}`);
    drawText(`Total Realizado: ${formatarValor(resumo.totalRealizado)}`);

    const variacaoColor = resumo.variacao > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0);
    drawText(
      `Variação: ${formatarValor(resumo.variacao)} (${formatarPercentual(resumo.variacaoPercentual)})`,
      { color: variacaoColor }
    );
    drawText(`Percentual de Realização: ${resumo.percentualRealizacao.toFixed(1)}%`);

    y -= 10;
    drawHorizontalLine();
  }

  // ==================== ALERTAS ====================
  if (alertasNormalizados.length > 0) {
    drawText('ALERTAS DE DESVIO', { size: 14, font: boldFont });
    y -= 5;

    for (const alerta of alertasNormalizados.slice(0, 10)) {
      // Mapear severidades: error/critica -> vermelho, warning/media/alta -> amarelo
      const alertaColor =
        alerta.severidade === 'error' || alerta.severidade === 'critica'
          ? rgb(0.8, 0, 0)
          : alerta.severidade === 'warning' || alerta.severidade === 'media' || alerta.severidade === 'alta'
            ? rgb(0.8, 0.6, 0)
            : rgb(0.3, 0.3, 0.3);

      drawText(`• ${alerta.mensagem}`, { color: alertaColor, indent: 10 });
    }

    if (alertasNormalizados.length > 10) {
      drawText(`... e mais ${alertasNormalizados.length - 10} alertas`, {
        color: rgb(0.5, 0.5, 0.5),
        indent: 10,
      });
    }

    y -= 10;
    drawHorizontalLine();
  }

  // ==================== ITENS DO ORÇAMENTO ====================
  if (itensAnalise.length > 0) {
    drawText('DETALHAMENTO POR CONTA', { size: 14, font: boldFont });
    y -= 10;

    // Cabeçalho da tabela
    const colX = [margin, margin + 180, margin + 250, margin + 330, margin + 410, margin + 475];

    checkNewPage(lineHeight * 2);
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: contentWidth,
      height: lineHeight + 4,
      color: rgb(0.95, 0.95, 0.95),
    });

    const headerTexts = ['Conta Contábil', 'Orçado', 'Realizado', 'Variação', '%', 'Status'];
    headerTexts.forEach((text, i) => {
      page.drawText(text, {
        x: colX[i],
        y,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
    y -= lineHeight + 6;

    // Linhas da tabela (limite de 30 itens no PDF)
    const itensLimitados = itensAnalise.slice(0, 30);
    for (const item of itensLimitados) {
      checkNewPage(lineHeight + 5);

      // Truncar nome da conta se muito longo
      const nomeContaTruncado = item.contaContabilNome.length > 35
        ? item.contaContabilNome.slice(0, 32) + '...'
        : item.contaContabilNome;

      page.drawText(nomeContaTruncado, {
        x: colX[0],
        y,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(formatarValor(item.valorOrcado).replace('R$', ''), {
        x: colX[1],
        y,
        size: 8,
        font,
      });

      page.drawText(formatarValor(item.valorRealizado).replace('R$', ''), {
        x: colX[2],
        y,
        size: 8,
        font,
      });

      const varColor = item.variacao > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0);
      page.drawText(formatarValor(item.variacao).replace('R$', ''), {
        x: colX[3],
        y,
        size: 8,
        font,
        color: varColor,
      });

      page.drawText(`${item.variacaoPercentual.toFixed(1)}%`, {
        x: colX[4],
        y,
        size: 8,
        font,
        color: varColor,
      });

      // Mapear status: dentro/dentro_orcamento -> verde, atencao -> amarelo, critico/estourado -> vermelho
      const statusColor =
        item.status === 'critico' || item.status === 'estourado'
          ? rgb(0.8, 0, 0)
          : item.status === 'atencao'
            ? rgb(0.8, 0.6, 0)
            : rgb(0, 0.6, 0);
      const statusLabel =
        item.status === 'dentro' || item.status === 'dentro_orcamento'
          ? 'Dentro'
          : item.status === 'atencao'
            ? 'Atenção'
            : 'Crítico';
      page.drawText(statusLabel, {
        x: colX[5],
        y,
        size: 7,
        font,
        color: statusColor,
      });

      y -= lineHeight;
    }

    if (itensAnalise.length > 30) {
      y -= 5;
      drawText(
        `... e mais ${itensAnalise.length - 30} itens (exporte em CSV para lista completa)`,
        { color: rgb(0.5, 0.5, 0.5) }
      );
    }
  }

  // ==================== RODAPÉ ====================
  const totalPages = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const currentPage = pages[i];
    currentPage.drawText(`Página ${i + 1} de ${totalPages}`, {
      x: pageWidth - margin - 60,
      y: 20,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    currentPage.drawText('Sistema Sinesys - Gestão de Orçamentos', {
      x: margin,
      y: 20,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Salvar PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const fileName = sanitizeFileName(`relatorio_${relatorio.orcamento.nome}_${relatorio.orcamento.ano}`) + '.pdf';
  saveAs(blob, fileName);
}

/**
 * Exporta relatório executivo para PDF
 */
export async function exportarRelatorioExecutivoPDF(relatorio: RelatorioExecutivo): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const fontSize = 10;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Título
  page.drawText('RELATÓRIO EXECUTIVO', {
    x: margin,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  page.drawText(`Período: ${relatorio.periodo}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 15;

  page.drawText(`Gerado em: ${formatarData(relatorio.geradoEm)}`, {
    x: margin,
    y,
    size: fontSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 30;

  // Situação Geral
  const situacaoColor = relatorio.situacaoGeral === 'positiva'
    ? rgb(0, 0.6, 0)
    : relatorio.situacaoGeral === 'negativa'
      ? rgb(0.8, 0, 0)
      : rgb(0.8, 0.6, 0);

  const situacaoLabel = relatorio.situacaoGeral === 'positiva'
    ? 'POSITIVA (Economia)'
    : relatorio.situacaoGeral === 'negativa'
      ? 'NEGATIVA (Estouro)'
      : 'NEUTRA';

  page.drawText('Situação Geral:', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  });

  page.drawText(situacaoLabel, {
    x: margin + 100,
    y,
    size: 12,
    font: boldFont,
    color: situacaoColor,
  });
  y -= 30;

  // Resumo Financeiro
  page.drawText('RESUMO FINANCEIRO', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= 20;

  const resumo = relatorio.resumoFinanceiro;
  const items = [
    { label: 'Total Orçado:', value: formatarValor(resumo.totalOrcado) },
    { label: 'Total Realizado:', value: formatarValor(resumo.totalRealizado) },
    {
      label: 'Economia/Estouro:',
      value: formatarValor(resumo.economia),
      color: resumo.economia >= 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),
    },
    { label: '% Realização:', value: `${resumo.percentualRealizacao.toFixed(1)}%` },
  ];

  for (const item of items) {
    page.drawText(item.label, {
      x: margin + 10,
      y,
      size: fontSize,
      font,
    });
    page.drawText(item.value, {
      x: margin + 130,
      y,
      size: fontSize,
      font: boldFont,
      color: item.color || rgb(0, 0, 0),
    });
    y -= 16;
  }
  y -= 15;

  // Principais Desvios
  if (relatorio.principaisDesvios.length > 0) {
    page.drawText('PRINCIPAIS DESVIOS', {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= 20;

    for (const desvio of relatorio.principaisDesvios) {
      const desvioColor = desvio.variacao > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0);
      page.drawText(`• ${desvio.conta}`, {
        x: margin + 10,
        y,
        size: fontSize,
        font,
      });
      y -= 14;

      page.drawText(
        `  Orç: ${formatarValor(desvio.valorOrcado)} → Real: ${formatarValor(desvio.valorRealizado)} (${formatarPercentual(desvio.variacao)})`,
        {
          x: margin + 20,
          y,
          size: 9,
          font,
          color: desvioColor,
        }
      );
      y -= 16;
    }
    y -= 10;
  }

  // Recomendações
  if (relatorio.recomendacoes.length > 0) {
    page.drawText('RECOMENDAÇÕES', {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= 20;

    for (const rec of relatorio.recomendacoes) {
      page.drawText(`• ${rec}`, {
        x: margin + 10,
        y,
        size: fontSize,
        font,
      });
      y -= 16;
    }
  }

  // Rodapé
  page.drawText('Sistema Sinesys - Gestão de Orçamentos', {
    x: margin,
    y: 20,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Salvar PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const fileName = sanitizeFileName(`relatorio_executivo_${relatorio.periodo}`) + '.pdf';
  saveAs(blob, fileName);
}

/**
 * Exporta comparativo para PDF
 */
export async function exportarComparativoPDF(comparativo: RelatorioComparativo): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const fontSize = 10;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Título
  page.drawText('COMPARATIVO DE ORÇAMENTOS', {
    x: margin,
    y,
    size: 18,
    font: boldFont,
  });
  y -= 25;

  page.drawText(`Gerado em: ${formatarData(comparativo.geradoEm)}`, {
    x: margin,
    y,
    size: fontSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 30;

  // Resumo Geral
  page.drawText('RESUMO GERAL', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= 20;

  const resumoGeral = comparativo.resumoGeral;
  page.drawText(`Total Orçado (todos): ${formatarValor(resumoGeral.totalOrcadoGeral)}`, {
    x: margin + 10,
    y,
    size: fontSize,
    font,
  });
  y -= 16;

  page.drawText(`Total Realizado (todos): ${formatarValor(resumoGeral.totalRealizadoGeral)}`, {
    x: margin + 10,
    y,
    size: fontSize,
    font,
  });
  y -= 16;

  page.drawText(`Variação Média: ${formatarPercentual(resumoGeral.variacaoMediaPercentual)}`, {
    x: margin + 10,
    y,
    size: fontSize,
    font,
  });
  y -= 25;

  // Melhor e Pior Performance
  if (resumoGeral.melhorPerformance) {
    page.drawText(`Melhor Performance: ${resumoGeral.melhorPerformance.orcamentoNome}`, {
      x: margin + 10,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0.6, 0),
    });
    y -= 16;
  }

  if (resumoGeral.piorPerformance) {
    page.drawText(`Pior Performance: ${resumoGeral.piorPerformance.orcamentoNome}`, {
      x: margin + 10,
      y,
      size: fontSize,
      font,
      color: rgb(0.8, 0, 0),
    });
    y -= 16;
  }
  y -= 20;

  // Tabela de Orçamentos
  page.drawText('ORÇAMENTOS COMPARADOS', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= 20;

  // Cabeçalho
  const colX = [margin, margin + 120, margin + 160, margin + 230, margin + 310, margin + 390];
  const headers = ['Nome', 'Ano', 'Orçado', 'Realizado', 'Variação', '% Real.'];

  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: 16,
    color: rgb(0.95, 0.95, 0.95),
  });

  headers.forEach((header, i) => {
    page.drawText(header, {
      x: colX[i],
      y,
      size: 9,
      font: boldFont,
    });
  });
  y -= 20;

  // Dados
  for (const orc of comparativo.orcamentos) {
    const varColor = orc.variacao > 0 ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0);
    const variacaoPercentual = orc.totalOrcado > 0
      ? ((orc.variacao / orc.totalOrcado) * 100)
      : 0;

    const nomeTruncado = orc.orcamentoNome.length > 20 ? orc.orcamentoNome.slice(0, 17) + '...' : orc.orcamentoNome;
    page.drawText(nomeTruncado, { x: colX[0], y, size: 9, font });
    page.drawText(String(orc.ano), { x: colX[1], y, size: 9, font });
    page.drawText(formatarValor(orc.totalOrcado).replace('R$', ''), { x: colX[2], y, size: 9, font });
    page.drawText(formatarValor(orc.totalRealizado).replace('R$', ''), { x: colX[3], y, size: 9, font });
    page.drawText(formatarPercentual(variacaoPercentual), {
      x: colX[4],
      y,
      size: 9,
      font,
      color: varColor,
    });
    page.drawText(`${orc.percentualRealizacao.toFixed(1)}%`, { x: colX[5], y, size: 9, font });

    y -= 16;
  }

  // Rodapé
  page.drawText('Sistema Sinesys - Gestão de Orçamentos', {
    x: margin,
    y: 20,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Salvar PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, 'comparativo_orcamentos.pdf');
}
