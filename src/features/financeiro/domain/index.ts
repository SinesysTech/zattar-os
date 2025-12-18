/**
 * Barrel export para Domain Layer do módulo financeiro
 *
 * NOTA: orcamentos e dre são exportados como namespaces para evitar conflitos
 * de nomes entre símbolos como MESES, TENDENCIA_LABELS, calcularVariacao, etc.
 */

// Módulos sem conflitos - export direto
export * from './lancamentos';
export * from './conciliacao';
export * from './obrigacoes';
export * from './plano-contas';
export * from './fluxo-caixa';
export * from './relatorios';

// Módulos com conflitos - exportados como namespace para evitar colisões
// Os consumidores devem usar: orcamentosTypes.MESES ou dreTypes.MESES
export * as orcamentosTypes from './orcamentos';
export * as dreTypes from './dre';

// Re-exportar tipos que são únicos e não conflitam (para conveniência)
export type {
  // Orçamentos
  Orcamento,
  OrcamentoItem,
  OrcamentoItemComDetalhes,
  OrcamentoComItens,
  OrcamentoComDetalhes,
  StatusOrcamento,
  PeriodoOrcamento,
  CriarOrcamentoDTO,
  AtualizarOrcamentoDTO,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
  AprovarOrcamentoDTO,
  EncerrarOrcamentoDTO,
  DuplicarOrcamentoDTO,
  ResumoOrcamentario,
  AnaliseOrcamentariaItem,
  AlertaDesvio,
  ProjecaoItem,
  AnaliseOrcamentaria,
  EvolucaoMensal,
  ProjecaoOrcamentaria,
  ComparativoOrcamento,
  ListarOrcamentosParams,
  ListarOrcamentosResponse,
  OperacaoOrcamentoResult,
  OrcamentosFilters,
  StatusItemOrcamento,
  TendenciaOrcamento,
  SeveridadeAlerta,
  ItemAnalise,
  AlertaOrcamentario,
} from './orcamentos';

export type {
  // DRE
  DRE,
  ResumoDRE,
  PeriodoDRE,
  TipoComparativo,
  TipoConta,
  TendenciaDRE,
  ItemDRE,
  CategoriaDRE,
  VariacaoDRE,
  VariacoesDRE,
  ComparativoDRE,
  EvolucaoDRE,
  GerarDREDTO,
  ListarDREsParams,
  BuscarEvolucaoParams,
  DREResponse,
  GrupoDRE,
} from './dre';
