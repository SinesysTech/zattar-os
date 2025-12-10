/**
 * Tipos para Orçamentos
 * Definidos localmente na feature financeiro
 */

// ============================================================================
// Enums e tipos literais
// ============================================================================

export type StatusOrcamento = 'rascunho' | 'aprovado' | 'em_execucao' | 'encerrado' | 'cancelado';
export type PeriodoOrcamento = 'mensal' | 'trimestral' | 'semestral' | 'anual';

// ============================================================================
// Interfaces - Entidades principais
// ============================================================================

export interface Orcamento {
    id: number;
    nome: string;
    descricao?: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
    status: StatusOrcamento;
    valorTotal: number;
    observacoes?: string;
    aprovadoPor?: string;
    aprovadoEm?: string;
    encerradoPor?: string;
    encerradoEm?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface OrcamentoItem {
    id: number;
    orcamentoId: number;
    contaContabilId: number;
    centroCustoId?: number;
    descricao: string;
    valorPrevisto: number;
    valorRealizado: number;
    observacoes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrcamentoItemComDetalhes extends OrcamentoItem {
    contaContabil?: {
        id: number;
        codigo: string;
        nome: string;
        tipo: string;
    };
    centroCusto?: {
        id: number;
        codigo: string;
        nome: string;
    };
    percentualExecutado: number;
    desvio: number;
    desvioPercentual: number;
}

export interface OrcamentoComItens extends Orcamento {
    itens: OrcamentoItem[];
}

export interface OrcamentoComDetalhes extends Orcamento {
    itens: OrcamentoItemComDetalhes[];
    resumo?: ResumoOrcamentario;
}

// ============================================================================
// DTOs - Criação e Atualização
// ============================================================================

export interface CriarOrcamentoDTO {
    nome: string;
    descricao?: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
    observacoes?: string;
    itens?: CriarOrcamentoItemDTO[];
}

export interface AtualizarOrcamentoDTO {
    nome?: string;
    descricao?: string;
    observacoes?: string;
    dataInicio?: string;
    dataFim?: string;
}

export interface CriarOrcamentoItemDTO {
    contaContabilId: number;
    centroCustoId?: number;
    descricao: string;
    valorPrevisto: number;
    observacoes?: string;
}

export interface AtualizarOrcamentoItemDTO {
    descricao?: string;
    valorPrevisto?: number;
    observacoes?: string;
}

export interface AprovarOrcamentoDTO {
    observacoes?: string;
}

export interface EncerrarOrcamentoDTO {
    observacoes?: string;
}

export interface DuplicarOrcamentoDTO {
    nome: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
}

// ============================================================================
// Interfaces - Análise e Comparativos
// ============================================================================

export interface ResumoOrcamentario {
    totalPrevisto: number;
    totalRealizado: number;
    saldo: number;
    percentualExecutado: number;
    itensAcimaMeta: number;
    itensAbaixoMeta: number;
    itensDentroMeta: number;
}

export interface AnaliseOrcamentariaItem {
    id: number;
    descricao: string;
    contaContabil: string;
    centroCusto?: string;
    valorPrevisto: number;
    valorRealizado: number;
    desvio: number;
    desvioPercentual: number;
    status: 'dentro_meta' | 'acima_meta' | 'abaixo_meta';
}

export interface AlertaDesvio {
    itemId: number;
    descricao: string;
    tipo: 'critico' | 'alerta' | 'informativo';
    mensagem: string;
    desvioPercentual: number;
}

export interface ProjecaoItem {
    mes: string;
    valorPrevisto: number;
    valorRealizado: number;
    valorProjetado: number;
}

export interface AnaliseOrcamentaria {
    itens: AnaliseOrcamentariaItem[];
    resumo: ResumoOrcamentario;
    alertas: AlertaDesvio[];
    evolucao?: ProjecaoItem[];
}

export interface EvolucaoMensal {
    mes: number;
    mesNome: string;
    valorPrevisto: number;
    valorRealizado: number;
    percentualExecutado: number;
}

export interface ItemAnalise extends AnaliseOrcamentariaItem {}

export interface AlertaOrcamentario extends AlertaDesvio {}

export interface ProjecaoOrcamentaria {
    projecao: ProjecaoItem[];
    resumo: ResumoOrcamentario;
}

export interface ComparativoOrcamento {
    orcamentoAtual: OrcamentoComDetalhes;
    orcamentoAnterior?: OrcamentoComDetalhes;
    variacoes: {
        totalPrevisto: number;
        totalRealizado: number;
        percentualVariacao: number;
    };
}

// ============================================================================
// Interfaces - Listagem e Filtros
// ============================================================================

export interface ListarOrcamentosParams {
    pagina?: number;
    limite?: number;
    busca?: string;
    ano?: number;
    periodo?: PeriodoOrcamento;
    status?: StatusOrcamento | StatusOrcamento[];
    ordenarPor?: 'nome' | 'ano' | 'periodo' | 'status' | 'data_inicio' | 'created_at';
    ordem?: 'asc' | 'desc';
}

export interface ListarOrcamentosResponse {
    items: OrcamentoComItens[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export interface OperacaoOrcamentoResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: Orcamento;
}

export interface OrcamentosFilters {
    ano?: number;
    periodo?: PeriodoOrcamento;
    status?: StatusOrcamento;
    busca?: string;
}

// ============================================================================
// Validation helpers
// ============================================================================

export function isStatusValido(status: string): status is StatusOrcamento {
    return ['rascunho', 'aprovado', 'em_execucao', 'encerrado', 'cancelado'].includes(status);
}

export function isPeriodoValido(periodo: string): periodo is PeriodoOrcamento {
    return ['mensal', 'trimestral', 'semestral', 'anual'].includes(periodo);
}

export function validarCriarOrcamentoDTO(dto: CriarOrcamentoDTO): boolean {
    if (!dto.nome || !dto.ano || !dto.periodo || !dto.dataInicio || !dto.dataFim) return false;
    if (!isPeriodoValido(dto.periodo)) return false;
    if (new Date(dto.dataInicio) > new Date(dto.dataFim)) return false;
    return true;
}

export function validarAtualizarOrcamentoDTO(dto: AtualizarOrcamentoDTO): boolean {
    // Pelo menos um campo deve ser fornecido
    return Object.keys(dto).length > 0;
}
