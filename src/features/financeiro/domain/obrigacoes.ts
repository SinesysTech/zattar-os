/**
 * Domínio de Obrigações Jurídicas
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

import type {
    ObrigacaoJuridica,
    ParcelaObrigacao,
    SplitPagamento,
    TipoObrigacao,
    StatusRepasse,
    StatusObrigacao,
    StatusSincronizacao,
    ObrigacaoComDetalhes,
    ResumoObrigacoes
} from '../types/obrigacoes';
import type { Lancamento } from '../types/lancamentos';

// Re-export types for convenience
export type {
    ObrigacaoJuridica,
    ParcelaObrigacao,
    SplitPagamento,
    TipoObrigacao,
    StatusRepasse,
    StatusObrigacao,
    StatusSincronizacao,
    ObrigacaoComDetalhes,
    ResumoObrigacoes
};

// ============================================================================
// Regras de Negócio
// ============================================================================

/**
 * Calcula o split de pagamento para uma parcela
 * Regras:
 * - Sucumbência: 100% escritório
 * - Contratuais: % sobre o êxito (principal + juros)
 * - Restante: Cliente
 */
export function calcularSplitPagamento(
    valorPrincipal: number,
    honorariosSucumbenciais: number,
    percentualHonorariosContratuais: number = 30
): SplitPagamento {
    // Honorários contratuais incidem sobre o valor principal (êxito)
    const valorHonorariosContratuais = valorPrincipal * (percentualHonorariosContratuais / 100);

    // Valor líquido para o cliente é o principal menos a parte do escritório
    const valorRepasseCliente = valorPrincipal - valorHonorariosContratuais;

    // Total do escritório = Contratuais + Sucumbenciais
    const valorEscritorio = valorHonorariosContratuais + honorariosSucumbenciais;

    // Valor total da parcela
    const valorTotal = valorPrincipal + honorariosSucumbenciais;

    return {
        valorTotal,
        valorPrincipal,
        honorariosContratuais: valorHonorariosContratuais,
        honorariosSucumbenciais,
        valorRepasseCliente,
        valorEscritorio,
        percentualEscritorio: percentualHonorariosContratuais,
        percentualCliente: 100 - percentualHonorariosContratuais
    };
}

/**
 * Valida integridade de uma parcela
 */
