/**
 * CHAT FEATURE - Public API
 *
 * Re-exporta todos os módulos públicos da feature chat.
 * Este é o ponto de entrada principal para importar funcionalidades de chat.
 *
 * @example
 * ```tsx
 * import {
 *   ChatLayout,
 *   ChatWindow,
 *   ChatSidebarWrapper,
 *   useChatSubscription,
 *   actionEnviarMensagem,
 *   SalaChat,
 *   TipoSalaChat
 * } from '@/app/(authenticated)/chat';
 * ```
 */

// =============================================================================
// Types / Domain
// =============================================================================
export type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  UsuarioChat,
  ChatItem,
  TypingUser,
  CriarSalaChatInput,
  CriarMensagemChatInput,
  ListarSalasParams,
  ListarMensagensParams,
  PaginationInfo,
  PaginatedResponse,
  ActionResult,
  // Database row types
  SalaChatRow,
  MensagemChatRow,
  UsuarioChatRow,
  DyteMeeting,
  ChatMessageData,
  // Call Feature Types
  Chamada,
  ChamadaParticipante,
  ChamadaComParticipantes,
  TipoChamada,
  StatusChamada,
  // Legacy UI Types
  MediaListItemType,
  MessageStatusIconType,
} from "./domain";

export {
  TipoSalaChat,
  TipoMensagemChat,
  criarSalaChatSchema,
  criarMensagemChatSchema,
  // Call Feature Schemas
  criarChamadaSchema,
  responderChamadaSchema,
} from "./domain";

// =============================================================================
// Components
// =============================================================================
export {
  ChatLayout,
  ChatWindow,
  ChatSidebarWrapper,
  ChatSidebar,
  CallHistoryList,
  CallWindowContent,
  MeetingSkeleton,
} from "./components";

// =============================================================================
// Hooks
// =============================================================================
export { useChatSubscription } from "./hooks/use-chat-subscription";
export { useTypingIndicator } from "./hooks/use-typing-indicator";
export { useChatStore } from "./hooks";

// =============================================================================
// Actions (Server Actions)
// =============================================================================
// NOTA: Server Actions usam código do servidor (next/headers).
// Para uso em Server Components/Actions, importe diretamente:
//   import { actionCriarSala } from '@/app/(authenticated)/chat/actions';
export {
  actionCriarSala,
  actionCriarGrupo,
  actionListarSalas,
  actionDeletarSala,
  actionArquivarSala,
  actionDesarquivarSala,
  actionAtualizarNomeSala,
  actionEnviarMensagem,
  actionBuscarHistorico,
} from "./actions/chat-actions";
export * from "./actions/chamadas-actions";
export * from "./actions/file-actions";

// =============================================================================
// Utils
// =============================================================================
export {
  formatarDuracao,
  getStatusBadgeVariant,
  getStatusLabel,
  getTipoChamadaIcon,
  getStatusIcon,
  handleCallError,
} from "./utils";
