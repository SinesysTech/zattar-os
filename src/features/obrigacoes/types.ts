/**
 * Backwards-compatible type exports for the "obrigacoes" feature.
 *
 * Some modules (hooks/actions/components) import from `../types` or `../../types`.
 * The canonical source of truth is `domain.ts`, but this file keeps old paths working.
 */

export type {
  // Core entities
  AcordoCondenacao,
  AcordoComParcelas,
  Parcela,
  ParcelaComLancamento,
  ProcessoInfo,
  RepassePendente,

  // Enums / unions
  TipoObrigacao,
  DirecaoPagamento,
  FormaDistribuicao,
  StatusAcordo,
  StatusParcela,
  StatusRepasse,
  FormaPagamento,

  // Params
  CriarAcordoComParcelasParams,
  AtualizarAcordoParams,
  ListarAcordosParams,
  MarcarParcelaRecebidaParams,
  AtualizarParcelaParams,
  FiltrosRepasses,
  RegistrarRepasseParams,
  AcordosCondenacoesPaginado,
} from './domain';


