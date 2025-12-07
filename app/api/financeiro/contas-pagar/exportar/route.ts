import { NextRequest, NextResponse } from 'next/server';
import { rgb } from 'pdf-lib';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  listarContasPagar,
  buscarResumoVencimentos,
} from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import type { ListarContasPagarParams } from '@/backend/types/financeiro/contas-pagar.types';
import {
  gerarCSV,
  sanitizeFileName,
  formatarData,
  formatarValor,
  gerarPDFBase,
} from '@/app/_lib/financeiro/export-financeiro';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contas_pagar', 'exportar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'pdf';

  const params: ListarContasPagarParams = {
    status: searchParams.get('status') as any,
    dataVencimentoInicio: searchParams.get('dataInicio') || undefined,
    dataVencimentoFim: searchParams.get('dataFim') || undefined,
    fornecedorId: searchParams.get('fornecedorId')
      ? Number(searchParams.get('fornecedorId'))
      : undefined,
    pagina: 1,
    limite: 500,
  };

  const { items } = await listarContasPagar(params);
  const fileName = sanitizeFileName('contas_a_pagar');

  if (formato === 'csv') {
    const cabecalhos = ['Descrição', 'Fornecedor', 'Vencimento', 'Valor', 'Status'];
    const linhas = items.map((conta) => [
      conta.descricao,
      (conta as any).fornecedor?.nome || (conta as any).fornecedorNome || '',
      conta.dataVencimento ? formatarData(conta.dataVencimento) : '-',
      conta.valor,
      conta.status,
    ]);
    const csv = gerarCSV(cabecalhos, linhas);
    return new NextResponse('\ufeff' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      },
    });
  }

  const { base, cursorY } = await gerarPDFBase('Contas a Pagar');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

  // Resumo rápido de vencimentos
  const resumo = await buscarResumoVencimentos();
  if (resumo) {
    page.drawText('Resumo de Vencimentos', { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight;
    page.drawText(
      `Vencidas: ${resumo.vencidas.quantidade} (${formatarValor(resumo.vencidas.valorTotal)})`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight;
    page.drawText(
      `Hoje: ${resumo.vencendoHoje.quantidade} (${formatarValor(resumo.vencendoHoje.valorTotal)})`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight;
    page.drawText(
      `Próx. 7 dias: ${resumo.vencendoEm7Dias.quantidade} (${formatarValor(resumo.vencendoEm7Dias.valorTotal)})`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight * 1.5;
  }

  const headers = ['Fornecedor', 'Descrição', 'Vencimento', 'Valor', 'Status'];
  const colX = [margin, margin + 120, margin + 320, margin + 410, margin + 480];
  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const conta of items.slice(0, 100)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      y = base.pageHeight - margin;
    }

    page.drawText((conta as any).fornecedor?.nome || (conta as any).fornecedorNome || '-', {
      x: colX[0],
      y,
      size: 9,
      font,
    });
    const desc = conta.descricao?.length > 35 ? `${conta.descricao.slice(0, 32)}...` : conta.descricao;
    page.drawText(desc, { x: colX[1], y, size: 9, font });
    page.drawText(conta.dataVencimento ? formatarData(conta.dataVencimento) : '-', {
      x: colX[2],
      y,
      size: 9,
      font,
    });
    page.drawText(formatarValor(conta.valor), { x: colX[3], y, size: 9, font });
    page.drawText(conta.status, { x: colX[4], y, size: 9, font });

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
    },
  });
}
