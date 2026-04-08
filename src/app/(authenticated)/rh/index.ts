/**
 * RH Feature Module — Barrel Export (API Pública)
 *
 * Este é o ponto de entrada público do módulo de RH.
 * Toda importação cross-módulo DEVE passar por este arquivo.
 *
 * Entidades: Salários, Folhas de Pagamento
 */

// ============================================================================
// Components
// ============================================================================
export {
  SalariosList,
  SalarioFormDialog,
  FolhasPagamentoList,
  FolhaDetalhes,
  GerarFolhaDialog,
  AprovarFolhaDialog,
  PagarFolhaDialog,
} from './components';

export { HistoricoSalarios } from './components/shared/historico-salarios';

// ============================================================================
// Hooks
// ============================================================================
export * from './hooks';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  // Salários
  actionListarSalarios,
  actionBuscarSalario,
  actionCriarSalario,
  actionAtualizarSalario,
  actionEncerrarVigenciaSalario,
  actionInativarSalario,
  actionExcluirSalario,
  actionBuscarSalariosDoUsuario,
  // Folhas de Pagamento
  actionListarFolhasPagamento,
  actionBuscarFolhaPagamento,
  actionBuscarFolhaPorPeriodo,
  actionGerarFolhaPagamento,
  actionPreviewGerarFolha,
  actionAprovarFolhaPagamento,
  actionPagarFolhaPagamento,
  actionAtualizarFolhaPagamento,
  actionVerificarCancelamentoFolha,
  actionObterResumoPagamento,
  actionCancelarFolhaPagamento,
  actionExcluirFolhaPagamento,
} from './actions';

// ============================================================================
// Types / Domain
// ============================================================================
export type {
  Salario,
  SalarioComDetalhes,
  FolhaPagamento,
  FolhaPagamentoComDetalhes,
  ItemFolhaPagamento,
  ItemFolhaComDetalhes,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO,
  CancelarFolhaDTO,
  ListarSalariosParams,
  ListarSalariosResponse,
  ListarFolhasParams,
  ListarFolhasResponse,
  StatusFolhaPagamento,
  FormaPagamentoFolha,
} from './domain';

export {
  criarSalarioSchema,
  atualizarSalarioSchema,
  gerarFolhaSchema,
  aprovarFolhaSchema,
  pagarFolhaSchema,
  STATUS_FOLHA_LABELS,
  FORMA_PAGAMENTO_FOLHA_LABELS,
  MESES_LABELS,
  MESES_OPTIONS,
  isStatusFolhaValido,
  isFormaPagamentoFolhaValida,
  isTransicaoStatusValida,
} from './domain';

// ============================================================================
// Utils
// ============================================================================
export {
  formatarPeriodo,
  validarPeriodoFolha,
  ultimoDiaDoMes,
  primeiroDiaDoMes,
  dataEstaNoPeriodo,
  calcularDuracaoVigencia,
  calcularSalarioVigente,
  STATUS_FOLHA_CORES,
} from './utils';

// ============================================================================
// Service / Repository
// ============================================================================
// Services e Repositories devem ser importados diretamente:
//   import { gerarFolhaPagamento } from '@/app/(authenticated)/rh/service';
// NÃO re-exportar aqui para evitar vazamento de server-only no bundle client.
