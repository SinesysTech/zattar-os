/**
 * 2FAuth Preferences Module
 *
 * Gerenciamento de preferências do usuário
 */

import { request } from "./client";
import {
  TwoFAuthConfig,
  TwoFAuthPreferences,
  PreferenceName,
  PreferenceValue,
} from "./types";

// =============================================================================
// OBTER TODAS AS PREFERÊNCIAS
// =============================================================================

/**
 * Obtém todas as preferências do usuário
 *
 * @param config - Configuração opcional
 * @returns Objeto com todas as preferências
 */
export async function getPreferences(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<Partial<TwoFAuthPreferences>> {
  return request<Partial<TwoFAuthPreferences>>(
    "/preferences",
    { method: "GET" },
    config
  );
}

// =============================================================================
// OBTER PREFERÊNCIA ESPECÍFICA
// =============================================================================

/**
 * Obtém uma preferência específica
 *
 * @param name - Nome da preferência
 * @param config - Configuração opcional
 * @returns Valor da preferência
 */
export async function getPreference<K extends PreferenceName>(
  name: K,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthPreferences[K]> {
  const data = await request<{ value: TwoFAuthPreferences[K] }>(
    `/preferences/${name}`,
    { method: "GET" },
    config
  );

  return data.value;
}

// =============================================================================
// ATUALIZAR PREFERÊNCIA
// =============================================================================

/**
 * Atualiza uma preferência
 *
 * @param name - Nome da preferência
 * @param value - Novo valor
 * @param config - Configuração opcional
 */
export async function updatePreference<K extends PreferenceName>(
  name: K,
  value: TwoFAuthPreferences[K],
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(
    `/preferences/${name}`,
    { method: "PUT", body: { value } },
    config
  );
}

// =============================================================================
// ATUALIZAR MÚLTIPLAS PREFERÊNCIAS
// =============================================================================

/**
 * Atualiza múltiplas preferências de uma vez
 *
 * @param preferences - Objeto com preferências a atualizar
 * @param config - Configuração opcional
 */
export async function updatePreferences(
  preferences: Partial<TwoFAuthPreferences>,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  const entries = Object.entries(preferences) as [PreferenceName, PreferenceValue][];

  await Promise.all(
    entries.map(([name, value]) =>
      updatePreference(name, value as TwoFAuthPreferences[typeof name], config)
    )
  );
}

// =============================================================================
// PREFERÊNCIAS COMUNS
// =============================================================================

/**
 * Obtém o tema atual
 */
export async function getTheme(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthPreferences["THEME"]> {
  return getPreference("THEME", config);
}

/**
 * Define o tema
 */
export async function setTheme(
  theme: TwoFAuthPreferences["THEME"],
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  return updatePreference("THEME", theme, config);
}

/**
 * Obtém o modo de exibição
 */
export async function getDisplayMode(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<TwoFAuthPreferences["DISPLAY_MODE"]> {
  return getPreference("DISPLAY_MODE", config);
}

/**
 * Define o modo de exibição
 */
export async function setDisplayMode(
  mode: TwoFAuthPreferences["DISPLAY_MODE"],
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  return updatePreference("DISPLAY_MODE", mode, config);
}

/**
 * Verifica se deve copiar OTP ao exibir
 */
export async function getCopyOnDisplay(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<boolean> {
  return getPreference("COPY_OTP_ON_DISPLAY", config);
}

/**
 * Define se deve copiar OTP ao exibir
 */
export async function setCopyOnDisplay(
  value: boolean,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  return updatePreference("COPY_OTP_ON_DISPLAY", value, config);
}
