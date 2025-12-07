import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { obterHierarquiaPlanoContas } from '@/backend/plano-contas/services/plano-contas/obter-hierarquia.service';
import { achatarHierarquia } from '@/types/domain/financeiro';
import { rgb } from 'pdf-lib';
import { gerarCSV, sanitizeFileName, gerarPDFBase, formatarValor } from '@/app/_lib/financeiro/export-financeiro';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'plano_contas', 'exportar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'pdf';
  const apenasAnaliticas = searchParams.get('apenasAnaliticas') === 'true';

  const hierarquia = await obterHierarquiaPlanoContas();
  const contas = achatarHierarquia(hierarquia).filter((conta) =>
    !apenasAnaliticas ? true : !conta.filhos || conta.filhos.length === 0
  );

  const fileName = sanitizeFileName('plano_de_contas');

  if (formato === 'csv') {
    const cabecalhos = ['Nome', 'Código', 'Natureza', 'Nível', 'Saldo Inicial'];
    const linhas = contas.map((conta) => [
      `${'  '.repeat(conta.nivelIndentacao || 0)}${conta.nome}`,
      conta.codigo || '',
      conta.natureza || '',
      conta.nivel || '',
      conta.saldoInicial ?? 0,
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

  // PDF
  const { base, cursorY } = await gerarPDFBase('Plano de Contas');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

  const headers = ['Conta', 'Código', 'Natureza', 'Saldo'];
  const colX = [margin, margin + 240, margin + 320, margin + 420];

  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, idx) => page.drawText(h, { x: colX[idx], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const conta of contas.slice(0, 120)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      y = base.pageHeight - margin;
    }

    base.page.drawText(`${'  '.repeat(conta.nivelIndentacao || 0)}${conta.nome}`, {
      x: colX[0],
      y,
      size: 9,
      font,
    });
    base.page.drawText(conta.codigo || '-', { x: colX[1], y, size: 9, font });
    base.page.drawText(conta.natureza || '-', { x: colX[2], y, size: 9, font });
    if (conta.saldoInicial !== undefined) {
      base.page.drawText(formatarValor(conta.saldoInicial), {
        x: colX[3],
        y,
        size: 9,
        font,
      });
    }

    y -= lineHeight;
  }

  const pdfBytes = await base.pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
    },
  });
}
