/**
 * Parser de arquivos CSV de extrato bancário
 *
 * Suporta diversos formatos de CSV exportados por bancos brasileiros.
 * Possui detecção automática de delimitadores e mapeamento flexível de colunas.
 */

import Papa from 'papaparse';
import type { TransacaoParsed, TipoTransacaoBancaria, CSVConfig } from '@/backend/types/financeiro/conciliacao-bancaria.types';

/**
 * Configuração padrão para parsing de CSV
 */
const CONFIG_PADRAO: CSVConfig = {
  dataCol: 'data',
  descricaoCol: 'descricao',
  valorCol: 'valor',
  tipoCol: undefined,
  documentoCol: undefined,
  saldoCol: undefined,
  delimitador: undefined, // Auto-detectar
  encoding: 'utf-8',
};

/**
 * Nomes de colunas comuns em extratos de bancos brasileiros
 */
const NOMES_COLUNA_DATA = [
  'data',
  'data_transacao',
  'data transacao',
  'dt_transacao',
  'dt transacao',
  'date',
  'data_lancamento',
  'data lancamento',
  'data movimento',
  'data_movimento',
  'dt_movimento',
  'data do lançamento',
  'data do lancamento',
];

const NOMES_COLUNA_DESCRICAO = [
  'descricao',
  'descrição',
  'historico',
  'histórico',
  'description',
  'desc',
  'memo',
  'lancamento',
  'lançamento',
  'detalhes',
  'observacao',
  'observação',
  'nome',
  'favorecido',
];

const NOMES_COLUNA_VALOR = [
  'valor',
  'value',
  'amount',
  'quantia',
  'vlr',
  'vl',
  'valor_transacao',
  'valor transacao',
  'valor do lançamento',
  'valor do lancamento',
  'montante',
];

const NOMES_COLUNA_TIPO = [
  'tipo',
  'type',
  'natureza',
  'dc',
  'd/c',
  'debito_credito',
  'debito/credito',
  'débito/crédito',
  'operacao',
  'operação',
  'movimento',
  'lancamento',
];

const NOMES_COLUNA_DOCUMENTO = [
  'documento',
  'doc',
  'num_documento',
  'numero_documento',
  'referencia',
  'ref',
  'id',
  'transacao_id',
  'nsu',
  'autorizacao',
  'autorização',
];

const NOMES_COLUNA_SALDO = [
  'saldo',
  'balance',
  'saldo_final',
  'saldo_disponivel',
  'saldo disponivel',
  'saldo após',
  'saldo apos',
];

/**
 * Encontra o nome da coluna correspondente na lista de aliases
 */
const encontrarColuna = (headers: string[], aliases: string[]): string | undefined => {
  const headersLower = headers.map(h => h.toLowerCase().trim());

  for (const alias of aliases) {
    const idx = headersLower.indexOf(alias.toLowerCase());
    if (idx !== -1) {
      return headers[idx];
    }
  }

  return undefined;
};

/**
 * Detecta automaticamente o mapeamento de colunas
 */
const detectarMapeamentoColunas = (headers: string[], config?: CSVConfig): Required<Pick<CSVConfig, 'dataCol' | 'descricaoCol' | 'valorCol'>> & Partial<CSVConfig> => {
  const mapeamento: Required<Pick<CSVConfig, 'dataCol' | 'descricaoCol' | 'valorCol'>> & Partial<CSVConfig> = {
    dataCol: config?.dataCol || encontrarColuna(headers, NOMES_COLUNA_DATA) || headers[0],
    descricaoCol: config?.descricaoCol || encontrarColuna(headers, NOMES_COLUNA_DESCRICAO) || headers[1],
    valorCol: config?.valorCol || encontrarColuna(headers, NOMES_COLUNA_VALOR) || headers[2],
    tipoCol: config?.tipoCol || encontrarColuna(headers, NOMES_COLUNA_TIPO),
    documentoCol: config?.documentoCol || encontrarColuna(headers, NOMES_COLUNA_DOCUMENTO),
    saldoCol: config?.saldoCol || encontrarColuna(headers, NOMES_COLUNA_SALDO),
  };

  return mapeamento;
};

/**
 * Parseia data em diversos formatos
 *
 * Formatos suportados:
 * - DD/MM/YYYY
 * - DD-MM-YYYY
 * - YYYY-MM-DD
 * - DD.MM.YYYY
 * - DD/MM/YY
 */
