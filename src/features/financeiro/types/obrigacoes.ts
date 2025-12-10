import { Lancamento, StatusLancamento } from './lancamentos';
import type { TipoObrigacao as TipoObrigacaoBase } from '@/features/obrigacoes/types';

/**
 * Domínio de Obrigações Jurídicas
 * Foca na abstração de Acordos/Condenações e suas Parcelas
 */

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
