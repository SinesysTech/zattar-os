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
  inbox_id?: number;
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

// =============================================================================
// Conversation Types
// =============================================================================

export type ChatwootConversationStatus = 'open' | 'resolved' | 'pending' | 'snoozed' | 'all';

export type ChatwootAssigneeType = 'me' | 'unassigned' | 'all' | 'assigned';

export type ChatwootMessageType = 0 | 1 | 2; // 0: incoming, 1: outgoing, 2: activity

export type ChatwootSenderType = 'contact' | 'user';

export type ChatwootMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type ChatwootContentType = 'text' | 'input_select' | 'cards' | 'form' | 'article' | 'input_email' | 'input_csat';

export interface ChatwootAgent {
  id: number;
  access_token?: string;
  account_id: number;
  available_name: string;
  avatar_url: string | null;
  confirmed: boolean;
  display_name: string;
  message_signature?: string;
  email: string;
  hmac_identifier?: string;
  inviter_id?: number;
  name: string;
  provider?: string;
  pubsub_token?: string;
  role: 'agent' | 'administrator';
  ui_settings?: Record<string, unknown>;
  uid?: string;
  type?: string;
  custom_attributes?: Record<string, unknown>;
}

export interface ChatwootMessageAttachment {
  id?: number;
  message_id?: number;
  file_type?: string;
  account_id?: number;
  extension?: string;
  data_url?: string;
  thumb_url?: string;
  file_size?: number;
}

export interface ChatwootMessage {
  id: number;
  content: string;
  account_id: number;
  inbox_id: number;
  conversation_id: number;
  message_type: ChatwootMessageType;
  created_at: number;
  updated_at: number;
  private: boolean;
  status: ChatwootMessageStatus;
  source_id: string | null;
  content_type: ChatwootContentType;
  content_attributes: Record<string, unknown>;
  sender_type: ChatwootSenderType;
  sender_id: number;
  external_source_ids: Record<string, unknown>;
  additional_attributes: Record<string, unknown>;
  processed_message_content: string;
  sentiment: Record<string, unknown>;
  conversation?: Record<string, unknown>;
  attachment?: ChatwootMessageAttachment;
  sender?: ChatwootContact | ChatwootAgent;
}

export interface ChatwootConversationMeta {
  sender: {
    additional_attributes: Record<string, unknown>;
    availability_status: string;
    email: string | null;
    id: number;
    name: string;
    phone_number: string | null;
    blocked: boolean;
    identifier: string | null;
    thumbnail: string | null;
    custom_attributes: Record<string, unknown>;
    last_activity_at: number | null;
    created_at: number;
  };
  channel: string;
  assignee?: ChatwootAgent;
  hmac_verified?: boolean;
}

export interface ChatwootConversation {
  id: number;
  uuid: string;
  account_id: number;
  inbox_id: number;
  status: ChatwootConversationStatus;
  muted: boolean;
  snoozed_until: number | null;
  can_reply: boolean;
  labels: string[];
  custom_attributes: Record<string, unknown>;
  additional_attributes: Record<string, unknown>;
  created_at: number;
  updated_at: number;
  timestamp: string;
  first_reply_created_at: number | null;
  unread_count: number;
  last_activity_at: number;
  priority: string | null;
  waiting_since: number | null;
  agent_last_seen_at: number | null;
  assignee_last_seen_at: number | null;
  contact_last_seen_at: number | null;
  sla_policy_id: number | null;
  applied_sla: Record<string, unknown>;
  sla_events: Record<string, unknown>[];
  messages: ChatwootMessage[];
  last_non_activity_message?: ChatwootMessage;
  meta: ChatwootConversationMeta;
}

export interface ChatwootConversationCounts {
  mine_count: number;
  unassigned_count: number;
  assigned_count: number;
  all_count: number;
}

// =============================================================================
// Conversation Requests
// =============================================================================

export interface ListConversationsParams {
  assignee_type?: ChatwootAssigneeType;
  status?: ChatwootConversationStatus;
  q?: string;
  inbox_id?: number;
  team_id?: number;
  labels?: string[];
  page?: number;
}

export interface GetConversationCountsParams {
  status?: ChatwootConversationStatus;
  q?: string;
  inbox_id?: number;
  team_id?: number;
  labels?: string[];
}

export interface CreateConversationRequest {
  source_id: string;
  inbox_id: number;
  contact_id?: number;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  status?: 'open' | 'resolved' | 'pending';
  assignee_id?: number;
  team_id?: number;
  snoozed_until?: string;
  message?: {
    content: string;
    template_params?: {
      name?: string;
      category?: string;
      language?: string;
      processed_params?: Record<string, string>;
    };
  };
}

export interface ConversationFilterOperator {
  attribute_key: string;
  filter_operator: 'equal_to' | 'not_equal_to' | 'contains' | 'does_not_contain';
  values: string[];
  query_operator?: 'AND' | 'OR' | null;
}

export interface FilterConversationsRequest {
  payload: ConversationFilterOperator[];
}

// =============================================================================
// Conversation Responses
// =============================================================================

export interface ConversationCountsResponse {
  meta: ChatwootConversationCounts;
}

export interface ListConversationsResponse {
  data: {
    meta: ChatwootConversationCounts;
    payload: ChatwootConversation[];
  };
}

export interface CreateConversationResponse {
  id: number;
  account_id: number;
  inbox_id: number;
}

// =============================================================================
// Message Requests/Responses
// =============================================================================

export interface GetMessagesResponse {
  meta: {
    labels: string[];
    additional_attributes: Record<string, unknown>;
    contact: {
      payload: ChatwootContact[];
    };
    assignee?: ChatwootAgent;
    agent_last_seen_at: string | null;
    assignee_last_seen_at: string | null;
  };
  payload: ChatwootMessage[];
}
