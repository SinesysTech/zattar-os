/**
 * Domínio de Lançamentos Financeiros
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

import type {
    Lancamento,
    TipoLancamento,
    StatusLancamento,
    OrigemLancamento,
    FormaPagamento,
    FrequenciaRecorrencia,
    ListarLancamentosParams
} from '../types/lancamentos';

// Re-export types for convenience
export type {
    Lancamento,
    TipoLancamento,
    StatusLancamento,
    OrigemLancamento,
    FormaPagamento,
    FrequenciaRecorrencia,
    ListarLancamentosParams
};

// ============================================================================
// Regras de Negócio
// ============================================================================

/**
 * Valida se um lançamento pode ser criado
 */
export function validarCriacaoLancamento(dados: Partial<Lancamento>): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dados.descricao || dados.descricao.trim().length === 0) {
        erros.push('Descrição é obrigatória');
    }

    if (dados.valor === undefined || dados.valor === null) {
        erros.push('Valor é obrigatório');
    } else if (dados.valor <= 0) {
        erros.push('Valor deve ser maior que zero');
    }

    if (!dados.tipo) {
        erros.push('Tipo (receita/despesa) é obrigatório');
    }

    if (!dados.dataLancamento) {
        erros.push('Data de lançamento é obrigatória');
    }

    if (!dados.dataCompetencia) {
        erros.push('Data de competência é obrigatória');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se um lançamento pode ser efetivado (pago/recebido)
 */
export function validarEfetivacaoLancamento(lancamento: Lancamento): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (lancamento.status !== 'pendente') {
        erros.push(`Lançamento não pode ser efetivado pois está ${lancamento.status}`);
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se um lançamento pode ser cancelado
 */
export function validarCancelamentoLancamento(lancamento: Lancamento): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (lancamento.status === 'cancelado') {
        erros.push('Lançamento já está cancelado');
    }

    if (lancamento.status === 'estornado') {
        erros.push('Lançamento estornado não pode ser cancelado');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se um lançamento pode ser estornado
 */
export function validarEstornoLancamento(lancamento: Lancamento): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (lancamento.status !== 'confirmado') {
        erros.push('Apenas lançamentos confirmados podem ser estornados');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Calcula a próxima data de vencimento para lançamento recorrente
 */
export function calcularProximaDataRecorrencia(
    dataAtual: Date,
    frequencia: FrequenciaRecorrencia
): Date {
    const novaData = new Date(dataAtual);

    switch (frequencia) {
        case 'semanal':
            novaData.setDate(novaData.getDate() + 7);
            break;
        case 'quinzenal':
            novaData.setDate(novaData.getDate() + 15);
            break;
        case 'mensal':
            novaData.setMonth(novaData.getMonth() + 1);
            break;
        case 'bimestral':
            novaData.setMonth(novaData.getMonth() + 2);
            break;
        case 'trimestral':
            novaData.setMonth(novaData.getMonth() + 3);
            break;
        case 'semestral':
            novaData.setMonth(novaData.getMonth() + 6);
            break;
        case 'anual':
            novaData.setFullYear(novaData.getFullYear() + 1);
            break;
    }

    return novaData;
}

/**
 * Verifica se um lançamento está vencido
 */
export function lancamentoEstaVencido(lancamento: Lancamento): boolean {
    if (lancamento.status !== 'pendente' || !lancamento.dataVencimento) {
        return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(lancamento.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    return vencimento < hoje;
}

/**
 * Calcula dias até o vencimento (negativo se já venceu)
 */
export function calcularDiasAteVencimento(lancamento: Lancamento): number | null {
    if (!lancamento.dataVencimento) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(lancamento.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gera descrição automática para lançamento de acordo judicial
 */
export function gerarDescricaoAcordoJudicial(
    numeroParcela: number,
    totalParcelas: number,
    numeroProcesso?: string
): string {
    const base = `Parcela ${numeroParcela}/${totalParcelas}`;
    return numeroProcesso ? `${base} - Processo ${numeroProcesso}` : base;
}

/**
 * Determina o tipo de lançamento baseado na direção do acordo
 */
export function determinarTipoLancamentoPorDirecao(direcao: 'recebimento' | 'pagamento'): TipoLancamento {
    return direcao === 'recebimento' ? 'receita' : 'despesa';
}

// ============================================================================
// Constantes
// ============================================================================

export const STATUS_LANCAMENTO_LABELS: Record<StatusLancamento, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    estornado: 'Estornado'
};

export const ORIGEM_LANCAMENTO_LABELS: Record<OrigemLancamento, string> = {
    manual: 'Manual',
    acordo_judicial: 'Acordo Judicial',
    contrato: 'Contrato',
    folha_pagamento: 'Folha de Pagamento',
    importacao_bancaria: 'Importação Bancária',
    recorrente: 'Recorrente'
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
    dinheiro: 'Dinheiro',
    transferencia_bancaria: 'Transferência Bancária',
    ted: 'TED',
    pix: 'PIX',
    boleto: 'Boleto',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    cheque: 'Cheque',
    deposito_judicial: 'Depósito Judicial'
};

export const FREQUENCIA_RECORRENCIA_LABELS: Record<FrequenciaRecorrencia, string> = {
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    bimestral: 'Bimestral',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual'
};
