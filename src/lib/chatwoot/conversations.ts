/**
 * Operações de Conversations da API do Chatwoot
 */

import { ChatwootClient, getChatwootClient } from './client';
import {
  ChatwootConversation,
  ChatwootConversationCounts,
  ChatwootResult,
  ListConversationsParams,
  GetConversationCountsParams,
  CreateConversationRequest,
  FilterConversationsRequest,
  ConversationCountsResponse,
  ListConversationsResponse,
  CreateConversationResponse,
  ChatwootError,
} from './types';

// =============================================================================
// Funções de Conversations
// =============================================================================

/**
 * Obtém contagens de conversas por status
 * GET /api/v1/accounts/{account_id}/conversations/meta
 */
export async function getConversationCounts(
  params?: GetConversationCountsParams,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootConversationCounts>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.get<ConversationCountsResponse>(
    `/api/v1/accounts/${accountId}/conversations/meta`,
    {
      status: params?.status,
      q: params?.q,
      inbox_id: params?.inbox_id,
      team_id: params?.team_id,
      labels: params?.labels?.join(','),
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.meta };
}

/**
 * Lista conversas com paginação e filtros
 * GET /api/v1/accounts/{account_id}/conversations
 */
export async function listConversations(
  params?: ListConversationsParams,
  client?: ChatwootClient
): Promise<ChatwootResult<{ meta: ChatwootConversationCounts; conversations: ChatwootConversation[] }>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.get<ListConversationsResponse>(
    `/api/v1/accounts/${accountId}/conversations`,
    {
      assignee_type: params?.assignee_type,
      status: params?.status,
      q: params?.q,
      inbox_id: params?.inbox_id,
      team_id: params?.team_id,
      labels: params?.labels?.join(','),
      page: params?.page,
    }
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      meta: result.data.data.meta,
      conversations: result.data.data.payload,
    },
  };
}

/**
 * Busca conversa por ID
 * GET /api/v1/accounts/{account_id}/conversations/{id}
 */
export async function getConversation(
  conversationId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootConversation>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  return chatwoot.get<ChatwootConversation>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}`
  );
}

/**
 * Cria uma nova conversa
 * POST /api/v1/accounts/{account_id}/conversations
 */
export async function createConversation(
  data: CreateConversationRequest,
  client?: ChatwootClient
): Promise<ChatwootResult<CreateConversationResponse>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  // Usa inbox_id padrão se não fornecido
  const inboxId = data.inbox_id ?? chatwoot.getDefaultInboxId();

  if (!inboxId) {
    return {
      success: false,
      error: new ChatwootError(
        'inbox_id é obrigatório. Defina CHATWOOT_DEFAULT_INBOX_ID ou forneça inbox_id.',
        400
      ),
    };
  }

  return chatwoot.post<CreateConversationResponse>(
    `/api/v1/accounts/${accountId}/conversations`,
    { ...data, inbox_id: inboxId }
  );
}

/**
 * Filtra conversas com critérios avançados
 * POST /api/v1/accounts/{account_id}/conversations/filter
 */
export async function filterConversations(
  filters: FilterConversationsRequest,
  page?: number,
  client?: ChatwootClient
): Promise<ChatwootResult<{ meta: ChatwootConversationCounts; conversations: ChatwootConversation[] }>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.post<ListConversationsResponse>(
    `/api/v1/accounts/${accountId}/conversations/filter`,
    filters,
    { page }
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      meta: result.data.data.meta,
      conversations: result.data.data.payload,
    },
  };
}

// =============================================================================
// Funções utilitárias
// =============================================================================

/**
 * Busca conversas de um contato específico
 * Usa filtro por contact_id via atributos
 */
export async function getContactConversations(
  contactId: number,
  status?: 'open' | 'resolved' | 'pending' | 'all',
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootConversation[]>> {
  // Busca todas as conversas e filtra pelo contact_id no sender
  const result = await listConversations(
    { status: status ?? 'all', page: 1 },
    client
  );

  if (!result.success) {
    return result;
  }

  // Filtra conversas do contato específico
  const contactConversations = result.data.conversations.filter(
    (conv) => conv.meta.sender.id === contactId
  );

  return { success: true, data: contactConversations };
}

/**
 * Lista todas as conversas com paginação automática
 * Útil para sincronização em lote
 */
export async function listAllConversations(
  params?: Omit<ListConversationsParams, 'page'>,
  maxPages = 10,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootConversation[]>> {
  const allConversations: ChatwootConversation[] = [];
  let page = 1;

  while (page <= maxPages) {
    const result = await listConversations({ ...params, page }, client);

    if (!result.success) {
      return result;
    }

    allConversations.push(...result.data.conversations);

    // Se retornou menos de 25 (padrão), é a última página
    if (result.data.conversations.length < 25) {
      break;
    }

    page++;
  }

  return { success: true, data: allConversations };
}

/**
 * Busca conversas abertas de um contato
 */
export async function getOpenConversations(
  contactId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootConversation[]>> {
  return getContactConversations(contactId, 'open', client);
}

/**
 * Formata telefone brasileiro para source_id
 * Usado ao criar conversas
 */
export function formatPhoneForSourceId(phone: string): string {
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, '');

  // Se já tem código do país, retorna
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }

  // Adiciona código do Brasil
  return `+55${digits}`;
}
