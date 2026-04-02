/**
 * Backwards-compatible type exports for conciliacao feature.
 *
 * Some modules (hooks/actions/components) import from `../types/conciliacao`.
 * The canonical source of truth is `domain/conciliacao.ts`, but this file keeps old paths working.
 */

export type {
  // Core entities
  ConciliacaoBancaria,
  TransacaoImportada,
  TransacaoComConciliacao,
  LancamentoFinanceiroResumo,
  SugestaoConciliacao,

  // Enums / unions
  StatusConciliacao,
  TipoTransacao,

  // DTOs / Params
  ImportarExtratoDTO,
  ImportarExtratoResponse,
  ConciliarManualDTO,
  ConciliarAutomaticaDTO,
  ConciliacaoResult,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  BuscarLancamentosCandidatosParams,
  ConciliacaoFilters,
} from '../domain/conciliacao';

