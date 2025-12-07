/**
 * Exportações para Contas a Pagar
 */

import { saveAs } from 'file-saver';
import { rgb } from 'pdf-lib';
import type {
  ContaPagarComDetalhes,
  ContasPagarFilters,
  ResumoVencimentos,
} from '@/backend/types/financeiro/contas-pagar.types';
import {
  formatarData,
  formatarValor,
  gerarCSV,
  sanitizeFileName,
  gerarPDFBase,
} from './export-financeiro';

export function exportarContasPagarCSV(contas: ContaPagarComDetalhes[]): void {
  const cabecalhos = ['Descrição', 'Fornecedor', 'Vencimento', 'Valor', 'Status'];
  const linhas = contas.map((conta) => [
    conta.descricao,
    (conta as unknown as { fornecedor?: { nome?: string }; fornecedorNome?: string }).fornecedor?.nome || (conta as unknown as { fornecedor?: { nome?: string }; fornecedorNome?: string }).fornecedorNome || '',
    conta.dataVencimento ? formatarData(conta.dataVencimento) : '-',
    conta.valor,
    conta.status,
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName('contas_a_pagar') + '.csv');
}

export async function exportarContasPagarPDF(
  contas: ContaPagarComDetalhes[],
  filtros?: ContasPagarFilters
): Promise<void> {
  const { base, cursorY } = await gerarPDFBase('Contas a Pagar', filtros?.busca);
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

  if (filtros) {
    page.drawText(`Filtros aplicados: ${JSON.stringify(filtros)}`, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= lineHeight + 4;
  }

  // Cabeçalho da tabela
  const headers = ['Fornecedor', 'Descrição', 'Vencimento', 'Valor', 'Status'];
  const colX = [margin, margin + 120, margin + 320, margin + 410, margin + 480];

  page.drawRectangle({
    x: margin,
    y: y - 2,
    width: pageWidth - margin * 2,
    height: lineHeight + 4,
    color: rgb(0.95, 0.95, 0.95),
  });

  headers.forEach((h, idx) => {
    page.drawText(h, { x: colX[idx], y, size: 9, font: boldFont });
  });

  y -= lineHeight + 6;

  for (const conta of contas.slice(0, 50)) {
    if (y < margin + lineHeight * 2) {
      const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
      base.page = nova;
      y = base.pageHeight - margin;
    }

    page.drawText((conta as unknown as { fornecedor?: { nome?: string }; fornecedorNome?: string }).fornecedor?.nome || (conta as unknown as { fornecedor?: { nome?: string }; fornecedorNome?: string }).fornecedorNome || '-', {
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

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, sanitizeFileName('contas_a_pagar') + '.pdf');
}

export async function exportarResumoVencimentosPDF(resumo: ResumoVencimentos): Promise<void> {
  const { base, cursorY } = await gerarPDFBase('Resumo de Vencimentos');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, margin, lineHeight } = base;

  const blocos: Array<{ titulo: string; dado: ResumoVencimentos['vencidas'] }> = [
    { titulo: 'Vencidas', dado: resumo.vencidas },
    { titulo: 'Vencendo Hoje', dado: resumo.vencendoHoje },
    { titulo: 'Próximos 7 dias', dado: resumo.vencendoEm7Dias },
    { titulo: 'Próximos 30 dias', dado: resumo.vencendoEm30Dias },
  ];

  for (const bloco of blocos) {
    page.drawText(bloco.titulo, { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight;
    page.drawText(
      `Quantidade: ${bloco.dado.quantidade} | Valor: ${formatarValor(bloco.dado.valorTotal)}`,
      { x: margin, y, size: 10, font }
    );
    y -= lineHeight;
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, sanitizeFileName('resumo_vencimentos') + '.pdf');
}
