/**
 * 2FAuth OTP Module
 *
 * Geração de OTP sob demanda (sem salvar conta)
 */

import { request } from "./client";
import {
  TwoFAuthConfig,
  GenerateOTPParams,
  OTPResult,
  TwoFAuthOTPResponse,
  TwoFAuthError,
} from "./types";

// =============================================================================
// GERAR OTP SOB DEMANDA
// =============================================================================

/**
 * Gera um OTP sob demanda sem precisar salvar a conta
 *
 * @param params - Parâmetros para gerar o OTP
 * @param config - Configuração opcional
 * @returns OTP gerado
 */
export async function generateOTP(
  params: GenerateOTPParams,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<OTPResult> {
  const data = await request<TwoFAuthOTPResponse>(
    "/otp/generate",
    { method: "POST", body: params },
    config
  );

  if (!data.password) {
    throw new TwoFAuthError(500, "2FAuth retornou resposta sem campo password", {
      response: JSON.stringify(data),
    });
  }

  return {
    password: data.password,
    nextPassword: data.next_password,
  };
}

/**
 * Gera um OTP TOTP sob demanda
 *
 * @param secret - Segredo em base32
 * @param options - Opções adicionais
 * @param config - Configuração opcional
 * @returns OTP gerado
 */
export async function generateTOTP(
  secret: string,
  options?: {
    digits?: number;
    period?: number;
    algorithm?: "sha1" | "sha256" | "sha512" | "md5";
  },
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<OTPResult> {
  return generateOTP(
    {
      secret,
      otp_type: "totp",
      digits: options?.digits ?? 6,
      period: options?.period ?? 30,
      algorithm: options?.algorithm ?? "sha1",
    },
    config
  );
}

/**
 * Gera um OTP HOTP sob demanda
 *
 * @param secret - Segredo em base32
 * @param counter - Contador atual
 * @param options - Opções adicionais
 * @param config - Configuração opcional
 * @returns OTP gerado
 */
export async function generateHOTP(
  secret: string,
  counter: number,
  options?: {
    digits?: number;
    algorithm?: "sha1" | "sha256" | "sha512" | "md5";
  },
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<OTPResult> {
  return generateOTP(
    {
      secret,
      otp_type: "hotp",
      counter,
      digits: options?.digits ?? 6,
      algorithm: options?.algorithm ?? "sha1",
    },
    config
  );
}
