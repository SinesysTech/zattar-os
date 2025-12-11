import { Lancamento } from './lancamentos';

export type TipoTransacao = 'credito' | 'debito';
export type StatusConciliacao = 'pendente' | 'conciliado' | 'divergente' | 'ignorado';

export interface Conciliacao {
    id: number;
    data_conciliacao: string;
    saldo_banco: number;
    saldo_sistema: number;
    diferenca: number;
}

export interface TransacaoImportada {
    id: number;
    contaBancariaId: number;
    dataTransacao: string;
    descricao: string;
    valor: number; // Valor absoluto
    tipoTransacao: TipoTransacao;
    documento: string | null;
    hashInfo: string; // Para evitar duplicatas
    
    // Metadados
    bancoOriginal?: string;
    categoriaOriginal?: string;
    
    // Status
    statusConciliacao?: StatusConciliacao;
    lancamentoVinculadoId?: number | null;
}

export interface ConciliacaoBancaria {
    id: number;
    transacaoImportadaId: number;
    lancamentoFinanceiroId?: number | null;
    dataConciliacao: string;
    status: StatusConciliacao;
    diferencaValor: number;
    usuarioId: string;
    observacoes?: string | null;
}

export interface TransacaoComConciliacao extends TransacaoImportada {
    conciliacao?: ConciliacaoBancaria | null;
    lancamentoVinculado?: Lancamento | null;
}

export interface SugestaoConciliacao {
    lancamentoId: number;
    lancamento: Lancamento;
    score: number; // 0-100
    diferencas: string[]; // Motivos da sugestão ou divergências
    tipoMatch: 'exato' | 'aproximado' | 'valor' | 'data';
}

export interface LancamentoFinanceiroResumo {
    id: number;
    descricao: string;
    dataLancamento: string;
    valor: number;
    tipo: 'receita' | 'despesa';
    conciliado: boolean;
}

// DTOs
export interface ImportarExtratoDTO {
    contaBancariaId: number;
    tipoArquivo: 'ofx' | 'csv';
    arquivo: File;
    nomeArquivo: string;
}

export interface ImportarExtratoResponse {
    processados: number;
    importados: number;
    duplicados: number;
    erros: number;
}

export interface ConciliarManualDTO {
    transacaoImportadaId: number;
    lancamentoFinanceiroId: number | null; // null se for "ignorar" ou criar novo
    criarNovoLancamento?: boolean;
    dadosNovoLancamento?: Partial<Lancamento>;
}

export interface ConciliarAutomaticaDTO {
    contaBancariaId: number;
    dataInicio?: string;
    dataFim?: string;
}

export interface ConciliacaoResult {
    transacaoId: number;
    lancamentoId: number;
    sucesso: boolean;
    mensagem?: string;
}

export interface ListarTransacoesImportadasParams {
    contaBancariaId?: number;
    dataInicio?: string;
    dataFim?: string;
    statusConciliacao?: StatusConciliacao | StatusConciliacao[];
    tipoTransacao?: TipoTransacao;
    busca?: string;
    pagina?: number;
    limite?: number;
    ordenarPor?: string;
    ordem?: 'asc' | 'desc';
}

export interface ListarTransacoesResponse {
    items: TransacaoComConciliacao[];
    paginacao: {
        pagina: number;
        limite: number;
        total: number;
        totalPaginas: number;
    };
    resumo: {
        totalPendentes: number;
        totalConciliadas: number;
        totalDivergentes: number;
        totalIgnoradas: number;
    };
}

export interface ConciliacaoFilters {
    contaBancariaId?: number;
    dataInicio?: string;
    dataFim?: string;
    statusConciliacao?: StatusConciliacao | StatusConciliacao[];
    tipoTransacao?: TipoTransacao;
    busca?: string;
}

export interface BuscarLancamentosCandidatosParams {
    contaBancariaId?: number;
    tipo: 'receita' | 'despesa';
    valorMin?: number;
    valorMax?: number;
    dataInicio?: string;
    dataFim?: string;
}
