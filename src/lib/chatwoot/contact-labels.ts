/**
 * Operações de Contact Labels da API do Chatwoot
 */

import { ChatwootClient, getChatwootClient } from './client';
import {
  ChatwootResult,
  ContactLabelsResponse,
  UpdateContactLabelsRequest,
} from './types';

// =============================================================================
// Labels padrão para categorização de partes
// =============================================================================

export const CHATWOOT_LABELS = {
  // Tipos de entidade
  CLIENTE: 'cliente',
  PARTE_CONTRARIA: 'parte_contraria',
  TERCEIRO: 'terceiro',

  // Subtipos de terceiros
  TESTEMUNHA: 'testemunha',
  PERITO: 'perito',
  ASSISTENTE: 'assistente',
  MINISTERIO_PUBLICO: 'ministerio_publico',

  // Tipo de pessoa
  PESSOA_FISICA: 'pessoa_fisica',
  PESSOA_JURIDICA: 'pessoa_juridica',

  // Status
  ATIVO: 'ativo',
  INATIVO: 'inativo',

  // Origem
  SISTEMA_ZATTAR: 'zattar',
} as const;

export type ChatwootLabelKey = keyof typeof CHATWOOT_LABELS;
export type ChatwootLabel = (typeof CHATWOOT_LABELS)[ChatwootLabelKey];

// =============================================================================
// Funções de Labels
// =============================================================================

/**
 * Lista labels de um contato
 * GET /api/v1/accounts/{account_id}/contacts/{id}/labels
 */
export async function listContactLabels(
  contactId: number,
  client?: ChatwootClient
): Promise<ChatwootResult<string[]>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const result = await chatwoot.get<ContactLabelsResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/labels`
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.payload };
}

/**
 * Atualiza labels de um contato (sobrescreve todas)
 * POST /api/v1/accounts/{account_id}/contacts/{id}/labels
 */
export async function updateContactLabels(
  contactId: number,
  labels: string[],
  client?: ChatwootClient
): Promise<ChatwootResult<string[]>> {
  const chatwoot = client ?? getChatwootClient();
  const accountId = chatwoot.getAccountId();

  const body: UpdateContactLabelsRequest = { labels };

  const result = await chatwoot.post<ContactLabelsResponse>(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/labels`,
    body
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.payload };
}

/**
 * Adiciona labels a um contato (preservando existentes)
 */
export async function addContactLabels(
  contactId: number,
  newLabels: string[],
  client?: ChatwootClient
): Promise<ChatwootResult<string[]>> {
  // Primeiro, obtém labels existentes
  const existingResult = await listContactLabels(contactId, client);

  if (!existingResult.success) {
    return existingResult;
  }

  // Mescla labels sem duplicatas
  const mergedLabels = [...new Set([...existingResult.data, ...newLabels])];

  // Atualiza com labels mescladas
  return updateContactLabels(contactId, mergedLabels, client);
}

/**
 * Remove labels de um contato
 */
export async function removeContactLabels(
  contactId: number,
  labelsToRemove: string[],
  client?: ChatwootClient
): Promise<ChatwootResult<string[]>> {
  // Primeiro, obtém labels existentes
  const existingResult = await listContactLabels(contactId, client);

  if (!existingResult.success) {
    return existingResult;
  }

  // Remove labels especificadas
  const filteredLabels = existingResult.data.filter(
    (label) => !labelsToRemove.includes(label)
  );

  // Atualiza com labels filtradas
  return updateContactLabels(contactId, filteredLabels, client);
}

/**
 * Verifica se contato tem uma label específica
 */
export async function hasContactLabel(
  contactId: number,
  label: string,
  client?: ChatwootClient
): Promise<ChatwootResult<boolean>> {
  const result = await listContactLabels(contactId, client);

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.includes(label) };
}

// =============================================================================
// Funções utilitárias para partes
// =============================================================================

/**
 * Obtém labels padrão para um tipo de entidade
 */
export function getLabelsForTipoEntidade(
  tipoEntidade: 'cliente' | 'parte_contraria' | 'terceiro',
  tipoPessoa: 'pf' | 'pj',
  tipoTerceiro?: string
): string[] {
  const labels: string[] = [CHATWOOT_LABELS.SISTEMA_ZATTAR];

  // Tipo de entidade
  switch (tipoEntidade) {
    case 'cliente':
      labels.push(CHATWOOT_LABELS.CLIENTE);
      break;
    case 'parte_contraria':
      labels.push(CHATWOOT_LABELS.PARTE_CONTRARIA);
      break;
    case 'terceiro':
      labels.push(CHATWOOT_LABELS.TERCEIRO);
      // Subtipo de terceiro
      if (tipoTerceiro) {
        const tipoTerceiroLower = tipoTerceiro.toLowerCase();
        if (tipoTerceiroLower === 'testemunha') {
          labels.push(CHATWOOT_LABELS.TESTEMUNHA);
        } else if (tipoTerceiroLower === 'perito') {
          labels.push(CHATWOOT_LABELS.PERITO);
        } else if (tipoTerceiroLower === 'assistente') {
          labels.push(CHATWOOT_LABELS.ASSISTENTE);
        } else if (tipoTerceiroLower.includes('ministerio')) {
          labels.push(CHATWOOT_LABELS.MINISTERIO_PUBLICO);
        }
      }
      break;
  }

  // Tipo de pessoa
  if (tipoPessoa === 'pf') {
    labels.push(CHATWOOT_LABELS.PESSOA_FISICA);
  } else {
    labels.push(CHATWOOT_LABELS.PESSOA_JURIDICA);
  }

  return labels;
}

/**
 * Aplica labels padrão a um contato baseado no tipo de parte
 */
export async function applyParteLabels(
  contactId: number,
  tipoEntidade: 'cliente' | 'parte_contraria' | 'terceiro',
  tipoPessoa: 'pf' | 'pj',
  tipoTerceiro?: string,
  client?: ChatwootClient
): Promise<ChatwootResult<string[]>> {
  const labels = getLabelsForTipoEntidade(tipoEntidade, tipoPessoa, tipoTerceiro);
  return addContactLabels(contactId, labels, client);
}
