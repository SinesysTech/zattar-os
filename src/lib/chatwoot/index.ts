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
  getChatwootConfig,
  isChatwootConfigured,
  resetChatwootClient,
} from './client';

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
} from './types';

export { ChatwootError } from './types';
