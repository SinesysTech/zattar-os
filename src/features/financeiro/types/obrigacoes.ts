import { Lancamento, StatusLancamento } from './lancamentos';

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
    tipo: 'acordo' | 'condenacao';
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
