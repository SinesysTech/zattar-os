/**
 * Domínio de Lançamentos Financeiros
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

// ============================================================================
// Tipos e Interfaces (From Types)
// ============================================================================

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

    // Expansões opcionais (quando a query faz join/lookup para UI)
    // Mantidas opcionais para compatibilidade com queries "flat".
    dadosAdicionais?: Record<string, unknown> | null;
    fornecedor?: {
        id: number;
        razaoSocial: string;
        nomeFantasia?: string;
        cnpj?: string | null;
    };
    contaContabil?: { id: number; codigo?: string; nome: string } | null;
    centroCusto?: { id: number; codigo?: string; nome: string } | null;
    contaBancaria?: { id: number; nome: string; banco?: string | null } | null;

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
    lancamentoOrigemId?: number;
}


// Aliases for compatibility with Contas Pagar components
export type StatusContaPagar = StatusLancamento;
export type FormaPagamentoContaPagar = FormaPagamento;
export type ContaPagarComDetalhes = Lancamento & {
    // Campos opcionais derivados/expandidos para UI
    categoria_nome?: string | null;
};

export interface ResumoVencimentos {
    vencidas: { quantidade: number; valorTotal: number };
    vencendoHoje: { quantidade: number; valorTotal: number };
    vencendoEm7Dias: { quantidade: number; valorTotal: number };
    vencendoEm30Dias: { quantidade: number; valorTotal: number };
}

export type ContasPagarFilters = ListarLancamentosParams & {
    categoria?: string;
};

// Aliases for compatibility with Contas Receber components
export type StatusContaReceber = StatusLancamento;
export type FormaRecebimentoContaReceber = FormaPagamento;
export type ContaReceberComDetalhes = Lancamento & {
    cliente?: { id: number; razaoSocial: string; nomeFantasia?: string; cnpj?: string | null };
    contrato?: { id: number; numero: string; descricao?: string };
    categoria_nome?: string;
};

/**
 * Recebimento parcial/total de uma conta a receber.
 * Este tipo é consumido pela UI de detalhes de "Contas a Receber".
 */
export interface RecebimentoContaReceber {
    id: number;
    valor: number;
    formaRecebimento: FormaPagamento;
    dataRecebimento: string;
    comprovante?: { url: string } | null;
    observacoes?: string | null;
}

export interface HistoricoRecebimentos {
    recebimentos: RecebimentoContaReceber[];
    valorTotalRecebido: number;
    valorPendente: number;
}

/**
 * Calcula histórico de recebimentos a partir do payload retornado pela API/hook.
 * Retorna null quando não há recebimentos.
 */
export function getHistoricoRecebimentos(conta: {
    valor: number;
    recebimentos?: RecebimentoContaReceber[] | null;
}): HistoricoRecebimentos | null {
    const recebimentos = conta.recebimentos ?? [];
    if (recebimentos.length === 0) return null;

    const valorTotalRecebido = recebimentos.reduce((acc, r) => acc + (r.valor || 0), 0);
    const valorPendente = Math.max(0, conta.valor - valorTotalRecebido);

    return {
        recebimentos,
        valorTotalRecebido,
        valorPendente,
    };
}

/**
 * Indica se a conta possui recebimentos, mas ainda há valor pendente.
 */
export function isParcialmenteRecebida(conta: {
    valor: number;
    recebimentos?: RecebimentoContaReceber[] | null;
}): boolean {
    const historico = getHistoricoRecebimentos(conta);
    if (!historico) return false;
    return historico.valorTotalRecebido > 0 && historico.valorPendente > 0;
}

export type ResumoInadimplencia = ResumoVencimentos;

export type ContasReceberFilters = ListarLancamentosParams & {
    categoria?: string;
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

// Alias para compatibilidade com a UI de Contas a Receber
export const FORMA_RECEBIMENTO_LABELS = FORMA_PAGAMENTO_LABELS;

export const FREQUENCIA_RECORRENCIA_LABELS: Record<FrequenciaRecorrencia, string> = {
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    bimestral: 'Bimestral',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual'
};
