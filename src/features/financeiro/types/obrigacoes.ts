/**
 * Backwards-compatible type exports for the "financeiro" feature.
 *
 * Some modules (hooks/actions/components) import from `../types/obrigacoes`.
 * The canonical source of truth is `domain/obrigacoes.ts`, but this file keeps old paths working.
 */

export type {
  // Core entities
  ParcelaObrigacao,
  ObrigacaoJuridica,
  ObrigacaoComDetalhes,
  ResumoObrigacoes,

  // Enums / unions
  TipoObrigacao,
  StatusObrigacao,
  StatusSincronizacao,
  StatusRepasse,

  // Filters
  ObrigacoesFilters,
} from '../domain/obrigacoes';

