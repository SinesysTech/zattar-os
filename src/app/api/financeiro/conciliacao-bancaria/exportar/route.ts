import { NextRequest, NextResponse } from 'next/server';
import { rgb } from 'pdf-lib';
import { requirePermission } from '@/backend/auth/require-permission';
import { listarTransacoesImportadas } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';
import type { ListarTransacoesImportadasParams } from '@/backend/types/financeiro/conciliacao-bancaria.types';
import {
  gerarCSV,
  sanitizeFileName,
  formatarData,
  formatarValor,
  gerarPDFBase,
} from '@/app/_lib/financeiro/export-financeiro';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'conciliacao_bancaria', 'exportar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'csv';

  const params: ListarTransacoesImportadasParams = {
    contaBancariaId: searchParams.get('contaBancariaId')
      ? Number(searchParams.get('contaBancariaId'))
      : undefined,
    dataInicio: searchParams.get('dataInicio') || undefined,
    dataFim: searchParams.get('dataFim') || undefined,
    statusConciliacao: searchParams.get('status') || undefined,
    pagina: 1,
    limite: 500,
  };

  const { items } = await listarTransacoesImportadas(params);
  const fileName = sanitizeFileName('conciliacao_bancaria');

  if (formato === 'csv') {
    const cabecalhos = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'];
    const linhas = items.map((t) => [
      formatarData(t.dataTransacao),
      t.descricao,
      t.valor,
      t.tipoTransacao,
      t.conciliacao?.status || 'pendente',
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

  const { base, cursorY } = await gerarPDFBase('Conciliação Bancária');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;
  let currentPage = page;

  const headers = ['Data', 'Descrição', 'Valor', 'Status', 'Score'];
  const colX = [margin, margin + 90, margin + 260, margin + 380, margin + 470];
  currentPage.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, i) => currentPage.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const t of items.slice(0, 120)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      currentPage = nova;
      y = base.pageHeight - margin;
    }

    currentPage.drawText(formatarData(t.dataTransacao), { x: colX[0], y, size: 9, font });
    const desc = t.descricao.length > 30 ? `${t.descricao.slice(0, 27)}...` : t.descricao;
    currentPage.drawText(desc, { x: colX[1], y, size: 9, font });
    currentPage.drawText(formatarValor(t.valor), { x: colX[2], y, size: 9, font });
    currentPage.drawText(t.conciliacao?.status || 'pendente', { x: colX[3], y, size: 9, font });
    currentPage.drawText(
      t.conciliacao?.scoreSimilaridade != null ? `${t.conciliacao.scoreSimilaridade}%` : '-',
      { x: colX[4], y, size: 9, font }
    );

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
