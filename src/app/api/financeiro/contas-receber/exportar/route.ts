import { NextRequest, NextResponse } from 'next/server';
import { rgb } from 'pdf-lib';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  listarContasReceber,
  buscarResumoInadimplencia,
} from '@/backend/financeiro/contas-receber/services/persistence/contas-receber-persistence.service';
import type { ListarContasReceberParams } from '@/backend/types/financeiro/contas-receber.types';
import {
  gerarCSV,
  sanitizeFileName,
  formatarData,
  formatarValor,
  gerarPDFBase,
} from '@/core/app/_lib/financeiro/export-financeiro';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contas_receber', 'exportar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'pdf';

  const params: ListarContasReceberParams = {
    status: (searchParams.get('status') as ListarContasReceberParams['status']) || undefined,
    dataVencimentoInicio: searchParams.get('dataInicio') || undefined,
    dataVencimentoFim: searchParams.get('dataFim') || undefined,
    clienteId: searchParams.get('clienteId') ? Number(searchParams.get('clienteId')) : undefined,
    pagina: 1,
    limite: 500,
  };

  const { items } = await listarContasReceber(params);
  const fileName = sanitizeFileName('contas_a_receber');

  if (formato === 'csv') {
    const cabecalhos = ['Descrição', 'Cliente', 'Vencimento', 'Valor', 'Status'];
    const linhas: (string | number | null | undefined)[][] = items.map((conta) => [
      conta.descricao,
      (conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial) || '',
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

  const { base, cursorY } = await gerarPDFBase('Contas a Receber');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;
  let currentPage = page;

  const resumo = await buscarResumoInadimplencia();
  if (resumo) {
    currentPage.drawText('Resumo de Inadimplência', { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight;
    currentPage.drawText(
      `Vencidas: ${resumo.vencidas.quantidade} (${formatarValor(resumo.vencidas.valorTotal)})`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight;
    currentPage.drawText(
      `Hoje: ${resumo.vencendoHoje.quantidade} (${formatarValor(resumo.vencendoHoje.valorTotal)})`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight;
  }

  const headers = ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status'];
  const colX = [margin, margin + 120, margin + 320, margin + 410, margin + 480];
  currentPage.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, i) => currentPage.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const conta of items.slice(0, 100)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      currentPage = nova;
      y = base.pageHeight - margin;
    }

    currentPage.drawText(
      (conta.cliente?.nomeFantasia ?? conta.cliente?.razaoSocial) ?? '-',
      {
        x: colX[0],
        y,
        size: 9,
        font,
      }
    );
    const desc = conta.descricao?.length > 35 ? `${conta.descricao.slice(0, 32)}...` : conta.descricao;
    currentPage.drawText(desc, { x: colX[1], y, size: 9, font });
    currentPage.drawText(conta.dataVencimento ? formatarData(conta.dataVencimento) : '-', {
      x: colX[2],
      y,
      size: 9,
      font,
    });
    currentPage.drawText(formatarValor(conta.valor), { x: colX[3], y, size: 9, font });
    currentPage.drawText(conta.status, { x: colX[4], y, size: 9, font });

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
