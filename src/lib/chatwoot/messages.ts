/**
 * Operações de Messages da API do Chatwoot
 */

import { type ChatwootClient, getChatwootClient } from './client';
import {
  ChatwootMessage,
  ChatwootResult,
  GetMessagesResponse,
} from './types';

// =============================================================================
// Funções de Messages
// =============================================================================

/**
 * Lista mensagens de uma conversa
 * GET /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
 */
export async function getMessages(
  conversationId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<GetMessagesResponse>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  return chatwoot.get<GetMessagesResponse>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`
  );
}

// =============================================================================
// Funções utilitárias
// =============================================================================

/**
 * Busca histórico completo de uma conversa
 * Retorna mensagens ordenadas por data (mais antigas primeiro)
 */
export async function getConversationHistory(
  conversationId: number,
  limit?: number,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootMessage[]>> {
  const result = await getMessages(conversationId, client);

  if (!result.success) {
    return result;
  }

  // Ordena por data (mais antigas primeiro)
  let messages = [...result.data.payload].sort(
    (a, b) => a.created_at - b.created_at
  );

  // Limita quantidade se especificado
  if (limit && messages.length > limit) {
    // Retorna as últimas N mensagens
    messages = messages.slice(-limit);
  }

  return { success: true, data: messages };
}

/**
 * Busca últimas N mensagens de uma conversa
 * Retorna mensagens ordenadas por data (mais recentes primeiro)
 */
export async function getRecentMessages(
  conversationId: number,
  limit = 50,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootMessage[]>> {
  const result = await getMessages(conversationId, client);

  if (!result.success) {
    return result;
  }

  // Ordena por data (mais recentes primeiro)
  const messages = [...result.data.payload]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);

  return { success: true, data: messages };
}

/**
 * Filtra apenas mensagens de texto (exclui atividades do sistema)
 */
export async function getTextMessages(
  conversationId: number,
  limit?: number,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootMessage[]>> {
  const result = await getMessages(conversationId, client);

  if (!result.success) {
    return result;
  }

  // Filtra apenas mensagens de entrada (0) e saída (1), exclui atividades (2)
  let messages = result.data.payload
    .filter((msg) => msg.message_type !== 2)
    .sort((a, b) => a.created_at - b.created_at);

  if (limit && messages.length > limit) {
    messages = messages.slice(-limit);
  }

  return { success: true, data: messages };
}

/**
 * Formata mensagens para exibição em contexto de AI
 * Retorna string formatada com histórico da conversa
 */
export async function formatConversationForAI(
  conversationId: number,
  limit = 50,
  client?: ChatwootClient
): Promise<ChatwootResult<string>> {
  const result = await getTextMessages(conversationId, limit, client);

  if (!result.success) {
    return result;
  }

  const formatted = result.data
    .map((msg) => {
      const sender = msg.sender_type === 'contact' ? 'Cliente' : 'Agente';
      const date = new Date(msg.created_at * 1000).toLocaleString('pt-BR');
      return `[${date}] ${sender}: ${msg.content}`;
    })
    .join('\n');

  return { success: true, data: formatted };
}

/**
 * Conta mensagens por tipo em uma conversa
 */
export async function countMessagesByType(
  conversationId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<{ incoming: number; outgoing: number; activity: number; total: number }>> {
  const result = await getMessages(conversationId, client);

  if (!result.success) {
    return result;
  }

  const counts = {
    incoming: 0,
    outgoing: 0,
    activity: 0,
    total: result.data.payload.length,
  };

  for (const msg of result.data.payload) {
    if (msg.message_type === 0) counts.incoming++;
    else if (msg.message_type === 1) counts.outgoing++;
    else if (msg.message_type === 2) counts.activity++;
  }

  return { success: true, data: counts };
}