const parsearData = (dataStr: string): string => {
  if (!dataStr || typeof dataStr !== 'string') {
    throw new Error('Data não informada');
  }

  const dataLimpa = dataStr.trim();

  // Tentar diversos formatos
  let match: RegExpMatchArray | null;

  // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  match = dataLimpa.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const ano = match[3];
    return `${ano}-${mes}-${dia}`;
  }

  // DD/MM/YY
  match = dataLimpa.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const anoShort = parseInt(match[3], 10);
    // Assumir 2000+ para anos < 50, 1900+ para >= 50
    const ano = anoShort < 50 ? 2000 + anoShort : 1900 + anoShort;
    return `${ano}-${mes}-${dia}`;
  }

  // YYYY-MM-DD (ISO)
  match = dataLimpa.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // YYYY/MM/DD
  match = dataLimpa.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  throw new Error(`Formato de data não reconhecido: ${dataStr}`);
};

/**
 * Parseia valor monetário brasileiro
 *
 * Formatos suportados:
 * - 1.234,56 (brasileiro)
 * - 1,234.56 (americano)
 * - -1.234,56 (negativo)
 * - R$ 1.234,56 (com moeda)
 */
const parsearValor = (valorStr: string): number => {
  if (!valorStr || typeof valorStr !== 'string') {
    throw new Error('Valor não informado');
  }

  // Remover espaços, símbolo de moeda e outros caracteres
  let valorLimpo = valorStr
    .trim()
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '');

  // Verificar se é negativo
  const isNegativo = valorLimpo.startsWith('-') || valorLimpo.startsWith('(') || valorLimpo.endsWith('-');
  valorLimpo = valorLimpo.replace(/[()-]/g, '');

  // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
  // Se tem vírgula seguida de 2 dígitos no final, é brasileiro
  if (/,\d{2}$/.test(valorLimpo)) {
    // Formato brasileiro: remover pontos de milhar e trocar vírgula por ponto
    valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
  } else if (/\.\d{2}$/.test(valorLimpo)) {
    // Formato americano: remover vírgulas de milhar
    valorLimpo = valorLimpo.replace(/,/g, '');
  } else {
    // Tentar detectar pelo contexto
    // Se tem mais pontos que vírgulas, provavelmente brasileiro
    const pontos = (valorLimpo.match(/\./g) || []).length;
    const virgulas = (valorLimpo.match(/,/g) || []).length;

    if (virgulas > 0 && pontos >= 0) {
      // Provavelmente brasileiro
      valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    } else if (pontos > 0 && virgulas === 0) {
      // Pode ser americano ou decimal simples
      // Manter como está
    }
  }

  const valor = parseFloat(valorLimpo);

  if (isNaN(valor)) {
    throw new Error(`Valor inválido: ${valorStr}`);
  }

  return isNegativo ? -valor : valor;
};

/**
 * Determina tipo de transação baseado no valor ou coluna de tipo
 */
const determinarTipoTransacao = (
  valor: number,
  tipoStr?: string
): TipoTransacaoBancaria => {
  // Se temos coluna de tipo, usar ela
  if (tipoStr) {
    const tipoLower = tipoStr.toLowerCase().trim();

    // Crédito
    if (
      tipoLower === 'c' ||
      tipoLower === 'credito' ||
      tipoLower === 'crédito' ||
      tipoLower === 'credit' ||
      tipoLower === 'entrada' ||
      tipoLower === 'receita' ||
      tipoLower === 'recebimento'
    ) {
      return 'credito';
    }

    // Débito
    if (
      tipoLower === 'd' ||
      tipoLower === 'debito' ||
      tipoLower === 'débito' ||
      tipoLower === 'debit' ||
      tipoLower === 'saida' ||
      tipoLower === 'saída' ||
      tipoLower === 'despesa' ||
      tipoLower === 'pagamento'
    ) {
      return 'debito';
    }
  }

  // Fallback: inferir pelo sinal do valor
  return valor >= 0 ? 'credito' : 'debito';
};

/**
 * Parseia buffer CSV e retorna transações
 *
 * @param buffer - Buffer do arquivo CSV
 * @param config - Configuração de mapeamento de colunas (opcional)
 * @returns Array de transações parseadas
 * @throws Error se o arquivo for inválido ou não contiver transações válidas
 */
