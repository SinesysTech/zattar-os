import crypto from 'crypto';
import { parseOFX } from './ofx-parser';
import { parseCSV } from './csv-parser';
import type { TransacaoParsed, TipoArquivoExtrato } from '@/backend/types/financeiro/conciliacao-bancaria.types';
import type { CSVConfig } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export const parseExtrato = async (
  buffer: Buffer,
  tipoArquivo: TipoArquivoExtrato,
  config?: CSVConfig
): Promise<TransacaoParsed[]> => {
  if (tipoArquivo === 'ofx') {
    return parseOFX(buffer);
  }

  if (tipoArquivo === 'csv') {
    return parseCSV(buffer, config);
  }

  throw new Error(`Tipo de arquivo n\u00e3o suportado: ${tipoArquivo}`);
};

export const calcularHashTransacao = (
  contaBancariaId: number,
  data: string,
  valor: number,
  descricao: string
): string => {
  const base = `${contaBancariaId}-${data}-${valor}-${descricao.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(base).digest('hex');
};

export type { TransacaoParsed };
