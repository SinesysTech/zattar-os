/**
 * Chatwoot API Client
 *
 * Módulo de integração com a API do Chatwoot para gerenciamento
 * de contatos e sincronização com o módulo de partes.
 *
 * @example
 * ```typescript
 * import { listContacts, createContact, getChatwootClient } from '@/lib/chatwoot';
 *
 * // Listar contatos
 * const result = await listContacts({ page: 1 });
 * if (result.success) {
 *   console.log(result.data.payload);
 * }
 *
 * // Criar contato
 * const contact = await createContact({
 *   inbox_id: 1,
 *   name: 'João Silva',
 *   email: 'joao@email.com',
 *   identifier: '12345678901', // CPF
 * });
 * ```
 */

// Client
export {
  ChatwootClient,
  getChatwootClient,
  getChatwootClientAsync,
  getChatwootConfig,
  getChatwootConfigFromEnv,
  isChatwootConfigured,
  isChatwootConfiguredAsync,
  resetChatwootClient,
} from './client';

// Configuration (Database-driven via integracoes table)
export {
  getChatwootConfigFromDatabase,
  isChatwootConfiguredInDatabase,
  getChatwootConfigWithFallback,
} from './config';

// Contacts
export {
  listContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  searchContacts,
  mergeContacts,
  findContactByIdentifier,
  findContactByEmail,
  findContactByPhone,
  listAllContacts,
} from './contacts';

// Contact Labels
export {
  listContactLabels,
  updateContactLabels,
  addContactLabels,
  removeContactLabels,
  hasContactLabel,
  getLabelsForTipoEntidade,
  applyParteLabels,
  CHATWOOT_LABELS,
} from './contact-labels';

// Conversations
export {
  getConversationCounts,
  listConversations,
  getConversation,
  createConversation,
  filterConversations,
  getContactConversations,
  listAllConversations,
  getOpenConversations,
  formatPhoneForSourceId,
} from './conversations';

// Messages
export {
  getMessages,
  getConversationHistory,
  getRecentMessages,
  getTextMessages,
  formatConversationForAI,
  countMessagesByType,
} from './messages';

// Types
export type {
  // Config
  ChatwootConfig,

  // Contact types
  ChatwootContact,
  ChatwootContactAdditionalAttributes,
  ChatwootContactCustomAttributes,
  ChatwootContactInbox,
  ChatwootInbox,
  ChatwootAvailabilityStatus,
  ChatwootContactSortField,

  // Request types
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsParams,
  SearchContactsParams,
  MergeContactsRequest,
  UpdateContactLabelsRequest,

  // Response types
  ListContactsResponse,
  CreateContactResponse,
  GetContactResponse,
  UpdateContactResponse,
  DeleteContactResponse,
  ContactLabelsResponse,
  MergeContactsResponse,
  ChatwootPaginationMeta,

  // Error types
  ChatwootApiError,
  ChatwootResult,

  // Mapping types
  TipoEntidadeChatwoot,
  PartesChatwoot,
  CreatePartesChatwootInput,
  UpdatePartesChatwootInput,

  // Conversation types
  ChatwootConversationStatus,
  ChatwootAssigneeType,
  ChatwootMessageType,
  ChatwootSenderType,
  ChatwootMessageStatus,
  ChatwootContentType,
  ChatwootAgent,
  ChatwootMessageAttachment,
  ChatwootMessage,
  ChatwootConversationMeta,
  ChatwootConversation,
  ChatwootConversationCounts,
  ListConversationsParams,
  GetConversationCountsParams,
  CreateConversationRequest,
  ConversationFilterOperator,
  FilterConversationsRequest,
  ConversationCountsResponse,
  ListConversationsResponse,
  CreateConversationResponse,
  GetMessagesResponse,
} from './types';

export { ChatwootError } from './types';
