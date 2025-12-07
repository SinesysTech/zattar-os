/**
 * Parser de arquivos OFX (Open Financial Exchange)
 *
 * Extrai transações bancárias de arquivos OFX gerados por bancos brasileiros.
 * Suporta formatos OFX 1.x (SGML) e OFX 2.x (XML).
 */

import { parse as parseOFX } from 'ofx-js';
import type { TransacaoParsed, TipoTransacaoBancaria } from '@/backend/types/financeiro/conciliacao-bancaria.types';

/**
 * Estrutura de transação OFX (conforme spec OFX)
 */
interface OFXTransaction {
  TRNTYPE: string; // Tipo: CREDIT, DEBIT, INT, DIV, FEE, SRVCHG, DEP, ATM, POS, XFER, CHECK, PAYMENT, CASH, DIRECTDEP, DIRECTDEBIT, REPEATPMT, OTHER
  DTPOSTED: string; // Data no formato YYYYMMDDHHMMSS ou YYYYMMDD
  TRNAMT: string; // Valor (negativo para débito)
  FITID: string; // ID único da transação no banco
  CHECKNUM?: string; // Número do cheque (se aplicável)
  REFNUM?: string; // Número de referência
  NAME?: string; // Nome do beneficiário/pagador
  MEMO?: string; // Descrição/memo
  PAYEEID?: string; // ID do beneficiário
}

/**
 * Estrutura do statement OFX
 */
interface OFXStatement {
  STMTTRN?: OFXTransaction[];
  LEDGERBAL?: {
    BALAMT: string;
    DTASOF: string;
  };
  AVAILBAL?: {
    BALAMT: string;
    DTASOF: string;
  };
}

/**
 * Estrutura principal do OFX parseado
 */
interface OFXData {
  OFX?: {
    BANKMSGSRSV1?: {
      STMTTRNRS?: {
        STMTRS?: {
          BANKTRANLIST?: OFXStatement;
        };
      };
    };
    CREDITCARDMSGSRSV1?: {
      CCSTMTTRNRS?: {
        CCSTMTRS?: {
          BANKTRANLIST?: OFXStatement;
        };
      };
    };
  };
}

/**
 * Mapeia tipo de transação OFX para tipo interno
 */
const mapearTipoTransacao = (trnType: string, amount: number): TipoTransacaoBancaria => {
  // OFX define vários tipos, mas podemos simplificar baseado no sinal do valor
  // Tipos que geralmente são crédito: CREDIT, DEP, INT, DIV, DIRECTDEP
  // Tipos que geralmente são débito: DEBIT, FEE, SRVCHG, ATM, POS, CHECK, PAYMENT, CASH, DIRECTDEBIT, REPEATPMT

  // Se o valor é positivo, é crédito; se negativo, é débito
  // Isso é mais confiável do que o tipo declarado
  return amount >= 0 ? 'credito' : 'debito';
};

/**
 * Parseia data OFX para formato ISO
 *
 * Formatos suportados:
 * - YYYYMMDD
 * - YYYYMMDDHHMMSS
 * - YYYYMMDDHHMMSS.XXX (com milissegundos)
 * - YYYYMMDDHHMMSS[timezone] (com timezone)
 */
const parsearDataOFX = (dtString: string): string => {
  if (!dtString || dtString.length < 8) {
    throw new Error(`Data OFX inválida: ${dtString}`);
  }

  // Remover timezone se presente (ex: [-3:BRT] ou [0:GMT])
  const dataLimpa = dtString.replace(/\[.*\]/, '').trim();

  const ano = dataLimpa.substring(0, 4);
  const mes = dataLimpa.substring(4, 6);
  const dia = dataLimpa.substring(6, 8);

  // Validar componentes
  const anoNum = parseInt(ano, 10);
  const mesNum = parseInt(mes, 10);
  const diaNum = parseInt(dia, 10);

  if (isNaN(anoNum) || isNaN(mesNum) || isNaN(diaNum)) {
    throw new Error(`Data OFX inválida: ${dtString}`);
  }

  if (mesNum < 1 || mesNum > 12 || diaNum < 1 || diaNum > 31) {
    throw new Error(`Data OFX inválida: ${dtString}`);
  }

  return `${ano}-${mes}-${dia}`;
};

/**
 * Parseia valor OFX para número
 */
const parsearValorOFX = (trnAmt: string): number => {
  if (!trnAmt) {
    throw new Error('Valor da transação não informado');
  }

  // OFX pode usar vírgula ou ponto como separador decimal
  // Também pode ter sinal + ou - no início
  const valorLimpo = trnAmt
    .replace(/\s/g, '') // Remove espaços
    .replace(',', '.'); // Normaliza separador decimal

  const valor = parseFloat(valorLimpo);

  if (isNaN(valor)) {
    throw new Error(`Valor inválido: ${trnAmt}`);
  }

  return valor;
};

/**
 * Monta descrição a partir dos campos disponíveis
 */
const montarDescricao = (trn: OFXTransaction): string => {
  const partes: string[] = [];

  // Prioridade: MEMO > NAME > TRNTYPE
  if (trn.MEMO && trn.MEMO.trim()) {
    partes.push(trn.MEMO.trim());
  }

  if (trn.NAME && trn.NAME.trim()) {
    // Só adiciona NAME se for diferente de MEMO
    if (!partes.includes(trn.NAME.trim())) {
      partes.push(trn.NAME.trim());
    }
  }

  if (partes.length === 0) {
    // Fallback para tipo de transação traduzido
    partes.push(traduzirTipoTransacaoOFX(trn.TRNTYPE));
  }

  // Adicionar número do cheque se presente
  if (trn.CHECKNUM) {
    partes.push(`Cheque: ${trn.CHECKNUM}`);
  }

  return partes.join(' - ');
};

