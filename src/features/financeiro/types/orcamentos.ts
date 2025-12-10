/**
 * Re-exportar tipos de Orçamentos do backend
 */
export type {
    StatusOrcamento,
    PeriodoOrcamento,
    Orcamento,
    OrcamentoItem,
    OrcamentoItemComDetalhes,
    OrcamentoComItens,
    OrcamentoComDetalhes,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
    CriarOrcamentoItemDTO,
    AtualizarOrcamentoItemDTO,
    AprovarOrcamentoDTO,
    EncerrarOrcamentoDTO,
    DuplicarOrcamentoDTO,
    ComparativoOrcamento,
    ListarOrcamentosParams,
    ListarOrcamentosResponse,
    OperacaoOrcamentoResult,
    OrcamentosFilters,
    // Tipos de Análise
    ResumoOrcamentario,
    AnaliseOrcamentariaItem,
    AlertaDesvio,
    ProjecaoItem,
    AnaliseOrcamentaria,
    EvolucaoMensal,
    ItemAnalise,
    AlertaOrcamentario,
    ProjecaoOrcamentaria,
} from '@/backend/types/financeiro/orcamento.types';
