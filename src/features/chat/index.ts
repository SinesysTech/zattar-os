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
 *   chatService,
 *   useChatSubscription,
 *   actionEnviarMensagem,
 *   SalaChat,
 *   TipoSalaChat
 * } from '@/features/chat';
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================
export type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  UsuarioChat,
  ChatItem, // Added
  TypingUser,
  CriarSalaChatInput,
  CriarMensagemChatInput,
  ListarSalasParams,
  ListarMensagensParams,
  PaginationInfo,
  PaginatedResponse,
  ActionResult,
} from './domain';

export {
  TipoSalaChat,
  TipoMensagemChat,
  criarSalaChatSchema,
  criarMensagemChatSchema,
} from './domain';

// =============================================================================
// REPOSITORY
// =============================================================================
export { ChatRepository, createChatRepository } from './repository';

// =============================================================================
// SERVICE
// =============================================================================
export {
  ChatService,
  createChatService,
} from './service';

// =============================================================================
// ACTIONS (Server Actions)
// =============================================================================
export {
  actionCriarSala,
  actionListarSalas,
  actionDeletarSala,
  actionArquivarSala,
  actionDesarquivarSala,
  actionAtualizarNomeSala,
  actionEnviarMensagem,
  actionBuscarHistorico,
} from './actions/chat-actions';

// =============================================================================
// HOOKS
// =============================================================================
export { useChatSubscription } from './hooks/use-chat-subscription';
export { useTypingIndicator } from './hooks/use-typing-indicator';

// =============================================================================
// COMPONENTS
// =============================================================================
export { 
  ChatLayout, ChatSidebar, ChatWindow, RoomList,
  ChatLayoutNew, ChatSidebarNew, ChatWindowNew 
} from './components';