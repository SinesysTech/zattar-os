/**
 * Operações de Contacts da API do Chatwoot
 */

import { type ChatwootClient, getChatwootClient } from './client';
import {
  ChatwootContact,
  ChatwootResult,
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsParams,
  SearchContactsParams,
  MergeContactsRequest,
  ListContactsResponse,
  CreateContactResponse,
  GetContactResponse,
  UpdateContactResponse,
  DeleteContactResponse,
  MergeContactsResponse,
  ChatwootError,
} from './types';

// =============================================================================
// Funções de Contacts
// =============================================================================

/**
 * Lista contatos com paginação
 * GET /api/v1/accounts/{account_id}/contacts
 */
export async function listContacts(
  params?: ListContactsParams,
  client?: ChatwootClient
): Promise<ChatwootResult<ListContactsResponse>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  return chatwoot.get<ListContactsResponse>(
    `/api/v1/accounts/${accountId}/contacts`,
    {
      page: params?.page,
      sort: params?.sort,
    }
  );
}

/**
 * Cria um novo contato
 * POST /api/v1/accounts/{account_id}/contacts
 */
export async function createContact(
  data: CreateContactRequest,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact>> {
  const chatwoot = client ?? await getChatwootClient();
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

  const result = await chatwoot.post<CreateContactResponse>(
    `/api/v1/accounts/${accountId}/contacts`,
    { ...data, inbox_id: inboxId }
  );

  if (!result.success) {
    return result;
  }

  // A API retorna o contato em payload[0]
  const contact = result.data.payload?.[0];
  if (!contact) {
    return {
      success: false,
      error: new ChatwootError('Resposta inválida da API: contato não encontrado', 500),
    };
  }

  return { success: true, data: contact };
}

/**
 * Busca contato por ID
 * GET /api/v1/accounts/{account_id}/contacts/{id}
 */
export async function getContact(
  contactId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.get<GetContactResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.payload };
}

/**
 * Atualiza contato existente
 * PUT /api/v1/accounts/{account_id}/contacts/{id}
 */
export async function updateContact(
  contactId: number,
  data: UpdateContactRequest,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.put<UpdateContactResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`,
    data
  );

  if (!result.success) {
    return result;
  }

  // A API retorna o contato em payload[0]
  const contact = result.data.payload?.[0];
  if (!contact) {
    return {
      success: false,
      error: new ChatwootError('Resposta inválida da API: contato não encontrado', 500),
    };
  }

  return { success: true, data: contact };
}

/**
 * Exclui contato
 * DELETE /api/v1/accounts/{account_id}/contacts/{id}
 */
export async function deleteContact(
  contactId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<void>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.delete<DeleteContactResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}`
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: undefined };
}

/**
 * Pesquisa contatos por termo
 * GET /api/v1/accounts/{account_id}/contacts/search
 */
export async function searchContacts(
  params: SearchContactsParams,
  client?: ChatwootClient
): Promise<ChatwootResult<ListContactsResponse>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  return chatwoot.get<ListContactsResponse>(
    `/api/v1/accounts/${accountId}/contacts/search`,
    {
      q: params.q,
      page: params.page,
      sort: params.sort,
    }
  );
}

/**
 * Mescla dois contatos
 * POST /api/v1/accounts/{account_id}/actions/contact_merge
 */
export async function mergeContacts(
  data: MergeContactsRequest,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact>> {
  const chatwoot = client ?? await getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.post<MergeContactsResponse>(
    `/api/v1/accounts/${accountId}/actions/contact_merge`,
    data
  );

  if (!result.success) {
    return result;
  }

  // A API retorna o contato mesclado em payload[0]
  const contact = result.data.payload?.[0];
  if (!contact) {
    return {
      success: false,
      error: new ChatwootError('Resposta inválida da API: contato não encontrado', 500),
    };
  }

  return { success: true, data: contact };
}

// =============================================================================
// Funções utilitárias
// =============================================================================

/**
 * Busca contato por identifier (CPF/CNPJ)
 * Wrapper conveniente para searchContacts
 */
export async function findContactByIdentifier(
  identifier: string,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact | null>> {
  const result = await searchContacts({ q: identifier }, client);

  if (!result.success) {
    return result;
  }

  // Procura contato com identifier exato
  const contact = result.data.payload.find(
    (c) => c.identifier === identifier
  );

  return { success: true, data: contact ?? null };
}

/**
 * Busca contato por email
 * Wrapper conveniente para searchContacts
 */
export async function findContactByEmail(
  email: string,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact | null>> {
  const result = await searchContacts({ q: email }, client);

  if (!result.success) {
    return result;
  }

  // Procura contato com email exato (case-insensitive)
  const contact = result.data.payload.find(
    (c) => c.email?.toLowerCase() === email.toLowerCase()
  );

  return { success: true, data: contact ?? null };
}

/**
 * Busca contato por telefone
 * Wrapper conveniente para searchContacts
 */
export async function findContactByPhone(
  phoneNumber: string,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact | null>> {
  // Remove caracteres não numéricos para busca
  const normalizedPhone = phoneNumber.replace(/\D/g, '');

  const result = await searchContacts({ q: normalizedPhone }, client);

  if (!result.success) {
    return result;
  }

  // Procura contato com telefone que contenha os dígitos
  const contact = result.data.payload.find((c) => {
    const contactPhone = c.phone_number?.replace(/\D/g, '') ?? '';
    return contactPhone.includes(normalizedPhone) || normalizedPhone.includes(contactPhone);
  });

  return { success: true, data: contact ?? null };
}

/**
 * Lista todos os contatos (com paginação automática)
 * Útil para sincronização em lote
 */
export async function listAllContacts(
  maxPages = 10,
  client?: ChatwootClient
): Promise<ChatwootResult<ChatwootContact[]>> {
  const allContacts: ChatwootContact[] = [];
  let page = 1;

  while (page <= maxPages) {
    const result = await listContacts({ page }, client);

    if (!result.success) {
      return result;
    }

    allContacts.push(...result.data.payload);

    // Se retornou menos de 15, é a última página
    if (result.data.payload.length < 15) {
      break;
    }

    page++;
  }

  return { success: true, data: allContacts };
}
