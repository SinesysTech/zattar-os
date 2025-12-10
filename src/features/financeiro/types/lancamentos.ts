export type TipoLancamento = 'receita' | 'despesa';

export type StatusLancamento =
    | 'pendente'
    | 'confirmado' // Pago ou Recebido
    | 'cancelado'
    | 'estornado';

export type OrigemLancamento =
    | 'manual'
    | 'acordo_judicial'
    | 'contrato'
    | 'folha_pagamento'
    | 'importacao_bancaria'
    | 'recorrente';

export type FormaPagamento =
    | 'dinheiro'
    | 'transferencia_bancaria'
    | 'ted'
    | 'pix'
    | 'boleto'
    | 'cartao_credito'
    | 'cartao_debito'
    | 'cheque'
    | 'deposito_judicial';

export type FrequenciaRecorrencia =
    | 'semanal'
    | 'quinzenal'
    | 'mensal'
    | 'bimestral'
    | 'trimestral'
    | 'semestral'
    | 'anual';

export interface AnexoLancamento {
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
    uploadedAt: string;
    uploadedBy?: number;
}

/**
 * Interface base para qualquer lançamento financeiro
 */
export interface Lancamento {
    id: number;
    tipo: TipoLancamento;

    // Identificação
    descricao: string;
    valor: number;

    // Datas
    dataLancamento: string;
    dataCompetencia: string;
    dataVencimento: string | null;
    dataEfetivacao: string | null; // Data do pagamento/recebimento

    // Status e Classificação
    status: StatusLancamento;
    origem: OrigemLancamento;
    formaPagamento: FormaPagamento | null;

    // Contábil
    contaBancariaId: number | null;
    contaContabilId: number;
    centroCustoId: number | null;

    // Metadados
    documento: string | null;
    observacoes: string | null;
    categoria: string | null;

    // Relacionamentos Comuns
    clienteId: number | null; // Fornecedor (pagar) ou Cliente (receber)
    processoId: number | null;
    contratoId: number | null;
    parcelaId: number | null; // Vínculo com obrigação judicial
    acordoCondenacaoId?: number | null; // Adicionando campo faltante


    // Recorrência
    recorrente: boolean;
    frequenciaRecorrencia: FrequenciaRecorrencia | null;
    lancamentoOrigemId: number | null;

    anexos: AnexoLancamento[];

    createdAt: string;
    updatedAt: string;
    createdBy: number | null;
}

/**
 * Filtros para listagem de lançamentos
 */
export interface ListarLancamentosParams {
    pagina?: number;
    limite?: number;
    busca?: string;
    tipo?: TipoLancamento;
    status?: StatusLancamento | StatusLancamento[];
    dataVencimentoInicio?: string;
    dataVencimentoFim?: string;
    dataCompetenciaInicio?: string;
    dataCompetenciaFim?: string;
    pessoaId?: number; // Cliente ou Fornecedor
    contaContabilId?: number;
    centroCustoId?: number;
    contaBancariaId?: number;
    origem?: OrigemLancamento;
    recorrente?: boolean;
}