export function validarIntegridadeParcela(
    parcela: ParcelaObrigacao,
    direcao: 'recebimento' | 'pagamento'
): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // 1. Parcela recebida/paga deve ter forma de pagamento
    if (['recebida', 'paga'].includes(parcela.status)) {
        const temFormaPagamento = !!parcela.formaPagamento || !!parcela.lancamento?.formaPagamento;
        if (!temFormaPagamento) {
            erros.push(
                `Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) está ${parcela.status} mas não possui forma de pagamento.`
            );
        }
    }

    // 2. Regra de Repasse: Se há repasse cliente, verificar status
    if (direcao === 'recebimento' && parcela.valorRepasseCliente > 0) {
        const statusValidosRepasse: StatusRepasse[] = ['pendente_declaracao', 'pendente_transferencia', 'repassado'];
        if (parcela.status === 'recebida' && !statusValidosRepasse.includes(parcela.statusRepasse)) {
            erros.push(
                `Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) tem valor de repasse mas status de repasse inválido (${parcela.statusRepasse}).`
            );
        }
    }

    // 3. Não permitir cancelamento se já repassado
    if (parcela.statusRepasse === 'repassado') {
        const lancamento = parcela.lancamento;
        if (lancamento && lancamento.status === 'cancelado') {
            erros.push('Não é permitido cancelar lançamento de parcela já repassada ao cliente.');
        }
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Verifica se uma parcela pode ser sincronizada para o financeiro
 */
export function podeSerSincronizada(parcela: ParcelaObrigacao): boolean {
    // Apenas parcelas com status relevante podem gerar lançamentos
    return ['pendente', 'recebida', 'paga', 'atrasada'].includes(parcela.status);
}

/**
 * Verifica se uma parcela precisa de sincronização
 */
export function precisaSincronizacao(parcela: ParcelaObrigacao): boolean {
    // Parcela confirmada (recebida/paga) sem lançamento vinculado precisa de sincronização
    if (['recebida', 'paga'].includes(parcela.status) && !parcela.lancamentoId) {
        return true;
    }

    return false;
}

/**
 * Determina o status de sincronização de uma parcela
 */
export function determinarStatusSincronizacao(parcela: ParcelaObrigacao): StatusSincronizacao {
    // Se tem lançamento, está sincronizado
    if (parcela.lancamentoId) {
        return 'sincronizado';
    }

    // Se está confirmada mas sem lançamento, está inconsistente
    if (['recebida', 'paga'].includes(parcela.status)) {
        return 'inconsistente';
    }

    // Se está pendente, ainda não precisa de lançamento
    if (parcela.status === 'pendente') {
        return 'pendente';
    }

    return 'nao_aplicavel';
}

/**
 * Verifica se um repasse pode ser iniciado
 */
export function podeIniciarRepasse(parcela: ParcelaObrigacao): { pode: boolean; motivo?: string } {
    if (parcela.status !== 'recebida') {
        return { pode: false, motivo: 'Parcela ainda não foi recebida' };
    }

    if (parcela.valorRepasseCliente <= 0) {
        return { pode: false, motivo: 'Não há valor a repassar ao cliente' };
    }

    if (parcela.statusRepasse === 'repassado') {
        return { pode: false, motivo: 'Repasse já foi realizado' };
    }

    return { pode: true };
}

/**
 * Verifica se um repasse pode ser finalizado
 */
export function podeFinalizarRepasse(parcela: ParcelaObrigacao): { pode: boolean; motivo?: string } {
    if (parcela.statusRepasse !== 'pendente_transferencia') {
        return { pode: false, motivo: 'Parcela não está aguardando transferência' };
    }

    if (!parcela.declaracaoPrestacaoContasUrl) {
        return { pode: false, motivo: 'Declaração de prestação de contas não anexada' };
    }

    return { pode: true };
}

/**
 * Calcula o saldo devedor de uma obrigação
 */
export function calcularSaldoDevedor(obrigacao: ObrigacaoJuridica): number {
    const totalPago = obrigacao.parcelas
        .filter(p => ['recebida', 'paga'].includes(p.status))
        .reduce((acc, p) => acc + p.valor, 0);

    return obrigacao.valorTotal - totalPago;
}

/**
 * Calcula o total de repasses pendentes
 */
export function calcularRepassesPendentes(obrigacao: ObrigacaoJuridica): number {
    return obrigacao.parcelas
        .filter(p => p.statusRepasse === 'pendente_transferencia')
        .reduce((acc, p) => acc + p.valorRepasseCliente, 0);
}

/**
 * Determina o status da obrigação baseado nas parcelas
 */
export function determinarStatusObrigacao(parcelas: ParcelaObrigacao[]): StatusObrigacao {
    if (parcelas.length === 0) return 'pendente';

    const todasCanceladas = parcelas.every(p => p.status === 'cancelada');
    if (todasCanceladas) return 'cancelada';

    const todasEfetivadas = parcelas.every(p => ['recebida', 'paga'].includes(p.status));
    if (todasEfetivadas) return 'efetivada';

    const algumVencida = parcelas.some(p => p.status === 'atrasada');
    if (algumVencida) return 'vencida';

    return 'pendente';
}

// ============================================================================
// Constantes
// ============================================================================

export const STATUS_REPASSE_LABELS: Record<StatusRepasse, string> = {
    nao_aplicavel: 'Não Aplicável',
    pendente_declaracao: 'Pendente Declaração',
    pendente_transferencia: 'Pendente Transferência',
    repassado: 'Repassado'
};

export const STATUS_OBRIGACAO_LABELS: Record<StatusObrigacao, string> = {
    pendente: 'Pendente',
    vencida: 'Vencida',
    efetivada: 'Efetivada',
    cancelada: 'Cancelada',
    estornada: 'Estornada'
};

export const STATUS_SINCRONIZACAO_LABELS: Record<StatusSincronizacao, string> = {
    sincronizado: 'Sincronizado',
    pendente: 'Pendente',
    inconsistente: 'Inconsistente',
    nao_aplicavel: 'N/A'
};

export const TIPO_OBRIGACAO_LABELS: Record<TipoObrigacao, string> = {
    acordo_recebimento: 'Acordo de Recebimento',
    acordo_pagamento: 'Acordo de Pagamento'
};

export const PERCENTUAL_HONORARIOS_PADRAO = 30;
