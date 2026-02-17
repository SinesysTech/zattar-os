/**
 * 2FAuth User Module
 *
 * Gerenciamento do usuário 2FAuth
 */

import { request } from "./client";
import { TwoFAuthConfig, TwoFAuthUser, UpdateUserParams } from "./types";

// =============================================================================
// OBTER USUÁRIO
// =============================================================================

/**
 * Obtém os dados do usuário atual
 *
 * @param config - Configuração opcional
 * @returns Dados do usuário
 */
export async function getUser(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthUser> {
  return request<TwoFAuthUser>("/user", { method: "GET" }, config);
}

/**
 * Obtém apenas o nome do usuário
 *
 * @param config - Configuração opcional
 * @returns Nome do usuário
 */
export async function getUserName(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<string> {
  const user = await getUser(config);
  return user.name;
}

// =============================================================================
// ATUALIZAR USUÁRIO
// =============================================================================

/**
 * Atualiza os dados do usuário
 *
 * @param params - Dados a atualizar
 * @param config - Configuração opcional
 * @returns Usuário atualizado
 */
export async function updateUser(
  params: UpdateUserParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthUser> {
  return request<TwoFAuthUser>(
    "/user",
    { method: "PUT", body: params },
    config
  );
}

// =============================================================================
// EXCLUIR USUÁRIO
// =============================================================================

/**
 * Exclui a conta do usuário
 *
 * @param password - Senha atual para confirmação
 * @param config - Configuração opcional
 */
export async function deleteUser(
  password: string,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(
    "/user",
    { method: "DELETE", body: { password } },
    config
  );
}

// =============================================================================
// VERIFICAÇÕES
// =============================================================================

/**
 * Verifica se o usuário é administrador
 *
 * @param config - Configuração opcional
 * @returns true se o usuário é admin
 */
export async function isAdmin(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<boolean> {
  const user = await getUser(config);
  return user.is_admin;
}
