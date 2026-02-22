/**
 * 2FAuth Accounts Module
 *
 * CRUD e operações para contas 2FA (twofaccounts)
 */

import { request } from "./client";
import { load2FAuthConfig } from "./config-loader";
import {
  TwoFAuthConfig,
  TwoFAuthAccount,
  CreateAccountParams,
  UpdateAccountParams,
  ReorderAccountsParams,
  OTPResult,
  TwoFAuthOTPResponse,
  TwoFAuthError,
  ExportFormat,
  MigrationData,
} from "./types";

// =============================================================================
// LISTAR CONTAS
// =============================================================================

/**
 * Lista todas as contas do 2FAuth
 *
 * @param options - Opções de filtro
 * @param options.groupId - Filtrar contas por grupo
 * @param config - Configuração opcional (usa env se não fornecido)
 * @returns Array de contas 2FAuth
 */
export async function listAccounts(
  options?: { groupId?: number },
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount[]> {
  let endpoint = "/twofaccounts";
  if (options?.groupId) {
    endpoint += `?group_id=${options.groupId}`;
  }

  const data = await request<TwoFAuthAccount[] | { data: TwoFAuthAccount[] }>(
    endpoint,
    { method: "GET" },
    config
  );

  // A API pode retornar array direto ou { data: [...] }
  return Array.isArray(data) ? data : data.data || [];
}

// =============================================================================
// OBTER CONTA
// =============================================================================

/**
 * Obtém uma conta específica pelo ID
 *
 * @param id - ID da conta
 * @param config - Configuração opcional
 * @returns Conta 2FAuth
 */
export async function getAccount(
  id: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount> {
  return request<TwoFAuthAccount>(`/twofaccounts/${id}`, { method: "GET" }, config);
}

// =============================================================================
// CRIAR CONTA
// =============================================================================

/**
 * Cria uma nova conta 2FA
 *
 * @param params - Dados da conta
 * @param config - Configuração opcional
 * @returns Conta criada
 */
export async function createAccount(
  params: CreateAccountParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount> {
  return request<TwoFAuthAccount>(
    "/twofaccounts",
    { method: "POST", body: params },
    config
  );
}

// =============================================================================
// ATUALIZAR CONTA
// =============================================================================

/**
 * Atualiza uma conta existente
 *
 * @param id - ID da conta
 * @param params - Dados a atualizar
 * @param config - Configuração opcional
 * @returns Conta atualizada
 */
export async function updateAccount(
  id: number,
  params: UpdateAccountParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount> {
  return request<TwoFAuthAccount>(
    `/twofaccounts/${id}`,
    { method: "PUT", body: params },
    config
  );
}

// =============================================================================
// EXCLUIR CONTA
// =============================================================================

/**
 * Exclui uma conta
 *
 * @param id - ID da conta
 * @param config - Configuração opcional
 */
export async function deleteAccount(
  id: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(`/twofaccounts/${id}`, { method: "DELETE" }, config);
}

/**
 * Exclui múltiplas contas
 *
 * @param ids - IDs das contas
 * @param config - Configuração opcional
 */
export async function deleteAccounts(
  ids: number[],
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(
    "/twofaccounts",
    { method: "DELETE", body: { ids } },
    config
  );
}

// =============================================================================
// REORDENAR CONTAS
// =============================================================================

/**
 * Reordena as contas
 *
 * @param params - IDs na nova ordem
 * @param config - Configuração opcional
 */
export async function reorderAccounts(
  params: ReorderAccountsParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(
    "/twofaccounts/reorder",
    { method: "PATCH", body: params },
    config
  );
}

// =============================================================================
// OTP
// =============================================================================

/**
 * Obtém o código OTP de uma conta
 *
 * @param accountId - ID da conta
 * @param config - Configuração opcional
 * @returns OTP atual e próximo (se disponível)
 */
export async function getOTP(
  accountId: number | string,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<OTPResult> {
  const data = await request<TwoFAuthOTPResponse>(
    `/twofaccounts/${accountId}/otp`,
    { method: "GET" },
    config
  );

  if (!data.password) {
    throw new TwoFAuthError(500, "2FAuth retornou resposta sem campo password", {
      response: JSON.stringify(data),
    });
  }

  if (data.password.length < 6 || data.password.length > 10) {
    throw new TwoFAuthError(
      500,
      `2FAuth retornou password com tamanho inválido: ${data.password.length} caracteres`,
      { password_length: data.password.length.toString() }
    );
  }

  return {
    password: data.password,
    nextPassword: data.next_password,
  };
}

/**
 * Obtém OTP usando a conta padrão configurada no banco de dados.
 * Carrega apiUrl, token e accountId da tabela integracoes.
 *
 * @returns OTP atual e próximo (se disponível)
 */
export async function getDefaultOTP(): Promise<OTPResult> {
  const dbConfig = await load2FAuthConfig();

  if (!dbConfig?.accountId) {
    throw new TwoFAuthError(
      500,
      "2FAuth: ID da conta não configurado. Configure em Configurações > Integrações."
    );
  }

  return getOTP(dbConfig.accountId, dbConfig);
}

// =============================================================================
// EXPORT/IMPORT
// =============================================================================

/**
 * Exporta contas para backup
 *
 * @param format - Formato de exportação (json ou txt)
 * @param config - Configuração opcional
 * @returns Dados exportados
 */
export async function exportAccounts(
  format: ExportFormat = "json",
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<string> {
  const endpoint = `/twofaccounts/export?format=${format}`;
  return request<string>(endpoint, { method: "GET" }, config);
}

/**
 * Importa contas de um backup
 *
 * @param data - Dados de migração
 * @param config - Configuração opcional
 * @returns Contas importadas
 */
export async function importAccounts(
  data: MigrationData,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthAccount[]> {
  const result = await request<TwoFAuthAccount[] | { data: TwoFAuthAccount[] }>(
    "/twofaccounts/migration",
    { method: "POST", body: data },
    config
  );

  return Array.isArray(result) ? result : result.data || [];
}
