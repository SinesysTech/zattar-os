/**
 * Exportações para Conciliação Bancária
 */

import { saveAs } from 'file-saver';
import { rgb } from 'pdf-lib';
import type {
  TransacaoBancariaImportada,
  ConciliacaoBancaria,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { formatarData, formatarValor, gerarCSV, sanitizeFileName, gerarPDFBase } from './export-financeiro';

export function exportarTransacoesImportadasCSV(
  transacoes: TransacaoBancariaImportada[]
): void {
  const cabecalhos = ['Data', 'Descrição', 'Valor', 'Tipo', 'Documento', 'Saldo'];
  const linhas = transacoes.map((t) => [
    formatarData(t.dataTransacao),
    t.descricao,
    t.valor,
    t.tipoTransacao,
    t.documento || '',
    t.saldoExtrato ?? '',
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName('transacoes_importadas') + '.csv');
}

export async function exportarConciliacoesPDF(
  conciliacoes: ConciliacaoBancaria[],
  periodo: { inicio: string; fim: string }
): Promise<void> {
  const { base, cursorY } = await gerarPDFBase(
    'Relatório de Conciliações',
    `Período: ${periodo.inicio} a ${periodo.fim}`
  );
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

  const headers = ['ID', 'Status', 'Tipo', 'Data', 'Score'];
  const colX = [margin, margin + 60, margin + 150, margin + 260, margin + 360];

  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });
  headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
  y -= lineHeight + 6;

  for (const conc of conciliacoes.slice(0, 80)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      y = base.pageHeight - margin;
    }

    page.drawText(String(conc.id), { x: colX[0], y, size: 9, font });
    page.drawText(conc.status, { x: colX[1], y, size: 9, font });
    page.drawText(conc.tipoConciliacao || '-', { x: colX[2], y, size: 9, font });
    page.drawText(conc.dataConciliacao ? formatarData(conc.dataConciliacao) : '-', {
      x: colX[3],
      y,
      size: 9,
      font,
    });
    page.drawText(conc.scoreSimilaridade != null ? `${conc.scoreSimilaridade}%` : '-', {
      x: colX[4],
      y,
      size: 9,
      font,
    });

    y -= lineHeight;
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, sanitizeFileName('conciliacoes') + '.pdf');
}
