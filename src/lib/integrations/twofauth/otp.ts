/**
 * 2FAuth OTP Module
 *
 * Geração de OTP sob demanda (sem salvar conta)
 */

import { request } from "./client";
import {
  GenerateOTPParams,
  OTPResult,
  TwoFAuthOTPResponse,
  TwoFAuthError,
} from "./types";

/**
 * Gera um OTP sob demanda sem precisar salvar a conta
 *
 * @param params - Parâmetros para gerar o OTP
 * @returns OTP gerado
 */
export async function generateOTP(
  params: GenerateOTPParams,
): Promise<OTPResult> {
  const data = await request<TwoFAuthOTPResponse>(
    "/otp/generate",
    { method: "POST", body: params },
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
