/**
 * Exportações para Plano de Contas
 */

import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { achatarHierarquia } from '@/types/domain/financeiro';
import type { PlanoContaHierarquico } from '@/backend/types/financeiro/plano-contas.types';
import {
  formatarValor,
  gerarCSV,
  sanitizeFileName,
  gerarPDFBase,
} from './export-financeiro';

const indentarNome = (nome: string, nivel: number): string => {
  return `${'  '.repeat(nivel)}${nome}`;
};

export function exportarPlanoContasCSV(contas: PlanoContaHierarquico[]): void {
  const linhasHierarquia = achatarHierarquia(contas);

  const cabecalhos = ['Nome', 'Código', 'Natureza', 'Nível', 'Saldo Inicial'];
  const linhas = linhasHierarquia.map((conta) => [
    indentarNome(conta.nome, conta.nivelIndentacao || 0),
    conta.codigo || '',
    conta.natureza || '',
    conta.nivel || '',
    conta.saldoInicial ?? 0,
  ]);

  const csv = gerarCSV(cabecalhos, linhas);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, sanitizeFileName('plano_de_contas') + '.csv');
}

export async function exportarPlanoContasPDF(contas: PlanoContaHierarquico[]): Promise<void> {
  const { base, cursorY } = await gerarPDFBase('Plano de Contas');
  let y = cursorY;
  const { pdfDoc, page, font, boldFont, margin, lineHeight } = base;

  const desenhar = (lista: PlanoContaHierarquico[], nivel: number = 0) => {
    for (const conta of lista) {
      if (y < margin + lineHeight * 2) {
        const nova = pdfDoc.addPage([base.pageWidth, base.pageHeight]);
        y = base.pageHeight - margin;
        base.page = nova;
      }

      base.page.drawText(indentarNome(conta.nome, nivel), {
        x: margin,
        y,
        size: 10,
        font: nivel === 0 ? boldFont : font,
      });

      base.page.drawText(conta.codigo || '-', {
        x: margin + 260,
        y,
        size: 9,
        font,
      });

      base.page.drawText(conta.natureza || '-', {
        x: margin + 340,
        y,
        size: 9,
        font,
      });

      if (conta.saldoInicial !== undefined) {
        base.page.drawText(formatarValor(conta.saldoInicial), {
          x: margin + 430,
          y,
          size: 9,
          font,
        });
      }

      y -= lineHeight;

      if (conta.filhos && conta.filhos.length > 0) {
        desenhar(conta.filhos, nivel + 1);
      }
    }
  };

  desenhar(contas, 0);

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, sanitizeFileName('plano_de_contas') + '.pdf');
}
