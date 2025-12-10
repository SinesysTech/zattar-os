/**
 * Domínio de Conciliação Bancária
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

import type {
    Conciliacao,
    TransacaoImportada,
    ConciliacaoBancaria,
    TransacaoComConciliacao,
    SugestaoConciliacao,
    StatusConciliacao,
    TipoTransacao,
    LancamentoFinanceiroResumo
} from '../types/conciliacao';
import type { Lancamento } from '../types/lancamentos';

// Re-export types for convenience
export type {
    Conciliacao,
    TransacaoImportada,
    ConciliacaoBancaria,
    TransacaoComConciliacao,
    SugestaoConciliacao,
    StatusConciliacao,
    TipoTransacao,
    LancamentoFinanceiroResumo
};

// ============================================================================
// Regras de Negócio
// ============================================================================

/**
 * Calcula o score de similaridade entre uma transação importada e um lançamento
 * Score de 0 a 100
 */
export function calcularScoreConciliacao(
    transacao: TransacaoImportada,
    lancamento: Lancamento
): number {
    let score = 0;

    // Valor exato: +50 pontos
    // Valor aproximado (±1%): +30 pontos
    const diferencaValor = Math.abs(transacao.valor - lancamento.valor);
    const percentualDiferenca = (diferencaValor / transacao.valor) * 100;

    if (diferencaValor === 0) {
        score += 50;
    } else if (percentualDiferenca <= 1) {
        score += 30;
    } else if (percentualDiferenca <= 5) {
        score += 10;
    }

    // Data exata: +30 pontos
    // Data próxima (±3 dias): +15 pontos
    const dataTransacao = new Date(transacao.dataTransacao);
    const dataLancamento = new Date(lancamento.dataVencimento || lancamento.dataLancamento);
    const diffDias = Math.abs(
        (dataTransacao.getTime() - dataLancamento.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDias === 0) {
        score += 30;
    } else if (diffDias <= 3) {
        score += 15;
    } else if (diffDias <= 7) {
        score += 5;
    }

    // Descrição similar: +20 pontos
    const descricaoSimilar = calcularSimilaridadeTexto(
        transacao.descricao.toLowerCase(),
        lancamento.descricao.toLowerCase()
    );
    score += Math.round(descricaoSimilar * 20);

    return Math.min(score, 100);
}

/**
 * Calcula similaridade entre duas strings (0 a 1)
 * Usa algoritmo simplificado de palavras em comum
 */
function calcularSimilaridadeTexto(texto1: string, texto2: string): number {
    const palavras1 = texto1.split(/\s+/).filter(p => p.length > 2);
    const palavras2 = texto2.split(/\s+/).filter(p => p.length > 2);

    if (palavras1.length === 0 || palavras2.length === 0) return 0;

    const intersecao = palavras1.filter(p => palavras2.includes(p));
    return intersecao.length / Math.max(palavras1.length, palavras2.length);
}

/**
 * Determina o tipo de match baseado no score
 */
export function determinarTipoMatch(score: number): 'exato' | 'aproximado' | 'valor' | 'data' {
    if (score >= 80) return 'exato';
    if (score >= 50) return 'aproximado';
    if (score >= 30) return 'valor';
    return 'data';
}

/**
 * Valida se uma transação pode ser conciliada
 */
export function validarConciliacao(
    transacao: TransacaoImportada
): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (transacao.statusConciliacao === 'conciliado') {
        erros.push('Transação já está conciliada');
    }

    if (transacao.statusConciliacao === 'ignorado') {
        erros.push('Transação foi marcada como ignorada');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se uma transação pode ser desconciliada
 */
export function validarDesconciliacao(
    transacao: TransacaoComConciliacao
): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (transacao.statusConciliacao !== 'conciliado') {
        erros.push('Transação não está conciliada');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Verifica se o tipo de transação corresponde ao tipo de lançamento
 */
export function tiposCorrespondem(
    tipoTransacao: TipoTransacao,
    tipoLancamento: 'receita' | 'despesa'
): boolean {
    return (
        (tipoTransacao === 'credito' && tipoLancamento === 'receita') ||
        (tipoTransacao === 'debito' && tipoLancamento === 'despesa')
    );
}

/**
 * Gera hash único para identificar transação duplicada
 */
export function gerarHashTransacao(
    contaBancariaId: number,
    dataTransacao: string,
    valor: number,
    descricao: string
): string {
    const dados = `${contaBancariaId}|${dataTransacao}|${valor.toFixed(2)}|${descricao.trim().toLowerCase()}`;
    // Hash simples (em produção usar crypto)
    let hash = 0;
    for (let i = 0; i < dados.length; i++) {
        const char = dados.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Filtra lançamentos candidatos para conciliação
 */
export function filtrarCandidatos(
    transacao: TransacaoImportada,
    lancamentos: Lancamento[],
    scoreMinimo: number = 30
): SugestaoConciliacao[] {
    const tipoEsperado = transacao.tipoTransacao === 'credito' ? 'receita' : 'despesa';

    return lancamentos
        .filter(l => l.tipo === tipoEsperado && l.status === 'pendente')
        .map(lancamento => {
            const score = calcularScoreConciliacao(transacao, lancamento);
            return {
                lancamentoId: lancamento.id,
                lancamento,
                score,
                diferencas: gerarDiferencas(transacao, lancamento),
                tipoMatch: determinarTipoMatch(score)
            };
        })
        .filter(s => s.score >= scoreMinimo)
        .sort((a, b) => b.score - a.score);
}

/**
 * Gera lista de diferenças entre transação e lançamento
 */
function gerarDiferencas(transacao: TransacaoImportada, lancamento: Lancamento): string[] {
    const diferencas: string[] = [];

    const diffValor = Math.abs(transacao.valor - lancamento.valor);
    if (diffValor > 0.01) {
        diferencas.push(`Diferença de valor: R$ ${diffValor.toFixed(2)}`);
    }

    const dataTransacao = new Date(transacao.dataTransacao);
    const dataLancamento = new Date(lancamento.dataVencimento || lancamento.dataLancamento);
    const diffDias = Math.round(
        (dataTransacao.getTime() - dataLancamento.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDias !== 0) {
        diferencas.push(`Diferença de ${Math.abs(diffDias)} dias`);
    }

    return diferencas;
}

// ============================================================================
// Constantes
// ============================================================================

export const STATUS_CONCILIACAO_LABELS: Record<StatusConciliacao, string> = {
    pendente: 'Pendente',
    conciliado: 'Conciliado',
    divergente: 'Divergente',
    ignorado: 'Ignorado'
};

export const TIPO_TRANSACAO_LABELS: Record<TipoTransacao, string> = {
    credito: 'Crédito',
    debito: 'Débito'
};

export const SCORE_MINIMO_AUTO_CONCILIACAO = 80;
export const SCORE_MINIMO_SUGESTAO = 30;
