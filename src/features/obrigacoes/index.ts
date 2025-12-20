
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
} from './domain';

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
  actionSincronizarAcordo,
  actionVerificarConsistencia,
  actionListarObrigacoesPorPeriodo,
} from './actions/acordos';

export {
  actionMarcarParcelaRecebida,
  actionAtualizarParcela,
  actionRecalcularDistribuicao,
  actionSincronizarParcela,
} from './actions/parcelas';

export {
  actionListarRepassesPendentes,
  actionAnexarDeclaracao,
  actionRegistrarRepasse,
} from './actions/repasses';

// Hooks
export { useRepassesPendentes } from './hooks/use-repasses-pendentes';

// Components
export { AcordoForm } from './components/dialogs/acordo-form';
export { NovaObrigacaoDialog } from './components/dialogs/nova-obrigacao-dialog';
export { ObrigacoesContent } from './components/obrigacoes-content';
export { ObrigacoesTableWrapper } from './components/table/obrigacoes-table-wrapper';
export { ResumoCards } from './components/shared/resumo-cards';
export { AlertasObrigacoes } from './components/shared/alertas-obrigacoes';

export { ParcelasTable } from './components/parcelas/parcelas-table';
export { EditParcelaDialog } from './components/parcelas/edit-parcela-dialog';
export { IntegracaoFinanceiraSection } from './components/parcelas/integracao-financeira-section';

export { RepassesPendentesList } from './components/repasses/repasses-pendentes-list';
export { UploadDeclaracaoDialog } from './components/repasses/upload-declaracao-dialog';
export { UploadComprovanteDialog } from './components/repasses/upload-comprovante-dialog';
