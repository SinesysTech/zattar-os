/**
 * 2FAuth Integration Library
 *
 * Biblioteca completa para integração com a API 2FAuth
 *
 * @example
 * ```ts
 * import { listAccounts, getOTP, listGroups } from '@/lib/integrations/twofauth';
 *
 * // Listar contas
 * const accounts = await listAccounts();
 *
 * // Obter OTP de uma conta
 * const otp = await getOTP(accountId);
 *
 * // Listar grupos
 * const groups = await listGroups();
 * ```
 */

// =============================================================================
// TIPOS
// =============================================================================

export * from "./types";

// =============================================================================
// CLIENTE
// =============================================================================

export { checkConnection } from "./client";

// =============================================================================
// CONTAS (ACCOUNTS)
// =============================================================================

export {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  deleteAccounts,
  reorderAccounts,
  getOTP,
  getDefaultOTP,
  exportAccounts,
  importAccounts,
} from "./accounts";

// =============================================================================
// OTP (GERAÇÃO SOB DEMANDA)
// =============================================================================

export { generateOTP, generateTOTP, generateHOTP } from "./otp";

// =============================================================================
// GRUPOS
// =============================================================================

export {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  assignAccountsToGroup,
  listGroupAccounts,
} from "./groups";

// =============================================================================
// ÍCONES
// =============================================================================

export { uploadIcon, deleteIcon, fetchOfficialIcon } from "./icons";

// =============================================================================
// QR CODE
// =============================================================================

export { generateQRCode, decodeQRCode, decodeQRCodeFile } from "./qrcode";

// =============================================================================
// PREFERÊNCIAS
// =============================================================================

export {
  getPreferences,
  getPreference,
  updatePreference,
  updatePreferences,
  getTheme,
  setTheme,
  getDisplayMode,
  setDisplayMode,
  getCopyOnDisplay,
  setCopyOnDisplay,
} from "./preferences";

// =============================================================================
// CONFIGURAÇÕES (ADMIN)
// =============================================================================

export {
  getSettings,
  getSetting,
  updateSetting,
  updateSettings,
  isRegistrationDisabled,
  setRegistrationDisabled,
  getOfficialIconsSetting,
  setOfficialIconsSetting,
} from "./settings";

// =============================================================================
// USUÁRIO
// =============================================================================

export {
  getUser,
  getUserName,
  updateUser,
  deleteUser,
  isAdmin,
} from "./user";
