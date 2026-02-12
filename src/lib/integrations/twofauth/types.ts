/**
 * 2FAuth API Types
 *
 * Tipos centralizados para integração com a API 2FAuth
 * Documentação: https://docs.2fauth.app/api/
 */

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Configuração do cliente 2FAuth
 */
export interface TwoFAuthConfig {
  apiUrl?: string;
  token?: string;
  accountId?: string;
}

// =============================================================================
// CONTAS (TWOFACCOUNTS)
// =============================================================================

/**
 * Conta 2FA completa
 */
export interface TwoFAuthAccount {
  id: number;
  service: string | null;
  account: string | null;
  icon: string | null;
  otp_type: "totp" | "hotp" | "steamtotp";
  digits: number;
  algorithm: "sha1" | "sha256" | "sha512";
  period: number | null;
  counter: number | null;
  group_id: number | null;
}

/**
 * Dados para criar uma conta
 */
export interface CreateAccountParams {
  service: string;
  account?: string;
  icon?: string;
  otp_type: "totp" | "hotp" | "steamtotp";
  secret: string;
  digits?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
  period?: number;
  counter?: number;
  group_id?: number;
}

/**
 * Dados para atualizar uma conta
 */
export interface UpdateAccountParams {
  service?: string;
  account?: string;
  icon?: string;
  otp_type?: "totp" | "hotp" | "steamtotp";
  secret?: string;
  digits?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
  period?: number;
  counter?: number;
  group_id?: number;
}

/**
 * Parâmetros para reordenar contas
 */
export interface ReorderAccountsParams {
  orderedIds: number[];
}

// =============================================================================
// OTP
// =============================================================================

/**
 * Resposta de OTP da API 2FAuth
 */
export interface TwoFAuthOTPResponse {
  password: string;
  next_password?: string;
  otp_type: "totp" | "hotp" | "steamtotp";
  generated_at?: number;
  period?: number;
  counter?: number;
}

/**
 * Resultado de OTP simplificado
 */
export interface OTPResult {
  password: string;
  nextPassword?: string;
}

/**
 * Parâmetros para gerar OTP sob demanda
 */
export interface GenerateOTPParams {
  uri?: string;
  service?: string;
  account?: string;
  secret: string;
  otp_type: "totp" | "hotp" | "steamtotp";
  digits?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
  period?: number;
  counter?: number;
}

// =============================================================================
// GRUPOS
// =============================================================================

/**
 * Grupo de contas 2FA
 */
export interface TwoFAuthGroup {
  id: number;
  name: string;
  twofaccounts_count?: number;
}

/**
 * Dados para criar um grupo
 */
export interface CreateGroupParams {
  name: string;
}

/**
 * Dados para atualizar um grupo
 */
export interface UpdateGroupParams {
  name: string;
}

/**
 * Parâmetros para atribuir contas a um grupo
 */
export interface AssignAccountsParams {
  ids: number[];
}

// =============================================================================
// ÍCONES
// =============================================================================

/**
 * Resposta de upload de ícone
 */
export interface IconUploadResponse {
  filename: string;
}

// =============================================================================
// QR CODE
// =============================================================================

/**
 * Resposta de geração de QR Code
 */
export interface QRCodeResponse {
  qrcode: string; // Base64 encoded image
}

/**
 * Resultado de decodificação de QR Code
 */
export interface QRCodeDecodeResult {
  data: string; // URI otpauth://
}

// =============================================================================
// PREFERÊNCIAS DO USUÁRIO
// =============================================================================

/**
 * Preferências do usuário 2FAuth
 */
export interface TwoFAuthPreferences {
  AUTO_CLOSE_TIMEOUT: number;
  AUTO_SAVE_QRCODED_ACCOUNT: boolean;
  CLEAR_SEARCH_ON_COPY: boolean;
  CLOSE_OTP_ON_COPY: boolean;
  COPY_OTP_ON_DISPLAY: boolean;
  DEFAULT_CAPTURE_MODE: "livescan" | "upload" | "advancedForm";
  DISPLAY_MODE: "list" | "grid";
  FORMAT_PASSWORD: boolean;
  FORMAT_PASSWORD_BY: number;
  GET_OFFICIAL_ICONS: boolean;
  GET_OTP_ON_REQUEST: boolean;
  ICON_COLLECTION: string;
  ICON_PACK: string | null;
  ICON_SOURCE: "logolib" | "iconpack";
  ICON_VARIANT: "regular" | "light" | "dark";
  ICON_VARIANT_STRICT_FETCH: boolean;
  KICK_USER_AFTER: number;
  LANG: string;
  NOTIFY_ON_FAILED_LOGIN: boolean;
  NOTIFY_ON_NEW_AUTH_DEVICE: boolean;
  REMEMBER_ACTIVE_GROUP: boolean;
  REVEAL_DOTTED_OTP: boolean;
  SHOW_ACCOUNTS_ICONS: boolean;
  SHOW_EMAIL_IN_FOOTER: boolean;
  SHOW_NEXT_OTP: boolean;
  SHOW_OTP_AS_DOT: boolean;
  SORT_CASE_SENSITIVE: boolean;
  SORT_ORDER: "asc" | "desc";
  THEME: "system" | "light" | "dark";
  TIMEZONE: string;
  USE_BASIC_QRCODE_READER: boolean;
  USE_DIRECT_CAPTURE: boolean;
  VIEW_DEFAULT_GROUP_ON_COPY: boolean;
}

/**
 * Nome de preferência válido
 */
export type PreferenceName = keyof TwoFAuthPreferences;

/**
 * Valor de preferência
 */
export type PreferenceValue = TwoFAuthPreferences[PreferenceName];

// =============================================================================
// CONFIGURAÇÕES (ADMIN)
// =============================================================================

/**
 * Configurações administrativas do 2FAuth
 */
export interface TwoFAuthSettings {
  CHECK_FOR_UPDATE: boolean;
  DEFAULT_CAPTURE_MODE: string;
  DEFAULT_GROUP: number;
  DISABLE_REGISTRATION: boolean;
  ENABLE_BROADCAST: boolean;
  GET_OFFICIAL_ICONS: boolean;
  ICON_COLLECTION: string;
  LAST_RADAR_SCAN: number;
  RESTRICT_LIST: boolean;
  RESTRICT_RULE: string;
  [key: string]: unknown;
}

/**
 * Nome de configuração
 */
export type SettingName = string;

/**
 * Valor de configuração
 */
export type SettingValue = unknown;

// =============================================================================
// USUÁRIO
// =============================================================================

/**
 * Dados do usuário 2FAuth
 */
export interface TwoFAuthUser {
  id: number;
  name: string;
  email: string;
  oauth_provider: string | null;
  is_admin: boolean;
}

/**
 * Dados para atualizar o usuário
 */
export interface UpdateUserParams {
  name?: string;
  email?: string;
  password?: string;
  current_password?: string;
}

// =============================================================================
// ERROS
// =============================================================================

/**
 * Resposta de erro da API 2FAuth
 */
export interface TwoFAuthErrorResponse {
  message: string;
  reason?: {
    [key: string]: string;
  };
}

/**
 * Erro customizado para respostas da API 2FAuth
 */
export class TwoFAuthError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public reason?: { [key: string]: string }
  ) {
    super(message);
    this.name = "TwoFAuthError";
  }
}

// =============================================================================
// IMPORT/EXPORT
// =============================================================================

/**
 * Formato de exportação
 */
export type ExportFormat = "json" | "txt";

/**
 * Dados de migração/importação
 */
export interface MigrationData {
  payload: string;
  withSecret?: boolean;
}