/**
 * Traduz tipo de transação OFX para português
 */
const traduzirTipoTransacaoOFX = (trnType: string): string => {
  const traducoes: Record<string, string> = {
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
    INT: 'Juros',
    DIV: 'Dividendo',
    FEE: 'Taxa',
    SRVCHG: 'Tarifa de serviço',
    DEP: 'Depósito',
    ATM: 'Saque ATM',
    POS: 'Ponto de venda',
    XFER: 'Transferência',
    CHECK: 'Cheque',
    PAYMENT: 'Pagamento',
    CASH: 'Dinheiro',
    DIRECTDEP: 'Depósito direto',
    DIRECTDEBIT: 'Débito direto',
    REPEATPMT: 'Pagamento recorrente',
    OTHER: 'Outro',
  };

  return traducoes[trnType] || trnType || 'Transação';
};

/**
 * Extrai transações de um statement OFX
 */
const extrairTransacoesDeStatement = (statement: OFXStatement | undefined): { transacoes: OFXTransaction[], saldo?: number } => {
  if (!statement) {
    return { transacoes: [] };
  }

  const transacoes = statement.STMTTRN || [];
  let saldo: number | undefined;

  // Tentar obter saldo disponível ou saldo contábil
  if (statement.AVAILBAL?.BALAMT) {
    saldo = parsearValorOFX(statement.AVAILBAL.BALAMT);
  } else if (statement.LEDGERBAL?.BALAMT) {
    saldo = parsearValorOFX(statement.LEDGERBAL.BALAMT);
  }

  return { transacoes, saldo };
};

/**
 * Parseia buffer OFX e retorna transações
 *
 * @param buffer - Buffer do arquivo OFX
 * @returns Array de transações parseadas
 * @throws Error se o arquivo for inválido ou não contiver transações
 */
export const parseOFXBuffer = async (buffer: Buffer): Promise<TransacaoParsed[]> => {
  // Converter buffer para string
  // OFX pode ser UTF-8, ISO-8859-1 ou Windows-1252
  // Tentar UTF-8 primeiro, depois fallback para latin1
  let conteudo: string;
  try {
    conteudo = buffer.toString('utf-8');
    // Verificar se tem caracteres inválidos (indicativo de encoding errado)
    if (conteudo.includes('�')) {
      conteudo = buffer.toString('latin1');
    }
  } catch {
    conteudo = buffer.toString('latin1');
  }

  // Parsear OFX
  let dadosOFX: OFXData;
  try {
    dadosOFX = await parseOFX(conteudo);
  } catch (error) {
    throw new Error(`Erro ao parsear arquivo OFX: ${error instanceof Error ? error.message : 'Formato inválido'}`);
  }

  if (!dadosOFX.OFX) {
    throw new Error('Arquivo OFX inválido: não contém dados OFX');
  }

  // Extrair transações de conta bancária ou cartão de crédito
  let transacoesOFX: OFXTransaction[] = [];
  let saldoExtrato: number | undefined;

  // Conta bancária
  const bankStatement = dadosOFX.OFX.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST;
  if (bankStatement) {
    const { transacoes, saldo } = extrairTransacoesDeStatement(bankStatement);
    transacoesOFX = [...transacoesOFX, ...transacoes];
    if (saldo !== undefined) saldoExtrato = saldo;
  }

  // Cartão de crédito
  const ccStatement = dadosOFX.OFX.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST;
  if (ccStatement) {
    const { transacoes, saldo } = extrairTransacoesDeStatement(ccStatement);
    transacoesOFX = [...transacoesOFX, ...transacoes];
    if (saldo !== undefined && saldoExtrato === undefined) saldoExtrato = saldo;
  }

  if (transacoesOFX.length === 0) {
    throw new Error('Arquivo OFX não contém transações');
  }

  // Converter para formato interno
  const transacoes: TransacaoParsed[] = [];
  const erros: Array<{ linha: number; erro: string }> = [];

  transacoesOFX.forEach((trn, index) => {
    try {
      const valor = parsearValorOFX(trn.TRNAMT);
      const valorAbsoluto = Math.abs(valor); // usamos valor absoluto; o sinal fica em tipoTransacao

      const transacao: TransacaoParsed = {
        dataTransacao: parsearDataOFX(trn.DTPOSTED),
        descricao: montarDescricao(trn),
        valor: valorAbsoluto,
        tipoTransacao: mapearTipoTransacao(trn.TRNTYPE, valor),
        documento: trn.FITID || trn.REFNUM || trn.CHECKNUM || undefined,
        saldoExtrato,
        dadosOriginais: { ...trn } as Record<string, unknown>,
      };

      transacoes.push(transacao);
    } catch (error) {
      erros.push({
        linha: index + 1,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  if (transacoes.length === 0 && erros.length > 0) {
    throw new Error(`Nenhuma transação válida encontrada. Erros: ${erros.map(e => e.erro).join(', ')}`);
  }

  // Ordenar por data (mais antiga primeiro)
  transacoes.sort((a, b) => a.dataTransacao.localeCompare(b.dataTransacao));

  return transacoes;
};

export { parseOFXBuffer as parseOFX };