export const parseCSVBuffer = async (
  buffer: Buffer,
  config?: CSVConfig
): Promise<TransacaoParsed[]> => {
  const configFinal = { ...CONFIG_PADRAO, ...config };

  // Converter buffer para string
  let conteudo: string;
  try {
    conteudo = buffer.toString(configFinal.encoding || 'utf-8');
    // Se tem caracteres inválidos, tentar latin1
    if (conteudo.includes('�')) {
      conteudo = buffer.toString('latin1');
    }
  } catch {
    conteudo = buffer.toString('latin1');
  }

  // Parsear CSV
  return new Promise((resolve, reject) => {
    Papa.parse(conteudo, {
      header: true,
      skipEmptyLines: true,
      delimiter: configFinal.delimitador || '',
      dynamicTyping: false, // Manter tudo como string para controle de parsing
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Arquivo CSV vazio ou sem dados'));
            return;
          }

          const dados = results.data as Record<string, string>[];
          const headers = Object.keys(dados[0]);

          // Detectar mapeamento de colunas
          const mapeamento = detectarMapeamentoColunas(headers, configFinal);

          // Validar colunas obrigatórias
          if (!headers.includes(mapeamento.dataCol)) {
            reject(new Error(`Coluna de data não encontrada: ${mapeamento.dataCol}. Colunas disponíveis: ${headers.join(', ')}`));
            return;
          }
          if (!headers.includes(mapeamento.descricaoCol)) {
            reject(new Error(`Coluna de descrição não encontrada: ${mapeamento.descricaoCol}. Colunas disponíveis: ${headers.join(', ')}`));
            return;
          }
          if (!headers.includes(mapeamento.valorCol)) {
            reject(new Error(`Coluna de valor não encontrada: ${mapeamento.valorCol}. Colunas disponíveis: ${headers.join(', ')}`));
            return;
          }

          // Converter linhas para transações
          const transacoes: TransacaoParsed[] = [];
          const erros: Array<{ linha: number; erro: string }> = [];

          dados.forEach((linha, index) => {
            try {
              // Pular linhas vazias
              const dataStr = linha[mapeamento.dataCol];
              const valorStr = linha[mapeamento.valorCol];

              if (!dataStr || !valorStr) {
                return; // Pular linha sem dados essenciais
              }

              const valor = parsearValor(valorStr);
              const valorAbsoluto = Math.abs(valor); // usamos valor absoluto; sinal fica em tipoTransacao

              // Pular transações com valor zero
              if (valorAbsoluto === 0) {
                return;
              }

              const tipoStr = mapeamento.tipoCol ? linha[mapeamento.tipoCol] : undefined;

              const transacao: TransacaoParsed = {
                dataTransacao: parsearData(dataStr),
                descricao: (linha[mapeamento.descricaoCol] || '').trim() || 'Transação sem descrição',
                valor: valorAbsoluto,
                tipoTransacao: determinarTipoTransacao(valor, tipoStr),
                documento: mapeamento.documentoCol
                  ? (linha[mapeamento.documentoCol] || '').trim() || undefined
                  : undefined,
                saldoExtrato: mapeamento.saldoCol && linha[mapeamento.saldoCol]
                  ? parsearValor(linha[mapeamento.saldoCol])
                  : undefined,
                dadosOriginais: { ...linha, _linha: index + 2 }, // +2 porque índice 0 + header
              };

              transacoes.push(transacao);
            } catch (error) {
              erros.push({
                linha: index + 2, // +2 porque índice 0 + header
                erro: error instanceof Error ? error.message : 'Erro desconhecido',
              });
            }
          });

          if (transacoes.length === 0) {
            if (erros.length > 0) {
              reject(new Error(`Nenhuma transação válida encontrada. Erros: ${erros.slice(0, 5).map(e => `Linha ${e.linha}: ${e.erro}`).join('; ')}${erros.length > 5 ? ` e mais ${erros.length - 5} erros` : ''}`));
            } else {
              reject(new Error('Nenhuma transação encontrada no arquivo'));
            }
            return;
          }

          // Ordenar por data (mais antiga primeiro)
          transacoes.sort((a, b) => a.dataTransacao.localeCompare(b.dataTransacao));

          resolve(transacoes);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(new Error(`Erro ao parsear CSV: ${error.message}`));
      },
    });
  });
};

export { parseCSVBuffer as parseCSV };
