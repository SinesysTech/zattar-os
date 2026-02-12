/**
 * 2FAuth Settings Module
 *
 * Gerenciamento de configurações administrativas
 */

import { request } from "./client";
import { TwoFAuthConfig, TwoFAuthSettings, SettingName, SettingValue } from "./types";

// =============================================================================
// OBTER TODAS AS CONFIGURAÇÕES
// =============================================================================

/**
 * Obtém todas as configurações (requer admin)
 *
 * @param config - Configuração opcional
 * @returns Objeto com todas as configurações
 */
export async function getSettings(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<Partial<TwoFAuthSettings>> {
  return request<Partial<TwoFAuthSettings>>(
    "/settings",
    { method: "GET" },
    config
  );
}

// =============================================================================
// OBTER CONFIGURAÇÃO ESPECÍFICA
// =============================================================================

/**
 * Obtém uma configuração específica
 *
 * @param name - Nome da configuração
 * @param config - Configuração opcional
 * @returns Valor da configuração
 */
export async function getSetting(
  name: SettingName,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<SettingValue> {
  const data = await request<{ value: SettingValue }>(
    `/settings/${name}`,
    { method: "GET" },
    config
  );

  return data.value;
}

// =============================================================================
// ATUALIZAR CONFIGURAÇÃO
// =============================================================================

/**
 * Atualiza uma configuração (requer admin)
 *
 * @param name - Nome da configuração
 * @param value - Novo valor
 * @param config - Configuração opcional
 */
export async function updateSetting(
  name: SettingName,
  value: SettingValue,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(
    `/settings/${name}`,
    { method: "PUT", body: { value } },
    config
  );
}

// =============================================================================
// ATUALIZAR MÚLTIPLAS CONFIGURAÇÕES
// =============================================================================

/**
 * Atualiza múltiplas configurações de uma vez
 *
 * @param settings - Objeto com configurações a atualizar
 * @param config - Configuração opcional
 */
export async function updateSettings(
  settings: Partial<TwoFAuthSettings>,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  const entries = Object.entries(settings);

  await Promise.all(
    entries.map(([name, value]) => updateSetting(name, value, config))
  );
}

// =============================================================================
// CONFIGURAÇÕES COMUNS
// =============================================================================

/**
 * Verifica se o registro está desabilitado
 */
export async function isRegistrationDisabled(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<boolean> {
  return getSetting("DISABLE_REGISTRATION", config) as Promise<boolean>;
}

/**
 * Define se o registro está desabilitado
 */
export async function setRegistrationDisabled(
  disabled: boolean,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  return updateSetting("DISABLE_REGISTRATION", disabled, config);
}

/**
 * Verifica se deve buscar ícones oficiais
 */
export async function getOfficialIconsSetting(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<boolean> {
  return getSetting("GET_OFFICIAL_ICONS", config) as Promise<boolean>;
}

/**
 * Define se deve buscar ícones oficiais
 */
export async function setOfficialIconsSetting(
  enabled: boolean,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  return updateSetting("GET_OFFICIAL_ICONS", enabled, config);
}
