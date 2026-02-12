/**
 * 2FAuth Groups Module
 *
 * CRUD e operações para grupos de contas 2FA
 */

import { request } from "./client";
import {
  TwoFAuthConfig,
  TwoFAuthGroup,
  TwoFAuthAccount,
  CreateGroupParams,
  UpdateGroupParams,
  AssignAccountsParams,
} from "./types";

// =============================================================================
// LISTAR GRUPOS
// =============================================================================

/**
 * Lista todos os grupos
 *
 * @param config - Configuração opcional
 * @returns Array de grupos
 */
export async function listGroups(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthGroup[]> {
  const data = await request<TwoFAuthGroup[] | { data: TwoFAuthGroup[] }>(
    "/groups",
    { method: "GET" },
    config
  );

  return Array.isArray(data) ? data : data.data || [];
}

// =============================================================================
// OBTER GRUPO
// =============================================================================

/**
 * Obtém um grupo específico pelo ID
 *
 * @param id - ID do grupo
 * @param config - Configuração opcional
 * @returns Grupo
 */
export async function getGroup(
  id: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthGroup> {
  return request<TwoFAuthGroup>(`/groups/${id}`, { method: "GET" }, config);
}

// =============================================================================
// CRIAR GRUPO
// =============================================================================

/**
 * Cria um novo grupo
 *
 * @param params - Dados do grupo
 * @param config - Configuração opcional
 * @returns Grupo criado
 */
export async function createGroup(
  params: CreateGroupParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthGroup> {
  return request<TwoFAuthGroup>(
    "/groups",
    { method: "POST", body: params },
    config
  );
}

// =============================================================================
// ATUALIZAR GRUPO
// =============================================================================

/**
 * Atualiza um grupo existente
 *
 * @param id - ID do grupo
 * @param params - Dados a atualizar
 * @param config - Configuração opcional
 * @returns Grupo atualizado
 */
export async function updateGroup(
  id: number,
  params: UpdateGroupParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthGroup> {
  return request<TwoFAuthGroup>(
    `/groups/${id}`,
    { method: "PUT", body: params },
    config
  );
}

// =============================================================================
// EXCLUIR GRUPO
// =============================================================================

/**
 * Exclui um grupo
 *
 * @param id - ID do grupo
 * @param config - Configuração opcional
 */
export async function deleteGroup(
  id: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(`/groups/${id}`, { method: "DELETE" }, config);
}

// =============================================================================
// ATRIBUIR CONTAS
// =============================================================================

/**
 * Atribui contas a um grupo
 *
 * @param groupId - ID do grupo
 * @param params - IDs das contas
 * @param config - Configuração opcional
 * @returns Grupo atualizado com contas
 */
export async function assignAccountsToGroup(
  groupId: number,
  params: AssignAccountsParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthGroup> {
  return request<TwoFAuthGroup>(
    `/groups/${groupId}/assign`,
    { method: "POST", body: params },
    config
  );
}

// =============================================================================
// LISTAR CONTAS DO GRUPO
// =============================================================================

/**
 * Lista as contas de um grupo
 *
 * @param groupId - ID do grupo
 * @param config - Configuração opcional
 * @returns Array de contas do grupo
 */
export async function listGroupAccounts(
  groupId: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount[]> {
  const data = await request<TwoFAuthAccount[] | { data: TwoFAuthAccount[] }>(
    `/groups/${groupId}/twofaccounts`,
    { method: "GET" },
    config
  );

  return Array.isArray(data) ? data : data.data || [];
}
