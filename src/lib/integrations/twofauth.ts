/**
 * 2FAuth Integration - Arquivo de Compatibilidade
 *
 * Este arquivo mantém compatibilidade com importações existentes.
 * Para novos desenvolvimentos, importe de '@/lib/integrations/twofauth/'
 *
 * @example
 * ```ts
 * // Novo (recomendado) - acesso completo à API
 * import { listAccounts, getOTP, createAccount, listGroups } from '@/lib/integrations/twofauth/';
 *
 * // Legado (compatibilidade)
 * import { listAccounts, getOTP, TwoFAuthError } from '@/lib/integrations/twofauth';
 * ```
 */

// Tipos
export type {
  TwoFAuthConfig,
  TwoFAuthAccount,
  TwoFAuthOTPResponse,
  OTPResult,
  TwoFAuthErrorResponse,
  TwoFAuthGroup,
  TwoFAuthPreferences,
  TwoFAuthSettings,
  TwoFAuthUser,
  CreateAccountParams,
  UpdateAccountParams,
  CreateGroupParams,
  UpdateGroupParams,
} from "./twofauth/";

// Erro
export { TwoFAuthError } from "./twofauth/";

// Funções de contas (compatibilidade)
export { listAccounts } from "./twofauth/accounts";
export { getDefaultOTP as getOTP } from "./twofauth/accounts";
export { getOTP as getOTPByAccountId } from "./twofauth/accounts";

// Funções adicionais úteis
export { checkConnection } from "./twofauth/client";
