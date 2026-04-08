/**
 * NOTIFICAÇÕES MODULE — Barrel Export (API Pública)
 *
 * Exporta todos os tipos, funções e componentes da feature de notificações.
 * Este arquivo é o ponto de entrada para consumidores externos.
 */

// =============================================================================
// Components
// =============================================================================

export { NotificacoesList } from "./components/notificacoes-list";

// =============================================================================
// Hooks
// =============================================================================

export { useNotificacoes, useNotificacoesRealtime } from "./hooks/use-notificacoes";

// =============================================================================
// Actions
// =============================================================================

export {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "./actions/notificacoes-actions";

// =============================================================================
// Types / Domain
// =============================================================================

export type {
  Notificacao,
  TipoNotificacaoUsuario,
  EntidadeTipo,
  CreateNotificacaoInput,
  UpdateNotificacaoInput,
  ListarNotificacoesParams,
  NotificacoesPaginadas,
  ContadorNotificacoes,
} from "./domain";

export {
  createNotificacaoSchema,
  updateNotificacaoSchema,
  listarNotificacoesSchema,
  TIPO_NOTIFICACAO_LABELS,
  TIPO_NOTIFICACAO_ICONES,
} from "./domain";

