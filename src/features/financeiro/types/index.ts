/**
 * Central export point for all financeiro types
 *
 * ⚠️ Estes são re-exports para compatibilidade com código legado.
 * A fonte canônica dos tipos está em domain/*.ts
 */

// ============================================================================
// Lancamentos Types (re-exports do domain)
// ============================================================================
export type {
  Lancamento,
  AnexoLancamento,
  TipoLancamento,
  StatusLancamento,
  OrigemLancamento,
  FormaPagamento,
  FrequenciaRecorrencia,
  ListarLancamentosParams,
  ResumoVencimentos,
  ContaPagarComDetalhes,
  FormaPagamentoContaPagar,
  StatusContaPagar,
  ContasPagarFilters,
  ContaReceberComDetalhes,
  FormaRecebimentoContaReceber,
  StatusContaReceber,
  ContasReceberFilters,
  ResumoInadimplencia,
} from './lancamentos';

// Runtime constants (enum-like) for backwards compatibility
export { TipoLancamento, StatusLancamento, OrigemLancamento } from '../domain/lancamentos';

// ============================================================================
// Conciliacao Types (re-exports do domain)
// ============================================================================
export type {
  ConciliacaoBancaria,
  TransacaoImportada,
  TransacaoComConciliacao,
  LancamentoFinanceiroResumo,
  SugestaoConciliacao,
  StatusConciliacao,
  TipoTransacao,
  ImportarExtratoDTO,
  ImportarExtratoResponse,
  ConciliarManualDTO,
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  BuscarLancamentosCandidatosParams,
  ConciliacaoFilters,
} from './conciliacao';
