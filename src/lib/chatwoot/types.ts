/**
 * Tipos TypeScript para a API do Chatwoot
 * Baseado na documentação oficial: https://www.chatwoot.com/developers/api
 */

// =============================================================================
// Configuração
// =============================================================================

export interface ChatwootConfig {
  apiUrl: string;
  apiKey: string;
  accountId: number;
  defaultInboxId?: number;
}

// =============================================================================
// Tipos base
// =============================================================================

export type ChatwootAvailabilityStatus = 'online' | 'offline' | 'busy';

export type ChatwootContactSortField =
  | 'name'
  | 'email'
  | 'phone_number'
  | 'last_activity_at'
  | '-name'
  | '-email'
  | '-phone_number'
  | '-last_activity_at';

// =============================================================================
// Inbox
// =============================================================================

export interface ChatwootInbox {
  id: number;
  avatar_url: string | null;
  channel_id: number;
  name: string;
  channel_type: string;
  provider?: string;
}

export interface ChatwootContactInbox {
  source_id: string;
  inbox: ChatwootInbox;
}

// =============================================================================
// Contact
// =============================================================================

export interface ChatwootContactAdditionalAttributes {
  city?: string;
  country?: string;
  country_code?: string;
  created_at_ip?: string;
  [key: string]: unknown;
}

export interface ChatwootContactCustomAttributes {
  tipo_pessoa?: 'pf' | 'pj';
  tipo_entidade?: 'cliente' | 'parte_contraria' | 'terceiro';
  sistema_origem?: string;
  entidade_id?: number;
  nome_fantasia?: string;
  [key: string]: unknown;
}

export interface ChatwootContact {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  identifier: string | null;
  thumbnail: string | null;
  blocked: boolean;
  availability_status: ChatwootAvailabilityStatus;
  additional_attributes: ChatwootContactAdditionalAttributes;
  custom_attributes: ChatwootContactCustomAttributes;
  contact_inboxes: ChatwootContactInbox[];
  last_activity_at: number | null;
  created_at: number;
}

// =============================================================================
// Requests
// =============================================================================

export interface CreateContactRequest {
  inbox_id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  avatar?: string;
  avatar_url?: string;
  identifier?: string;
  blocked?: boolean;
  additional_attributes?: ChatwootContactAdditionalAttributes;
  custom_attributes?: ChatwootContactCustomAttributes;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  avatar?: string;
  avatar_url?: string;
  identifier?: string;
  blocked?: boolean;
  additional_attributes?: ChatwootContactAdditionalAttributes;
  custom_attributes?: ChatwootContactCustomAttributes;
}

export interface ListContactsParams {
  page?: number;
  sort?: ChatwootContactSortField;
}

export interface SearchContactsParams {
  q: string;
  page?: number;
  sort?: ChatwootContactSortField;
}

export interface MergeContactsRequest {
  base_contact_id: number;
  mergee_contact_id: number;
}

export interface UpdateContactLabelsRequest {
  labels: string[];
}

// =============================================================================
// Responses
// =============================================================================

export interface ChatwootPaginationMeta {
  count: number;
  current_page: string | number;
}

export interface ListContactsResponse {
  meta: ChatwootPaginationMeta;
  payload: ChatwootContact[];
}

export interface CreateContactResponse {
  payload: ChatwootContact[];
  id: number;
  availability_status: ChatwootAvailabilityStatus;
}

export interface GetContactResponse {
  payload: ChatwootContact;
}

export interface UpdateContactResponse {
  id: number;
  payload: ChatwootContact[];
}

export interface DeleteContactResponse {
  description?: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface ContactLabelsResponse {
  payload: string[];
}

export interface MergeContactsResponse {
  id: number;
  payload: ChatwootContact[];
}

// =============================================================================
// Erros
// =============================================================================

export interface ChatwootApiError {
  description?: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class ChatwootError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly apiError?: ChatwootApiError
  ) {
    super(message);
    this.name = 'ChatwootError';
  }
}

// =============================================================================
// Result Types (padrão do projeto)
// =============================================================================

export type ChatwootResult<T> =
  | { success: true; data: T }
  | { success: false; error: ChatwootError };

// =============================================================================
// Mapeamento local
// =============================================================================

export type TipoEntidadeChatwoot = 'cliente' | 'parte_contraria' | 'terceiro';

export interface PartesChatwoot {
  id: number;
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  chatwoot_contact_id: number;
  chatwoot_account_id: number;
  ultima_sincronizacao: string;
  dados_sincronizados: Record<string, unknown>;
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePartesChatwootInput {
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  chatwoot_contact_id: number;
  chatwoot_account_id: number;
  dados_sincronizados?: Record<string, unknown>;
}

export interface UpdatePartesChatwootInput {
  ultima_sincronizacao?: string;
  dados_sincronizados?: Record<string, unknown>;
  sincronizado?: boolean;
  erro_sincronizacao?: string | null;
}
