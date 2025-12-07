/**
 * API Route para Exportação de DRE
 * GET: Gera DRE e retorna em formato PDF, Excel ou CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { calcularDRE } from '@/backend/financeiro/dre/services/dre/calcular-dre.service';
import { validarGerarDREDTO, isPeriodoDREValido } from '@/backend/types/financeiro/dre.types';
import type { PeriodoDRE, DRE } from '@/backend/types/financeiro/dre.types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  return `${valor >= 0 ? '' : ''}${valor.toFixed(2)}%`;
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
    .slice(0, 100) || 'dre';
};

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ============================================================================
// CSV Generation
// ============================================================================

function gerarDRECSV(dre: DRE): string {
  const linhas: string[] = [];
  const sep = ',';

  // Cabeçalho
  linhas.push('DEMONSTRAÇÃO DE RESULTADO DO EXERCÍCIO (DRE)');
  linhas.push(`Período: ${dre.periodo.descricao}`);
  linhas.push(`De ${dre.periodo.dataInicio} a ${dre.periodo.dataFim}`);
  linhas.push(`Gerado em: ${formatarData(dre.geradoEm)}`);
  linhas.push('');

  // Estrutura DRE
  linhas.push('Descrição' + sep + 'Valor' + sep + '% Receita');
  linhas.push('');

  const { resumo } = dre;

  // Receitas
  linhas.push('RECEITAS' + sep + sep);
  linhas.push('  Receita Bruta' + sep + escapeCSV(resumo.receitaBruta) + sep + '100.00%');
  linhas.push('  (-) Deduções' + sep + escapeCSV(-resumo.deducoes) + sep + formatarPercentual(-calcularPercent(resumo.deducoes, resumo.receitaLiquida)));
  linhas.push('  = Receita Líquida' + sep + escapeCSV(resumo.receitaLiquida) + sep + '100.00%');
  linhas.push('');

  // Custos
  linhas.push('CUSTOS E DESPESAS' + sep + sep);
  linhas.push('  (-) Custos Diretos' + sep + escapeCSV(-resumo.custosDiretos) + sep + formatarPercentual(-calcularPercent(resumo.custosDiretos, resumo.receitaLiquida)));
  linhas.push('  = Lucro Bruto' + sep + escapeCSV(resumo.lucroBruto) + sep + formatarPercentual(resumo.margemBruta));
  linhas.push('');

  // Despesas Operacionais
  linhas.push('  (-) Despesas Operacionais' + sep + escapeCSV(-resumo.despesasOperacionais) + sep + formatarPercentual(-calcularPercent(resumo.despesasOperacionais, resumo.receitaLiquida)));
  linhas.push('  = Lucro Operacional' + sep + escapeCSV(resumo.lucroOperacional) + sep + formatarPercentual(resumo.margemOperacional));
  linhas.push('');

  // EBITDA
  linhas.push('  (+) Depreciação/Amortização' + sep + escapeCSV(resumo.depreciacaoAmortizacao) + sep + formatarPercentual(calcularPercent(resumo.depreciacaoAmortizacao, resumo.receitaLiquida)));
  linhas.push('  = EBITDA' + sep + escapeCSV(resumo.ebitda) + sep + formatarPercentual(resumo.margemEBITDA));
  linhas.push('');

  // Resultado Financeiro
  linhas.push('RESULTADO FINANCEIRO' + sep + sep);
  linhas.push('  (+) Receitas Financeiras' + sep + escapeCSV(resumo.receitasFinanceiras) + sep + formatarPercentual(calcularPercent(resumo.receitasFinanceiras, resumo.receitaLiquida)));
  linhas.push('  (-) Despesas Financeiras' + sep + escapeCSV(-resumo.despesasFinanceiras) + sep + formatarPercentual(-calcularPercent(resumo.despesasFinanceiras, resumo.receitaLiquida)));
  linhas.push('  = Resultado Financeiro' + sep + escapeCSV(resumo.resultadoFinanceiro) + sep + formatarPercentual(calcularPercent(resumo.resultadoFinanceiro, resumo.receitaLiquida)));
  linhas.push('');

  // Resultado Final
  linhas.push('RESULTADO' + sep + sep);
  linhas.push('  = Resultado Antes Impostos' + sep + escapeCSV(resumo.resultadoAntesImposto) + sep + formatarPercentual(calcularPercent(resumo.resultadoAntesImposto, resumo.receitaLiquida)));
  linhas.push('  (-) Impostos' + sep + escapeCSV(-resumo.impostos) + sep + formatarPercentual(-calcularPercent(resumo.impostos, resumo.receitaLiquida)));
  linhas.push('  = LUCRO LÍQUIDO' + sep + escapeCSV(resumo.lucroLiquido) + sep + formatarPercentual(resumo.margemLiquida));
  linhas.push('');

  // Detalhamento por categoria
  linhas.push('');
  linhas.push('DETALHAMENTO - RECEITAS POR CATEGORIA');
  linhas.push('Categoria' + sep + 'Valor' + sep + '% Receita');
  for (const cat of dre.receitasPorCategoria) {
    linhas.push(escapeCSV(cat.categoria) + sep + escapeCSV(cat.valor) + sep + formatarPercentual(cat.percentualReceita));
  }
  linhas.push('');

  linhas.push('DETALHAMENTO - DESPESAS POR CATEGORIA');
  linhas.push('Categoria' + sep + 'Valor' + sep + '% Receita');
  for (const cat of dre.despesasPorCategoria) {
    linhas.push(escapeCSV(cat.categoria) + sep + escapeCSV(cat.valor) + sep + formatarPercentual(cat.percentualReceita));
  }

  return linhas.join('\n');
}

function calcularPercent(valor: number, base: number): number {
  if (base === 0) return 0;
  return (valor / base) * 100;
}

// ============================================================================
// PDF Generation
// ============================================================================

async function gerarDREPDF(dre: DRE): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const margin = 50;
  const fontSize = 10;
  const lineHeight = 14;
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

  // Helper: Desenhar linha horizontal
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
  page.drawText('DEMONSTRAÇÃO DE RESULTADO DO EXERCÍCIO (DRE)', {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 25;

  page.drawText(dre.periodo.descricao, {
    x: margin,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 18;

  page.drawText(`Período: ${dre.periodo.dataInicio} a ${dre.periodo.dataFim}`, {
    x: margin,
    y,
    size: fontSize,
    font,
  });
  y -= 14;

  page.drawText(`Gerado em: ${formatarData(dre.geradoEm)}`, {
    x: margin,
    y,
    size: fontSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 20;
  drawHorizontalLine();

  // ==================== ESTRUTURA DRE ====================
  const { resumo } = dre;

  // Colunas: Descrição, Valor, %
  const colDescX = margin;
  const colValorX = margin + 280;
  const colPercX = margin + 400;

  // Função helper para desenhar linha DRE
  const drawDRELine = (
    descricao: string,
    valor: number,
    percentual: number | null,
    options: {
      bold?: boolean;
      indent?: number;
      highlight?: boolean;
      isNegative?: boolean;
    } = {}
  ) => {
    checkNewPage();
    const { bold = false, indent = 0, highlight = false, isNegative = false } = options;
    const textFont = bold ? boldFont : font;
    const size = bold ? 11 : fontSize;

    // Background para linhas destacadas
    if (highlight) {
      page.drawRectangle({
        x: margin - 5,
        y: y - 3,
        width: contentWidth + 10,
        height: lineHeight + 2,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    // Descrição
    page.drawText(descricao, {
      x: colDescX + indent,
      y,
      size,
      font: textFont,
      color: rgb(0, 0, 0),
    });

    // Valor
    const valorColor = valor < 0 ? rgb(0.8, 0, 0) : rgb(0, 0, 0);
    page.drawText(formatarValor(isNegative ? -Math.abs(valor) : valor), {
      x: colValorX,
      y,
      size,
      font: textFont,
      color: isNegative ? rgb(0.6, 0, 0) : valorColor,
    });

    // Percentual
    if (percentual !== null) {
      page.drawText(formatarPercentual(percentual), {
        x: colPercX,
        y,
        size,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    y -= lineHeight + 2;
  };

  // Cabeçalho da tabela
  page.drawRectangle({
    x: margin - 5,
    y: y - 3,
    width: contentWidth + 10,
    height: lineHeight + 4,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText('Descrição', { x: colDescX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('Valor (R$)', { x: colValorX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('% Receita', { x: colPercX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  y -= lineHeight + 8;

  // RECEITAS
  drawDRELine('RECEITAS', 0, null, { bold: true });
  drawDRELine('Receita Bruta', resumo.receitaBruta, 100);
  drawDRELine('(-) Deduções', resumo.deducoes, -calcularPercent(resumo.deducoes, resumo.receitaLiquida), { indent: 10, isNegative: true });
  drawDRELine('= Receita Líquida', resumo.receitaLiquida, 100, { bold: true, highlight: true });
  y -= 5;

  // CUSTOS
  drawDRELine('CUSTOS', 0, null, { bold: true });
  drawDRELine('(-) Custos Diretos', resumo.custosDiretos, -calcularPercent(resumo.custosDiretos, resumo.receitaLiquida), { indent: 10, isNegative: true });
  drawDRELine('= Lucro Bruto', resumo.lucroBruto, resumo.margemBruta, { bold: true, highlight: true });
  y -= 5;

  // DESPESAS OPERACIONAIS
  drawDRELine('DESPESAS OPERACIONAIS', 0, null, { bold: true });
  drawDRELine('(-) Despesas Operacionais', resumo.despesasOperacionais, -calcularPercent(resumo.despesasOperacionais, resumo.receitaLiquida), { indent: 10, isNegative: true });
  drawDRELine('= Lucro Operacional', resumo.lucroOperacional, resumo.margemOperacional, { bold: true, highlight: true });
  y -= 5;

  // EBITDA
  drawDRELine('(+) Depreciação/Amortização', resumo.depreciacaoAmortizacao, calcularPercent(resumo.depreciacaoAmortizacao, resumo.receitaLiquida), { indent: 10 });
  drawDRELine('= EBITDA', resumo.ebitda, resumo.margemEBITDA, { bold: true, highlight: true });
  y -= 5;

  // RESULTADO FINANCEIRO
  drawDRELine('RESULTADO FINANCEIRO', 0, null, { bold: true });
  drawDRELine('(+) Receitas Financeiras', resumo.receitasFinanceiras, calcularPercent(resumo.receitasFinanceiras, resumo.receitaLiquida), { indent: 10 });
  drawDRELine('(-) Despesas Financeiras', resumo.despesasFinanceiras, -calcularPercent(resumo.despesasFinanceiras, resumo.receitaLiquida), { indent: 10, isNegative: true });
  y -= 5;

  // RESULTADO FINAL
  drawDRELine('= Resultado Antes Impostos', resumo.resultadoAntesImposto, calcularPercent(resumo.resultadoAntesImposto, resumo.receitaLiquida), { bold: true });
  drawDRELine('(-) Impostos', resumo.impostos, -calcularPercent(resumo.impostos, resumo.receitaLiquida), { indent: 10, isNegative: true });
  y -= 5;

  // LUCRO LÍQUIDO
  const lucroColor = resumo.lucroLiquido >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
  page.drawRectangle({
    x: margin - 5,
    y: y - 3,
    width: contentWidth + 10,
    height: lineHeight + 4,
    color: resumo.lucroLiquido >= 0 ? rgb(0.9, 1, 0.9) : rgb(1, 0.9, 0.9),
  });
  page.drawText('= LUCRO LÍQUIDO', {
    x: colDescX,
    y,
    size: 12,
    font: boldFont,
    color: lucroColor,
  });
  page.drawText(formatarValor(resumo.lucroLiquido), {
    x: colValorX,
    y,
    size: 12,
    font: boldFont,
    color: lucroColor,
  });
  page.drawText(formatarPercentual(resumo.margemLiquida), {
    x: colPercX,
    y,
    size: 11,
    font: boldFont,
    color: lucroColor,
  });
  y -= lineHeight + 15;

  // ==================== RESUMO DE MARGENS ====================
  checkNewPage(100);
  drawHorizontalLine();

  page.drawText('RESUMO DE MARGENS', {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 20;

  const margens = [
    { label: 'Margem Bruta', valor: resumo.margemBruta },
    { label: 'Margem Operacional', valor: resumo.margemOperacional },
    { label: 'Margem EBITDA', valor: resumo.margemEBITDA },
    { label: 'Margem Líquida', valor: resumo.margemLiquida },
  ];

  for (const m of margens) {
    const margemColor = m.valor >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
    page.drawText(`${m.label}:`, {
      x: margin + 10,
      y,
      size: fontSize,
      font,
    });
    page.drawText(formatarPercentual(m.valor), {
      x: margin + 150,
      y,
      size: fontSize,
      font: boldFont,
      color: margemColor,
    });
    y -= 14;
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

    currentPage.drawText('Sistema Sinesys - Gestão Financeira', {
      x: margin,
      y: 20,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await pdfDoc.save();
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * @swagger
 * /api/financeiro/dre/exportar:
 *   get:
 *     summary: Exportar DRE
 *     description: Gera e exporta o DRE em formato PDF, Excel ou CSV
 *     tags:
 *       - DRE
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: formato
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, excel, csv]
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [mensal, trimestral, anual]
 *     responses:
 *       200:
 *         description: Arquivo exportado com sucesso
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação e autorização - requer permissão dre:exportar
    const authOrError = await requirePermission(request, 'dre', 'exportar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Obter parâmetros
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const formato = searchParams.get('formato') || 'pdf';
    const tipo = searchParams.get('tipo') as PeriodoDRE | null;

    // 3. Validar parâmetros
    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'Parâmetros dataInicio e dataFim são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['pdf', 'excel', 'csv'].includes(formato)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: pdf, excel ou csv' },
        { status: 400 }
      );
    }

    const dto = {
      dataInicio,
      dataFim,
      tipo: tipo && isPeriodoDREValido(tipo) ? tipo : undefined,
    };

    if (!validarGerarDREDTO(dto)) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Verifique as datas.' },
        { status: 400 }
      );
    }

    // 4. Gerar DRE
    const dre = await calcularDRE(dto);

    // 5. Gerar arquivo conforme formato
    const fileName = sanitizeFileName(`dre_${dre.periodo.descricao}_${dataInicio}_${dataFim}`);

    if (formato === 'csv' || formato === 'excel') {
      // Excel será gerado como CSV (pode ser aberto no Excel)
      const csvContent = gerarDRECSV(dre);
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    // PDF
    const pdfBytes = await gerarDREPDF(dre);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar DRE:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
