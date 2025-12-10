
// Types
export type {
  AcordoCondenacao,
  Parcela,
  AcordoComParcelas,
  ParcelaComLancamento,
  TipoObrigacao,
  DirecaoPagamento,
  StatusAcordo,
  StatusParcela,
  StatusRepasse,
  CriarAcordoComParcelasParams,
  ListarAcordosParams,
  AtualizarAcordoParams,
  ProcessoInfo,
  RepassePendente,
  FiltrosRepasses,
  RegistrarRepasseParams,
  MarcarParcelaRecebidaParams,
  AtualizarParcelaParams
} from './types';

// Domain
export {
  acordoCondenacaoSchema,
  parcelaSchema,
  TIPO_LABELS,
  DIRECAO_LABELS,
  STATUS_LABELS,
  FORMA_PAGAMENTO_LABELS,
  criarAcordoComParcelasSchema,
  atualizarAcordoSchema,
  marcarParcelaRecebidaSchema,
} from './domain';

// Utils
export {
  formatarTipo,
  formatarDirecao,
  formatarStatus,
  formatarStatusRepasse,
  formatarFormaPagamento,
  getTipoColorClass,
  getDirecaoColorClass,
  getStatusColorClass,
  formatCurrency,
} from './utils';

// Repository (for internal financeiro usage)
export { ObrigacoesRepository } from './repository';

// Service (for internal usage if needed)
export * as ObrigacoesService from './service';

// Actions
export {
  actionListarAcordos,
  actionBuscarAcordo,
  actionCriarAcordoComParcelas,
  actionAtualizarAcordo,
  actionDeletarAcordo,
} from './actions/acordos';

export {
  actionMarcarParcelaRecebida,
  actionAtualizarParcela,
  actionRecalcularDistribuicao,
} from './actions/parcelas';

export {
  actionListarRepassesPendentes,
  actionAnexarDeclaracao,
  actionRegistrarRepasse,
} from './actions/repasses';
