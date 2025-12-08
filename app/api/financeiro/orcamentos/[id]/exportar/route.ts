import { NextRequest, NextResponse } from 'next/server';
import { rgb } from 'pdf-lib';
import { requirePermission } from '@/backend/auth/require-permission';
import { buscarOrcamentoComDetalhes } from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import { gerarCSV, sanitizeFileName, formatarValor, gerarPDFBase } from '@/app/_lib/financeiro/export-financeiro';

interface RouteParams {
  params: Promise<{ id: string }>;
}

import type { OrcamentoItemComDetalhes } from '@/backend/types/financeiro/orcamento.types';

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authOrError = await requirePermission(request, 'orcamentos', 'exportar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const resolvedParams = await params;
  const orcamentoId = Number(resolvedParams.id);

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'pdf';

  const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);
  const fileName = sanitizeFileName(`orcamento_${orcamento.nome}_${orcamento.ano}`);

  if (formato === 'csv' || formato === 'excel') {
    const cabecalhos = ['Conta Contábil', 'Centro de Custo', 'Mês', 'Valor Orçado', 'Observações'];
    const linhas = (orcamento.itens || []).map((item: OrcamentoItemComDetalhes) => [
      item.contaContabil?.nome || '',
      item.centroCusto?.nome || '-',
      item.mes ? String(item.mes) : 'Todos',
      item.valorOrcado,
      item.observacoes || '',
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

  const { base, cursorY } = await gerarPDFBase('Orçamento', `${orcamento.nome} (${orcamento.ano})`);
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;
  let currentPage = page;

  currentPage.drawText(`Período: ${orcamento.periodo || '-'}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= lineHeight + 6;

  const headers = ['Conta', 'Mês', 'Valor'];
  const colX = [margin, margin + 240, margin + 360];
  currentPage.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, i) => currentPage.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const item of (orcamento.itens || []).slice(0, 120)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      currentPage = nova;
      y = base.pageHeight - margin;
    }

    currentPage.drawText(item.contaContabil?.nome || '-', { x: colX[0], y, size: 9, font });
    currentPage.drawText(item.mes ? String(item.mes) : 'Todos', { x: colX[1], y, size: 9, font });
    currentPage.drawText(formatarValor(item.valorOrcado || 0), { x: colX[2], y, size: 9, font });

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
