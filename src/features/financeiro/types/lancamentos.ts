/**
 * Backwards-compatible type exports for the "financeiro" feature.
 *
 * Some modules (hooks/actions/components) import from `../types/lancamentos`.
 * The canonical source of truth is `domain/lancamentos.ts`, but this file keeps old paths working.
 */

export type {
  // Core entities
  Lancamento,
  AnexoLancamento,

  // Enums / unions
  TipoLancamento,
  StatusLancamento,
  OrigemLancamento,
  FormaPagamento,
  FrequenciaRecorrencia,

  // Params
  ListarLancamentosParams,
  ResumoVencimentos,

  // Aliases for Contas a Pagar
  ContaPagarComDetalhes,
  FormaPagamentoContaPagar,
  StatusContaPagar,
  ContasPagarFilters,

  // Aliases for Contas a Receber
  ContaReceberComDetalhes,
  FormaRecebimentoContaReceber,
  StatusContaReceber,
  ContasReceberFilters,
  ResumoInadimplencia,
} from '../domain/lancamentos';

// Runtime constants (enum-like) for backwards compatibility
export { TipoLancamento, StatusLancamento, OrigemLancamento } from '../domain/lancamentos';

