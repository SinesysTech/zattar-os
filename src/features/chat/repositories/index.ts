/**
 * CHAT FEATURE - Repositories Index
 *
 * Barrel exports para todos os repositories do módulo de chat.
 */

// Rooms Repository
export { RoomsRepository, createRoomsRepository } from "./rooms-repository";

// Messages Repository
export {
  MessagesRepository,
  createMessagesRepository,
} from "./messages-repository";

// Calls Repository
export { CallsRepository, createCallsRepository } from "./calls-repository";

// Members Repository
export {
  MembersRepository,
  createMembersRepository,
} from "./members-repository";

// Shared Converters
export {
  converterParaSalaChat,
  converterParaMensagemChat,
  converterParaMensagemComUsuario,
  converterParaChamada,
  converterParaChamadaParticipante,
} from "./shared/converters";
