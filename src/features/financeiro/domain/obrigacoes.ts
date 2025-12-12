/**
 * Domínio de Obrigações Jurídicas
 * Foca na abstração de Acordos/Condenações e suas Parcelas
 */

import { Lancamento } from './lancamentos';
import type { TipoObrigacao as TipoObrigacaoBase } from '@/features/obrigacoes/types';

// ============================================================================
// Tipos e Interfaces (From Types)
// ============================================================================

export type TipoObrigacao =
    | 'acordo_recebimento'
    | 'acordo_pagamento';

export type StatusRepasse =
    | 'nao_aplicavel'        // Não há repasse (honorários puros ou despesa)
    | 'pendente_declaracao'  // Parcela recebida, falta anexar declaração
    | 'pendente_transferencia' // Declaração OK, falta transferir
    | 'repassado';           // Transferência confirmada

/**
 * Estrutura de Split de Pagamento
 * Define como o valor de uma parcela recebida é distribuído
 */
export interface SplitPagamento {
    valorTotal: number;           // Valor total da parcela
    valorPrincipal: number;       // Valor referente ao crédito principal
    honorariosContratuais: number; // % sobre êxito/principal para o escritório
    honorariosSucumbenciais: number; // 100% para o escritório
    valorRepasseCliente: number;  // Valor líquido para o cliente
    valorEscritorio: number;      // Total receita escritório (Contratuais + Sucumbenciais)

    // Percentuais aplicados
    percentualEscritorio: number; // % do acordo para o escritório
    percentualCliente: number;    // % do acordo para o cliente (complementar)
}

/**
 * Parcela de Acordo com dados expandidos de financeiro
 */
export interface ParcelaObrigacao {
    id: number;
    acordoId: number;
    numeroParcela: number;

    // Valores
    valor: number;
    valorBrutoCreditoPrincipal: number;
    honorariosContratuais: number;
    honorariosSucumbenciais: number;
    valorRepasseCliente: number; // Campo persistido para rastreio

    // Datas
    dataVencimento: string;
    dataPagamento: string | null;

    // Status
    status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
    statusRepasse: StatusRepasse;

    // Relacionamento Financeiro
    lancamentoId: number | null;
    formaPagamento?: string | null; // Adicionando campo faltante nas parcelas
    lancamento?: Lancamento; // Dados do lançamento vinculado (se houver)

    // Documentos de Repasse
    declaracaoPrestacaoContasUrl: string | null;
    comprovanteRepasseUrl: string | null;
    dataRepasse: string | null;
}

/**
 * Obrigação Consolidada (Bridges Agreement -> Finance)
 */
export interface ObrigacaoJuridica {
    id: number; // ID do Acordo/Condenação
    tipo: TipoObrigacaoBase;
    direcao: 'recebimento' | 'pagamento';

    // Contexto
    processoId: number | null;
    clienteId: number | null;
    parteContrariaId: number | null;

    // Valores Consolidados
    valorTotal: number;
    saldoDevedor: number;

    // Configuracao Split
    percentualHonorarios: number; // Contratuais

    // Lista de Parcelas
    parcelas: ParcelaObrigacao[];
}

// ============================================================================
// Tipos de View/Componentes
// ============================================================================

export type StatusObrigacao = 'pendente' | 'vencida' | 'efetivada' | 'cancelada' | 'estornada';
export type StatusSincronizacao = 'sincronizado' | 'pendente' | 'inconsistente' | 'nao_aplicavel';

export interface ObrigacaoComDetalhes {
    id: number;
    tipo: TipoObrigacao;
    descricao: string;
    valor: number;
    dataVencimento: string;
    status: StatusObrigacao;
    statusSincronizacao: StatusSincronizacao;

    // Auxiliares de UI
    diasAteVencimento: number | null;
    tipoEntidade: 'parcela' | 'obrigacao'; // Se é uma parcela individual ou uma obrigação agrupada

    // Datas
    dataLancamento?: string | null;
    dataEfetivacao?: string | null;
    dataCompetencia?: string | null;

    // Relacionamentos IDs
    clienteId?: number | null;
    processoId?: number | null;
    acordoId?: number | null;
    lancamentoId?: number | null;

    // Relacionamentos Expandidos
    cliente?: {
        id: number;
        nome: string;
        razaoSocial?: string;
        cpfCnpj?: string;
    };
    processo?: {
        id: number;
        numeroProcesso: string;
        autor?: string;
        reu?: string;
        vara?: string;
        tribunal?: string;
    };
    acordo?: {
        id: number;
        tipo: TipoObrigacaoBase;
        direcao: 'recebimento' | 'pagamento';
        valorTotal: number;
        numeroParcelas: number;
    };
    parcela?: {
        id: number;
        numeroParcela: number;
        status: string;
        valorBrutoCreditoPrincipal: number;
        honorariosContratuais: number;
        formaPagamento?: string | null;
    };
    lancamento?: {
        id: number;
        tipo: 'receita' | 'despesa';
        status: string;
        dataLancamento?: string;
    };
    contaContabil?: {
        id: number;
        codigo: string;
        nome: string;
    };

    percentualHonorarios?: number | null;
}

export interface ResumoObrigacoes {
    vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
    pendentes: { quantidade: number; valor: number };
    efetivadas: { quantidade: number; valor: number };
    porTipo: Array<{
        tipo: TipoObrigacao | 'conta_receber' | 'conta_pagar';
        quantidade: number;
        valorTotal: number;
        valorTotalPendente: number;
    }>;
}

export interface ObrigacoesFilters {
    tipo?: TipoObrigacao;
    status?: StatusObrigacao;
    statusSincronizacao?: StatusSincronizacao;
    dataVencimentoInicio?: string;
    dataVencimentoFim?: string;
    clienteId?: number;
    processoId?: number;
    busca?: string;
}

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
